# Scaling Guide

> **Horizontal and vertical scaling strategies**

## Horizontal Scaling

### Load Balancing with Nginx

```nginx
upstream backend {
    least_conn;
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml myapp

# Scale service
docker service scale myapp_app=5
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: myapp:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: '512Mi'
              cpu: '500m'
            limits:
              memory: '1Gi'
              cpu: '1000m'
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Vertical Scaling

### Increase Resources

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '4' # Increase from 2
          memory: 4G # Increase from 2G
```

### Database Optimization

```typescript
// Increase connection pool
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 200, // Increase from 100
  minPoolSize: 20, // Increase from 10
});
```

## Caching Strategy

### Redis Cluster

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --cluster-enabled yes
  deploy:
    replicas: 6
```

### Application-Level Caching

```typescript
// Cache expensive operations
const result = await cacheService.remember(
  'expensive-operation',
  3600,
  async () => {
    return await expensiveOperation();
  }
);
```

## Database Sharding

### MongoDB Sharding

```javascript
// Enable sharding on collection
sh.enableSharding('myapp');
sh.shardCollection('myapp.users', { _id: 'hashed' });
```

## Performance Monitoring

### Key Metrics

- Response time (aim: < 200ms)
- Throughput (requests/second)
- Error rate (aim: < 1%)
- CPU usage (aim: < 70%)
- Memory usage (aim: < 80%)

### Auto-Scaling Rules

Scale up when:

- CPU > 70% for 5 minutes
- Memory > 80% for 5 minutes
- Request queue > 100

Scale down when:

- CPU < 30% for 10 minutes
- Memory < 50% for 10 minutes

Related: [Deployment Guide](README.md) | [Docker Guide](DOCKER.md)
