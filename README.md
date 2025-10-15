# Backend Part 2 - Production-Grade Express.js Application

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

> A production-ready, enterprise-grade Express.js backend built with TypeScript, featuring comprehensive observability, event-driven architecture, and robust infrastructure integrations.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start infrastructure services
make infra-up

# 4. Start development server
npm run dev
```

Your API will be running at **http://localhost:3000** 🎉

## ✨ Key Features

- **🏗️ Clean Architecture**: Layered design with separation of concerns (Controller → Service → Repository)
- **📦 MongoDB Integration**: Mongoose ODM with connection pooling and optimization
- **⚡ Redis Caching**: High-performance caching with configurable TTL strategies
- **🔄 BullMQ Queues**: Reliable job processing with retry mechanisms
- **📨 Kafka Event Streaming**: Event-driven architecture for scalable microservices
- **📧 Email Service**: Multi-provider email system (MailDev, Resend)
- **📊 Full Observability**: Prometheus metrics, Grafana dashboards, Loki logging, Tempo tracing
- **🔒 Security**: Helmet, CORS, rate limiting, input sanitization
- **🎯 TypeScript**: Full type safety with strict mode
- **🐳 Docker Ready**: Complete Docker Compose setup for all services

## 📚 Documentation

### 🎓 Getting Started

- **[Getting Started Guide](docs/getting-started/GETTING_STARTED.md)** - Complete setup instructions
- **[Configuration Reference](docs/getting-started/CONFIGURATION.md)** - All environment variables explained

### 🏛️ Architecture

- **[Architecture Overview](docs/architecture/ARCHITECTURE.md)** - System design and patterns
- **[Design Patterns](docs/architecture/DESIGN_PATTERNS.md)** - Patterns used in the codebase
- **[Folder Structure](docs/architecture/FOLDER_STRUCTURE.md)** - Project organization

### 🌐 API

- **[API Reference](docs/api/README.md)** - Complete endpoint documentation

### 🔧 Infrastructure

- **[Infrastructure Overview](docs/infrastructure/README.md)** - All infrastructure components
- **[Database Guide](docs/infrastructure/DATABASE.md)** - MongoDB setup and patterns
- **[Cache Guide](docs/infrastructure/CACHE.md)** - Redis caching strategies
- **[Queue System](docs/infrastructure/QUEUE.md)** - BullMQ job processing
- **[Kafka Guide](docs/infrastructure/KAFKA.md)** - Event streaming architecture
- **[Email Service](docs/infrastructure/EMAIL.md)** - Email provider integration

### 📈 Observability

- **[Observability Overview](docs/observability/README.md)** - Monitoring stack
- **[Metrics](docs/observability/METRICS.md)** - Prometheus metrics
- **[Logging](docs/observability/LOGGING.md)** - Winston & Loki
- **[Tracing](docs/observability/TRACING.md)** - OpenTelemetry & Tempo
- **[Alerts](docs/observability/ALERTS.md)** - Alert rules and management

### 💻 Development

- **[Development Guide](docs/development/README.md)** - Coding guidelines
- **[Adding Features](docs/development/ADDING_FEATURES.md)** - How to add new features
- **[Error Handling](docs/development/ERROR_HANDLING.md)** - Error patterns
- **[Testing](docs/development/TESTING.md)** - Testing strategies

### 🚀 Deployment

- **[Deployment Guide](docs/deployment/README.md)** - Production deployment
- **[Docker Guide](docs/deployment/DOCKER.md)** - Container orchestration
- **[Environment Setup](docs/deployment/ENVIRONMENT.md)** - Production config
- **[Scaling](docs/deployment/SCALING.md)** - Scaling strategies

### 📖 Guides

- **[Troubleshooting](docs/guides/TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](docs/guides/FAQ.md)** - Frequently asked questions
- **[Security](docs/guides/SECURITY.md)** - Security best practices
- **[Performance](docs/guides/PERFORMANCE.md)** - Optimization techniques

### 🤝 Contributing

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Changelog](CHANGELOG.md)** - Version history
- **[Glossary](docs/GLOSSARY.md)** - Technical terms

## 🛠️ Tech Stack

### Core

- **Runtime**: Node.js >= 18.0.0
- **Language**: TypeScript 5.3
- **Framework**: Express.js 4.18

### Databases & Storage

- **Primary Database**: MongoDB 7.0 (Mongoose 8.x)
- **Cache**: Redis 7.0
- **Message Broker**: Apache Kafka 7.5

### Infrastructure

- **Queue**: BullMQ 5.x
- **Email**: Nodemailer, Resend

### Observability

- **Metrics**: Prometheus + prom-client
- **Dashboards**: Grafana
- **Logging**: Winston + Loki
- **Tracing**: OpenTelemetry + Tempo

### Development Tools

- **Linting**: ESLint + Prettier
- **Process Manager**: tsx (development)
- **Build Tool**: TypeScript Compiler

## 📦 Available Services

| Service         | Port      | Description         | UI                                       |
| --------------- | --------- | ------------------- | ---------------------------------------- |
| **Backend API** | 3000      | Main application    | -                                        |
| **MongoDB**     | 27017     | Primary database    | [Mongo Express](http://localhost:8081)   |
| **Redis**       | 6379      | Cache & queues      | [Redis Commander](http://localhost:8082) |
| **Kafka**       | 9092      | Event streaming     | [Kafka UI](http://localhost:8083)        |
| **MailDev**     | 1025/1080 | Email testing       | [MailDev UI](http://localhost:1080)      |
| **Prometheus**  | 9090      | Metrics collection  | [Prometheus UI](http://localhost:9090)   |
| **Grafana**     | 3001      | Dashboards          | [Grafana UI](http://localhost:3001)      |
| **Loki**        | 3100      | Log aggregation     | -                                        |
| **Tempo**       | 3200      | Distributed tracing | -                                        |

Default Grafana credentials: **admin / admin**

## 🎯 Key Endpoints

```bash
# Health checks
GET /health              # Detailed health information
GET /liveness            # Kubernetes liveness probe
GET /readiness           # Kubernetes readiness probe

# Monitoring
GET /metrics             # Prometheus metrics

# API
GET  /api/v1/status      # API status
GET  /api/v1/users       # List users
POST /api/v1/users       # Create user
GET  /api/v1/users/:id   # Get user by ID
```

See [API Documentation](docs/api/README.md) for complete reference.

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run linter
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Infrastructure (Makefile)
make infra-up            # Start all services
make infra-down          # Stop all services
make infra-logs          # View all logs

make db-up               # Start MongoDB only
make redis-up            # Start Redis only
make kafka-up            # Start Kafka only

make help                # Show all available commands
```

## 🏗️ Project Structure

```
backend-part-2/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Server entry point
│   ├── routes.ts              # Main router
│   ├── instrumentation.ts     # OpenTelemetry setup
│   ├── common/                # Shared utilities
│   ├── config/                # Configuration
│   ├── core/                  # Infrastructure layer
│   │   ├── base/              # Base classes
│   │   ├── cache/             # Redis caching
│   │   ├── database/          # MongoDB connection
│   │   ├── email/             # Email service
│   │   ├── kafka/             # Kafka integration
│   │   ├── queue/             # BullMQ queues
│   │   ├── observability/     # Metrics & tracing
│   │   └── middlewares/       # Express middleware
│   └── features/              # Business features
│       └── user/              # User feature module
├── docs/                      # Documentation
├── grafana/                   # Grafana dashboards
├── loki/                      # Loki configuration
├── tempo/                     # Tempo configuration
├── docker-compose.yml         # Docker services
├── Makefile                   # Common commands
└── package.json              # Dependencies
```

See [Folder Structure](docs/architecture/FOLDER_STRUCTURE.md) for detailed explanation.

## 🔐 Environment Variables

Key environment variables (see [Configuration](docs/getting-started/CONFIGURATION.md) for full reference):

```bash
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/backend-part-2

# Feature Toggles
REDIS_ENABLED=true       # Enable/disable caching
QUEUE_ENABLED=true       # Enable/disable job queues
KAFKA_ENABLED=true       # Enable/disable event streaming
```

## 🧪 Testing

```bash
# Run tests (once implemented)
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development process
- How to submit pull requests
- Coding standards

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Report bugs via GitHub Issues
- **Questions**: See [FAQ](docs/guides/FAQ.md) or [Troubleshooting](docs/guides/TROUBLESHOOTING.md)

## 🎯 Roadmap

- [ ] Add authentication & authorization
- [ ] Implement comprehensive test suite
- [ ] Add API versioning strategy
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline setup
- [ ] WebSocket support
- [ ] GraphQL API option
- [ ] Database migrations system

## 📊 Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Maintained**: Yes
- **Node Support**: >= 18.0.0

---

**Built with ❤️ using TypeScript and Express.js**
