# TypeScript and Express infrastructure starter

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

> A TypeScript/Express starter for local development, with MongoDB-backed user routes and optional Redis, BullMQ, Kafka, email, and observability integrations. Production readiness has not been established.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# MongoDB must be available at localhost:27017; other integrations are disabled by default.
# Start the development server
npm run dev
```

Startup instructions are unverified. The server requires MongoDB; the repository has no `.env.example`. Set environment variables in your shell if the defaults do not match your local setup.

## ✨ Key Features

- **🏗️ Layered user feature**: Routes, controllers, services, repositories, and models
- **📦 MongoDB Integration**: Mongoose ODM with connection pooling and optimization
- **⚡ Redis Caching**: Cache service with configurable TTL strategies
- **🔄 BullMQ Queues**: Queue and worker code with retry configuration
- **📨 Kafka integration**: Optional producer and consumer code
- **📧 Email Service**: Multi-provider email system (MailDev, Resend)
- **📊 Observability integrations**: Prometheus metrics, Grafana dashboards, Loki logging, Tempo tracing
- **🔒 Middleware**: Helmet, CORS, rate limiting, and input sanitization; API routes do not include authentication or authorization
- **🎯 TypeScript**: Strict compiler configuration
- **🐳 Local dependencies**: Docker Compose services for development; it does not define an API container

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

### 🚀 Deployment

- **[Deployment examples](docs/deployment/README.md)** - Generic examples, not a verified deployment path
- **[Docker examples](docs/deployment/DOCKER.md)** - Generic examples; no API image is defined
- **[Environment examples](docs/deployment/ENVIRONMENT.md)** - Generic examples; source config is authoritative
- **[Scaling](docs/deployment/SCALING.md)** - Generic strategies, not verified for this application

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
npm run build            # Compile TypeScript; runtime startup is unverified
npm run start            # Start compiled server; runtime startup is unverified

# Code Quality
npm run lint             # Run linter
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Optional local infrastructure (Makefile)
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
MONGODB_URI=mongodb://localhost:27017/backend

# Feature Toggles
REDIS_ENABLED=true       # Enable/disable caching
QUEUE_ENABLED=true       # Enable/disable job queues
KAFKA_ENABLED=true       # Enable/disable event streaming
```

## Testing

No test files or test scripts are present in this repository.

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
- **Status**: Local-development starter; runtime checks not recorded
- **Maintained**: Yes
- **Node Support**: >= 18.0.0

---

**Built with ❤️ using TypeScript and Express.js**
