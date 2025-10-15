# Docker Guide

> **Containerization with Docker and Docker Compose**

Complete guide to Docker setup, configuration, and best practices.

## 📚 Table of Contents

- [Dockerfile](#dockerfile)
- [Docker Compose](#docker-compose)
- [Multi-Stage Builds](#multi-stage-builds)
- [Production Configuration](#production-configuration)
- [Best Practices](#best-practices)

## Dockerfile

### Development Dockerfile

File: `Dockerfile.dev`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

### Production Dockerfile

File: `Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
```

## Docker Compose

### Development Configuration

File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: backend-dev
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/myapp
      - REDIS_HOST=redis
      - KAFKA_BROKERS=kafka:9092
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - mongodb
      - redis
      - kafka
    networks:
      - app-network

  mongodb:
    image: mongo:7.0
    container_name: mongodb-dev
    ports:
      - '27017:27017'
    volumes:
      - mongodb-data:/data/db
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: redis-dev
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    networks:
      - app-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka-dev
    ports:
      - '9092:9092'
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    depends_on:
      - zookeeper
    networks:
      - app-network

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper-dev
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - app-network

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus-dev
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    networks:
      - app-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana-dev
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana:/etc/grafana/provisioning
    networks:
      - app-network

volumes:
  mongodb-data:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  app-network:
    driver: bridge
```

### Production Configuration

File: `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  app:
    image: registry.example.com/myapp:${VERSION:-latest}
    container_name: backend-prod
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    env_file:
      - .env.production
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  mongodb:
    image: mongo:7.0
    container_name: mongodb-prod
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb-data:/data/db
      - ./backups:/backups
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: redis-prod
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: nginx-prod
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

volumes:
  mongodb-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

## Multi-Stage Builds

Benefits:

- Smaller final image size
- Faster builds (cached layers)
- More secure (no dev dependencies in production)

Example:

```dockerfile
# Build stage - includes dev dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Production stage - only runtime dependencies
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
CMD ["node", "dist/server.js"]
```

## Production Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://username:password@mongodb:27017/myapp
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure-password
```

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Best Practices

### 1. Use .dockerignore

File: `.dockerignore`

```
node_modules
npm-debug.log
dist
.git
.env
.env.*
*.md
.vscode
.idea
coverage
.DS_Store
```

### 2. Layer Caching

```dockerfile
# ✅ Good - Copy package files first for better caching
COPY package*.json ./
RUN npm ci
COPY . .

# ❌ Bad - Copy everything first
COPY . .
RUN npm ci
```

### 3. Security

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Don't use latest tag
FROM node:18-alpine  # ✅ Good - Specific version
FROM node:latest     # ❌ Bad - Unpredictable
```

### 4. Image Size

```dockerfile
# Use Alpine for smaller images
FROM node:18-alpine  # ~100MB
FROM node:18         # ~900MB

# Clean up after install
RUN npm ci && npm cache clean --force
```

### 5. Build Arguments

```dockerfile
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build with:
# docker build --build-arg NODE_ENV=development .
```

## Commands

### Building

```bash
# Build development image
docker-compose build

# Build production image
docker build -t myapp:v1.0.0 .

# Build with no cache
docker build --no-cache -t myapp:v1.0.0 .
```

### Running

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d app

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Debugging

```bash
# Execute command in running container
docker-compose exec app sh

# View container details
docker inspect backend-dev

# View resource usage
docker stats

# View processes
docker-compose top
```

### Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check events
docker events

# Inspect container
docker inspect backend-dev
```

### Connection Issues

```bash
# Check network
docker network ls
docker network inspect app-network

# Test connectivity
docker-compose exec app ping mongodb
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase resources in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

## Related Documentation

- **[Deployment Guide](README.md)** - General deployment
- **[Environment Guide](ENVIRONMENT.md)** - Environment configuration
- **[Scaling Guide](SCALING.md)** - Scaling strategies

---

**Remember**: Always use multi-stage builds and non-root users in production!
