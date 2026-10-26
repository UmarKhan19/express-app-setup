# Generic deployment examples

> **Generic deployment patterns, not a verified path for this starter**

This guide contains deployment patterns and sample configuration for reference.

> These are generic deployment examples, not a verified deployment procedure for this repository. The Compose file contains local dependencies only; there is no API Dockerfile/service, test command, or migration script in the project. Production deployment and security have not been established.

## 📚 Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Methods](#deployment-methods)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Monitoring Setup](#monitoring-setup)
- [Post-Deployment](#post-deployment)

## Overview

Generic deployment approaches include:

- **Docker Compose** - Simple, single-server deployments
- **Kubernetes** - Orchestrated deployments (example only; no manifests are included)
- **Cloud Platforms** - AWS, GCP, Azure
- **Platform as a Service** - Heroku, Railway, Render

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing
- [ ] No linting errors
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] CHANGELOG updated

### Security

- [ ] Environment variables configured
- [ ] Secrets stored securely (not in code)
- [ ] SSL/TLS certificates configured
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Performance

- [ ] Database indexes created
- [ ] Cache configured
- [ ] CDN configured (for static assets)
- [ ] Compression enabled
- [ ] Connection pooling configured

### Monitoring

- [ ] Logging configured
- [ ] Metrics collection enabled
- [ ] Alerts configured
- [ ] Health checks implemented
- [ ] Error tracking setup (Sentry, etc.)

## Deployment Methods

### Method 1: Docker Compose

**Best for**: Small to medium applications, single-server deployments

```bash
# 1. Build production image
docker build -t myapp:latest .

# 2. Push to registry (optional)
docker tag myapp:latest registry.example.com/myapp:latest
docker push registry.example.com/myapp:latest

# 3. Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify deployment
docker-compose ps
docker-compose logs -f app
```

See [Docker Guide](DOCKER.md) for details.

### Method 2: Kubernetes

**Best for**: Large-scale, highly available deployments

```bash
# 1. Build and push image
docker build -t myapp:v1.0.0 .
docker push registry.example.com/myapp:v1.0.0

# 2. Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 3. Verify deployment
kubectl get pods -n myapp
kubectl logs -f deployment/myapp -n myapp
```

See [Scaling Guide](SCALING.md) for Kubernetes details.

### Method 3: Cloud Platforms

#### AWS Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize EB
eb init

# 3. Create environment
eb create production

# 4. Deploy
eb deploy

# 5. Open application
eb open
```

#### Google Cloud Run

```bash
# 1. Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/myapp

# 2. Deploy to Cloud Run
gcloud run deploy myapp \
  --image gcr.io/PROJECT_ID/myapp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure App Service

```bash
# 1. Create resource group
az group create --name myapp-rg --location eastus

# 2. Create App Service plan
az appservice plan create --name myapp-plan --resource-group myapp-rg --sku B1 --is-linux

# 3. Create web app
az webapp create --resource-group myapp-rg --plan myapp-plan --name myapp --deployment-container-image-name registry.example.com/myapp:latest
```

## Environment Configuration

### Production Environment Variables

File: `.env.production`

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://username:password@mongodb-host:27017/myapp?authSource=admin
MONGODB_MAX_POOL_SIZE=100

# Redis
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_MAX_RETRIES=3

# Kafka
KAFKA_BROKERS=kafka-host:9092
KAFKA_CLIENT_ID=myapp-production
KAFKA_GROUP_ID=myapp-consumer-group

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-api-key
EMAIL_FROM=noreply@example.com

# Observability
PROMETHEUS_PORT=9090
LOKI_URL=http://loki:3100
TEMPO_URL=http://tempo:3200

# Security
JWT_SECRET=your-very-secure-jwt-secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://example.com,https://www.example.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

See [Environment Guide](ENVIRONMENT.md) for all variables.

## Database Migration

### Before Deployment

```bash
# 1. Backup current database
mongodump --uri="mongodb://localhost:27017/myapp" --out=/backup/$(date +%Y%m%d)

# 2. Test migration on staging
NODE_ENV=staging npm run migrate

# 3. Run migration on production
NODE_ENV=production npm run migrate

# 4. Verify data integrity
npm run verify-data
```

### Rollback Plan

```bash
# If migration fails, restore from backup
mongorestore --uri="mongodb://localhost:27017/myapp" /backup/20250101
```

## Monitoring Setup

### Health Checks

Ensure health check endpoints are accessible:

```bash
# Application health
curl https://api.example.com/health

# Database health
curl https://api.example.com/health/db

# Cache health
curl https://api.example.com/health/cache
```

### Logging

Configure log aggregation:

```yaml
# Configure log shipping to centralized service
logging:
  driver: syslog
  options:
    syslog-address: 'udp://logs.example.com:514'
    tag: 'myapp'
```

### Metrics

Ensure Prometheus can scrape metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'production'
    static_configs:
      - targets: ['api.example.com:9090']
```

### Alerts

Configure critical alerts:

```yaml
groups:
  - name: production_critical
    rules:
      - alert: ServiceDown
        expr: up{job="production"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Production service is down'
```

## Post-Deployment

### Verification Steps

1. **Health Checks**

```bash
# Check application health
curl https://api.example.com/health

# Check all services
docker-compose ps  # or kubectl get pods
```

2. **Smoke Tests**

```bash
# Test critical endpoints
npm run test:smoke:production
```

3. **Monitor Logs**

```bash
# Watch logs for errors
tail -f logs/error.log
# or
kubectl logs -f deployment/myapp
```

4. **Check Metrics**

- Open Grafana dashboard
- Verify metrics are being collected
- Check error rates and latency

5. **Test Key Features**

- User registration
- Login
- Critical business operations

### Rollback Procedure

If deployment fails:

```bash
# Method 1: Docker - Revert to previous image
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d myapp:previous-version

# Method 2: Kubernetes - Rollback deployment
kubectl rollout undo deployment/myapp -n production

# Method 3: Git - Revert commit and redeploy
git revert HEAD
git push origin main
# Trigger CI/CD pipeline
```

## CI/CD Pipeline

### GitHub Actions Example

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push myapp:${{ github.sha }}

      - name: Deploy to production
        run: |
          # Your deployment command here
          kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
```

## Security Best Practices

### 1. Secrets Management

```bash
# Use environment-specific secrets
# Never commit .env files to git

# Use secret management services:
# - AWS Secrets Manager
# - Google Secret Manager
# - Azure Key Vault
# - HashiCorp Vault
```

### 2. SSL/TLS

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### 3. Firewall Rules

```bash
# Allow only necessary ports
# - 443 (HTTPS)
# - 22 (SSH, from specific IPs only)
# Block all other ports
```

## Performance Optimization

### 1. Enable Compression

```typescript
// app.ts
import compression from 'compression';
app.use(compression());
```

### 2. Use CDN

```typescript
// Serve static assets from CDN
const CDN_URL = process.env.CDN_URL || '';
app.use(
  '/static',
  express.static('public', {
    maxAge: '1y',
    setHeaders: (res) => {
      res.set('Cache-Control', 'public, max-age=31536000');
    },
  })
);
```

### 3. Database Optimization

```typescript
// Connection pooling
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
});
```

## Backup Strategy

### Automated Backups

```bash
# Daily database backup
0 2 * * * mongodump --uri=$MONGODB_URI --out=/backups/$(date +\%Y\%m\%d) && find /backups -mtime +7 -delete
```

### Backup Verification

```bash
# Test restore monthly
mongorestore --uri=$MONGODB_URI_TEST /backups/latest
npm run verify-data
```

## Related Documentation

- **[Docker Guide](DOCKER.md)** - Docker setup and configuration
- **[Environment Guide](ENVIRONMENT.md)** - Environment variables
- **[Scaling Guide](SCALING.md)** - Horizontal and vertical scaling
- **[Troubleshooting](../guides/TROUBLESHOOTING.md)** - Common deployment issues

---

**Remember**: Test thoroughly in staging before deploying to production!
