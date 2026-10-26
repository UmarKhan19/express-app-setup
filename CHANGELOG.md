# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Authentication and authorization system
- Comprehensive test suite (unit, integration, e2e)
- WebSocket support for real-time features
- GraphQL API option
- Database migration system
- CI/CD pipeline
- Kubernetes deployment manifests

## [1.0.0] - 2025-10-14

### Added

- ✨ TypeScript Express starter with local-development integrations
- 🗄️ MongoDB integration with Mongoose ODM
- ⚡ Redis caching with configurable TTL strategies
- 🔄 BullMQ job queue system for background processing
- 📨 Kafka event streaming architecture
- 📧 Email service with MailDev and Resend providers
- 📊 Observability integrations/configuration (Prometheus, Grafana, Loki, Tempo)
- 🏗️ Clean architecture with layered design
- 🎯 Base classes for controllers, services, and repositories
- 🔐 HTTP middleware (Helmet, CORS, rate limiting, input sanitization; no authentication/authorization)
- 📦 Feature-based folder structure with User module example
- 🐳 Docker Compose configuration for local dependency services; no API container
- 📚 Comprehensive documentation
- 🛠️ Makefile for common development tasks
- 🔍 Health check endpoints (/health, /liveness, /readiness)
- 📈 Prometheus metrics collection
- 📝 Winston logging with Loki integration
- 🔎 Distributed tracing with OpenTelemetry and Tempo
- ⚠️ Prometheus alert rules
- 🎨 Grafana dashboards
- 🧪 Queue and Kafka management APIs

### Infrastructure

- MongoDB 7.0 with connection pooling
- Redis 7.0 for caching and queue backend
- Apache Kafka 7.5 with Zookeeper
- MailDev for development email testing
- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation
- Tempo for distributed tracing

### Developer Experience

- TypeScript with strict mode
- ESLint and Prettier for code quality
- Hot reload development server
- Path aliases for clean imports (@/config, @/core, etc.)
- Comprehensive error handling
- API documentation with examples
- Architecture and design pattern documentation
- Getting started guide
- Configuration reference
- Troubleshooting guide

### Features

- User CRUD operations with validation
- Pagination support for list endpoints
- Cache integration with automatic invalidation
- Event publishing to Kafka on user actions
- Background job queueing for emails
- Audit logging via Kafka
- Welcome email on user registration
- Graceful degradation when services unavailable
- Health checks for all services
- Metrics tracking for HTTP, database, cache, queue, and Kafka

## [0.9.0] - 2025-10-10

### Added

- Initial project setup
- Basic Express.js configuration
- MongoDB connection
- TypeScript setup
- Basic CRUD for users

## Version History

| Version | Date       | Description                                      |
| ------- | ---------- | ------------------------------------------------ |
| 1.0.0   | 2025-10-14 | Local-development starter and integration examples |
| 0.9.0   | 2025-10-10 | Initial development version                      |

## Upgrade Guide

### From 0.9.0 to 1.0.0

This release adds infrastructure integrations. Production readiness was not established.

**Breaking Changes:**

- None (first major release)

**New Requirements:**

- Node.js >= 18.0.0
- Docker Compose for optional local infrastructure services

**Migration Steps:**

1. Update Node.js to version 18 or higher
2. Install Docker Desktop
3. Set any needed variables from `docs/getting-started/CONFIGURATION.md`; there is no `.env.example`
4. Start MongoDB separately or use the local Compose service

**New Environment Variables:**

```bash
# Redis (optional)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue (optional)
QUEUE_ENABLED=true

# Kafka (optional)
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092

# Observability
OBSERVABILITY_ENABLED=true
```

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## Contributors

Thank you to all contributors who helped make this project possible!

<!-- Add contributor list here -->

---

**[Unreleased]**: https://github.com/your-repo/compare/v1.0.0...HEAD
**[1.0.0]**: https://github.com/your-repo/releases/tag/v1.0.0
**[0.9.0]**: https://github.com/your-repo/releases/tag/v0.9.0
