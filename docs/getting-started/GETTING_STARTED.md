# Getting Started Guide

Welcome to the Backend Part 2 project! This guide will help you set up your development environment and get the application running locally.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)

### Recommended

- **Git** for version control
- **Visual Studio Code** or your preferred IDE
- **Postman** or **Insomnia** for API testing
- **MongoDB Compass** for database GUI (optional)

### Verify Installation

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check Docker version
docker --version
# Should output: Docker version 20.x.x or higher

# Check Docker Compose version
docker-compose --version
# Should output: Docker Compose version 2.x.x or higher
```

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd express-app-setup
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Express.js, TypeScript, Mongoose
- Redis, BullMQ, KafkaJS
- OpenTelemetry, Winston, Prometheus client
- Development tools (ESLint, Prettier, tsx)

### 3. Environment Configuration

There is no `.env.example` in the repository. Configuration reads `.env` if you create one; defaults include MongoDB at `mongodb://localhost:27017/backend`. Redis, queues, and Kafka are disabled by default. The development server requires MongoDB to be reachable.

```bash
# Optional local overrides
PORT=3000
MONGODB_URI=mongodb://localhost:27017/backend
```

See [Configuration Reference](./CONFIGURATION.md) for detailed explanation of all variables.

### 4. Start Infrastructure Services

Start local dependency containers if needed. Only MongoDB is required by application startup; Redis, queues, and Kafka remain disabled unless enabled in configuration.

```bash
# Option 1: Using Make (recommended)
make infra-up

# Option 2: Using Docker Compose directly
docker-compose up -d
```

Wait for all services to be healthy (30-60 seconds). You can check status with:

```bash
docker-compose ps
```

All services should show "Up" or "healthy" status.

### 5. Verify Infrastructure

Check that all services are accessible:

```bash
# MongoDB (should return connection info)
docker exec -it backend-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis (should return PONG)
docker exec -it backend-redis redis-cli ping

# Kafka (check broker)
docker exec -it backend-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### 6. Start the Application

```bash
# Development mode with hot reload
npm run dev
```

The source logs startup messages, but this setup has not been runtime-verified. Do not treat the following as a verified transcript:

```
OpenTelemetry SDK started successfully
Database connected successfully
Cache service initialized
Queue service initialized with processors
Kafka service initialized with consumers
Server is running on port 3000
Environment: development
API Version: v1
```

## 🎉 Verify Installation

### 1. Test the API

```bash
# Health check
curl http://localhost:3000/health

# API status
curl http://localhost:3000/api/v1/status

# Create a test user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "age": 25
  }'
```

### 2. Access Web Interfaces

Open these URLs in your browser:

- **API**: http://localhost:3000
- **Mongo Express**: http://localhost:8081
- **Redis Commander**: http://localhost:8082
- **Kafka UI**: http://localhost:8083
- **MailDev**: http://localhost:1080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### 3. Check Metrics

```bash
# View Prometheus metrics
curl http://localhost:3000/metrics
```

### 4. View Logs

```bash
# Application logs
tail -f logs/all.log

# Docker service logs
docker-compose logs -f backend-mongodb
docker-compose logs -f backend-redis
docker-compose logs -f backend-kafka
```

## 📁 Project Structure Overview

```
backend-part-2/
├── src/
│   ├── server.ts              # Entry point
│   ├── app.ts                 # Express app configuration
│   ├── routes.ts              # Main router
│   ├── instrumentation.ts     # OpenTelemetry setup
│   ├── common/                # Shared code
│   ├── config/                # Configuration management
│   ├── core/                  # Infrastructure layer
│   │   ├── base/              # Base classes
│   │   ├── cache/             # Redis caching
│   │   ├── database/          # MongoDB setup
│   │   ├── email/             # Email service
│   │   ├── kafka/             # Kafka integration
│   │   ├── queue/             # BullMQ queues
│   │   ├── observability/     # Metrics & tracing
│   │   └── middlewares/       # Express middleware
│   └── features/              # Feature modules
│       └── user/              # User feature
│           ├── controllers/
│           ├── services/
│           ├── repositories/
│           ├── models/
│           ├── routes/
│           └── ...
├── docs/                      # Documentation
├── logs/                      # Application logs
├── docker-compose.yml         # Docker services
├── .env                       # Environment variables
└── package.json              # Dependencies
```

See [Folder Structure](../architecture/FOLDER_STRUCTURE.md) for detailed explanation.

## 🔧 Development Workflow

### Running the Application

```bash
# Development with hot reload (recommended)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm run start

# Production mode with NODE_ENV=production
npm run start:prod
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking (no output = success)
npm run type-check
```

### Working with Infrastructure

```bash
# Start all infrastructure
make infra-up

# Stop all infrastructure
make infra-down

# View all logs
make infra-logs

# Start specific services
make db-up         # MongoDB only
make redis-up      # Redis only
make kafka-up      # Kafka only

# Redis CLI access
make redis-cli

# View service logs
make db-logs
make redis-logs
make kafka-logs
```

### Making Changes

1. **Hot Reload**: The dev server automatically reloads on file changes
2. **TypeScript Compilation**: Errors appear in console immediately
3. **Linting**: Run `npm run lint` before committing
4. **Testing**: Test endpoints with Postman/curl after changes

## 🐳 Docker Services Guide

### MongoDB

```bash
# Access MongoDB shell
docker exec -it backend-mongodb mongosh

# In MongoDB shell:
show dbs
use backend-part-2
show collections
db.users.find()
```

### Redis

```bash
# Access Redis CLI
docker exec -it backend-redis redis-cli

# In Redis CLI:
PING           # Test connection
KEYS *         # List all keys
GET key_name   # Get value
FLUSHALL       # Clear all data (careful!)
```

### Kafka

```bash
# List topics
docker exec -it backend-kafka kafka-topics --list --bootstrap-server localhost:9092

# Create topic manually
docker exec -it backend-kafka kafka-topics --create \
  --topic my-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1

# Consume messages from topic
docker exec -it backend-kafka kafka-console-consumer \
  --topic user.events \
  --bootstrap-server localhost:9092 \
  --from-beginning
```

## 🎯 Next Steps

After you have independently confirmed local startup:

1. **Explore the API**: Read [API Documentation](../api/README.md)
2. **Understand Architecture**: See [Architecture Overview](../architecture/ARCHITECTURE.md)
3. **Add a Feature**: Follow [Adding Features Guide](../development/ADDING_FEATURES.md)
4. **Configure Services**: Review [Configuration Reference](./CONFIGURATION.md)
5. **Monitor the App**: Learn about [Observability](../observability/README.md)

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env file
PORT=3001
```

### Docker Services Not Starting

```bash
# Stop all containers
docker-compose down

# Remove volumes (careful - deletes data!)
docker-compose down -v

# Restart
docker-compose up -d

# Check logs
docker-compose logs
```

### MongoDB Connection Failed

```bash
# Ensure MongoDB is running
docker-compose ps backend-mongodb

# Check MongoDB logs
docker-compose logs backend-mongodb

# Test connection
docker exec -it backend-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Redis Connection Failed

```bash
# Check Redis status
docker-compose ps backend-redis

# Test Redis
docker exec -it backend-redis redis-cli ping

# If still failing, disable Redis temporarily
REDIS_ENABLED=false
```

### Kafka Connection Issues

```bash
# Check Kafka and Zookeeper
docker-compose ps backend-kafka backend-zookeeper

# View Kafka logs
docker-compose logs backend-kafka

# Disable Kafka temporarily if needed
KAFKA_ENABLED=false
```

### TypeScript Compilation Errors

```bash
# Clean build
rm -rf dist/

# Reinstall dependencies
rm -rf node_modules/
npm install

# Check TypeScript config
npm run type-check
```

### Application Won't Start

```bash
# Check all prerequisites
node --version
npm --version
docker --version

# Verify .env file exists
cat .env

# Check for missing dependencies
npm install

# View application logs
tail -f logs/all.log
```

For more issues, see [Troubleshooting Guide](../guides/TROUBLESHOOTING.md).

## 📚 Additional Resources

- [Configuration Reference](./CONFIGURATION.md)
- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [API Documentation](../api/README.md)
- [Development Guide](../development/README.md)
- [FAQ](../guides/FAQ.md)

## 💡 Tips

1. **Use Make commands** for common tasks - they're simpler than docker-compose
2. **Keep Docker Desktop running** - services need it
3. **Check logs first** when something breaks - `make infra-logs`
4. **Use Grafana** for visual monitoring - much better than CLI
5. **Test in Postman** - import the API collection (if available)
6. **Monitor resources** - Docker can be resource-intensive

---

**Welcome aboard! Happy coding! 🚀**
