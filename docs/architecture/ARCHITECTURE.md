# Architecture Overview

This document provides a high-level overview of the system architecture, core principles, and design decisions.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Style](#architecture-style)
- [Layered Architecture](#layered-architecture)
- [Core Principles](#core-principles)
- [Technology Stack](#technology-stack)
- [System Diagram](#system-diagram)
- [Data Flow](#data-flow)
- [Module Organization](#module-organization)

## System Overview

This is a **TypeScript/Express infrastructure starter for local development**. Its source includes:

- **Layered organization** across routes, controllers, services, repositories, and models
- **Event-Driven Architecture** using Kafka for inter-service communication
- **Asynchronous Job Processing** with BullMQ for background tasks
- **Observability integrations** for metrics, logging, and distributed tracing
- **Local infrastructure examples** for a database, cache, queue, and message broker

### Key Characteristics

- **TypeScript**: Strict compiler configuration
- **Feature folders**: User feature separated into modules
- **Interface-based design**: No test suite is present in the repository.
- **Base classes and shared utilities**: Common patterns used by the source
- **Instrumentation code**: Metrics, logs, and traces are configured in source
- **Runtime behavior, production security, resilience, and scaling have not been verified.** User and administration routes currently have no authentication or authorization middleware.

## Architecture Style

### Primary: Layered (N-Tier) Architecture

The application follows a **4-layer architecture**:

```
┌─────────────────────────────────────┐
│     Presentation Layer (API)        │  ← Controllers, Routes, Middleware
├─────────────────────────────────────┤
│       Business Logic Layer          │  ← Services, Domain Logic
├─────────────────────────────────────┤
│      Data Access Layer              │  ← Repositories, Models
├─────────────────────────────────────┤
│      Infrastructure Layer           │  ← Database, Cache, Queue, Kafka
└─────────────────────────────────────┘
```

### Supporting Patterns

- **Event-Driven Architecture**: Kafka for asynchronous communication
- **CQRS Light**: Separate read/write patterns where beneficial
- **Microservices Ready**: Designed to be split into microservices

## Layered Architecture

### Layer 1: Presentation Layer (`src/features/*/controllers`, `src/features/*/routes`)

**Responsibility**: Handle HTTP requests and responses

- Parse and validate incoming requests
- Call appropriate service methods
- Format and return HTTP responses
- Handle route-level middleware

**Key Components**:

- `BaseController` - Generic CRUD operations
- Feature controllers (e.g., `UserController`)
- Route definitions
- Validation middleware

**Example**:

```typescript
// UserController handles HTTP concerns
export class UserController extends BaseController {
  async create(req, res) {
    const dto = req.body;
    const user = await this.service.create(dto);
    res.status(201).json(user);
  }
}
```

---

### Layer 2: Business Logic Layer (`src/features/*/services`)

**Responsibility**: Implement business rules and orchestration

- Execute business logic
- Coordinate between multiple repositories
- Publish events to Kafka
- Queue background jobs
- Handle domain-specific errors

**Key Components**:

- `BaseService` - Generic business operations
- Feature services (e.g., `UserService`)
- Business validation
- Event publishing

**Example**:

```typescript
// UserService contains business logic
export class UserService extends BaseService {
  async create(dto) {
    // Business validation
    await this.validateEmailUnique(dto.email);

    // Create user
    const user = await this.repository.create(dto);

    // Publish event
    await publishUserEvent('user.created', user);

    // Queue welcome email
    await queueService.addJob('email', 'welcome', {...});

    return user;
  }
}
```

---

### Layer 3: Data Access Layer (`src/features/*/repositories`, `src/features/*/models`)

**Responsibility**: Manage data persistence and retrieval

- CRUD operations on database
- Query optimization
- Data mapping and transformation
- Cache integration

**Key Components**:

- `BaseRepository` - Generic data access methods
- Feature repositories (e.g., `UserRepository`)
- Mongoose models and schemas
- Cache decorators

**Example**:

```typescript
// UserRepository handles data access
export class UserRepository extends BaseRepository {
  async findByEmail(email: string) {
    return this.model.findOne({ email });
  }
}
```

---

### Layer 4: Infrastructure Layer (`src/core`)

**Responsibility**: Provide technical infrastructure and cross-cutting concerns

**Components**:

- **Database** (`src/core/database`) - MongoDB connection management
- **Cache** (`src/core/cache`) - Redis caching layer
- **Queue** (`src/core/queue`) - BullMQ job processing
- **Kafka** (`src/core/kafka`) - Event streaming
- **Email** (`src/core/email`) - Email service abstraction
- **Observability** (`src/core/observability`) - Metrics, logging, tracing
- **Middleware** (`src/core/middlewares`) - Express middleware

---

## Core Principles

### 1. SOLID Principles

#### Single Responsibility Principle (SRP)

Each class has one reason to change:

- Controllers handle HTTP only
- Services handle business logic only
- Repositories handle data access only

#### Open/Closed Principle (OCP)

Base classes are open for extension, closed for modification:

- Extend `BaseController`, `BaseService`, `BaseRepository`
- Add new features without modifying core

#### Liskov Substitution Principle (LSP)

Derived classes can replace base classes:

- All feature controllers work the same way
- Services are interchangeable

#### Interface Segregation Principle (ISP)

Clients depend on focused interfaces:

- `IRepository`, `IService`, `IController`
- `IEmailProvider`, `ICacheService`

#### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions:

- Services depend on repository interfaces
- Infrastructure uses provider abstractions

### 2. Separation of Concerns

Each module handles one aspect:

- **HTTP** - Controllers and routes
- **Business Logic** - Services
- **Data Access** - Repositories
- **Domain Models** - Entities and DTOs

### 3. Don't Repeat Yourself (DRY)

Code reuse through:

- Base classes with common functionality
- Utility functions in `src/common/utils`
- Shared types and interfaces
- Middleware for cross-cutting concerns

### 4. Convention Over Configuration

Consistent patterns:

- Feature folders follow same structure
- Base classes provide default behavior
- Standard error handling
- Unified response format

## Technology Stack

### Application Layer

```
Express.js (HTTP Server)
    ↓
TypeScript (Type Safety)
    ↓
Mongoose (MongoDB ODM)
```

### Infrastructure Services

```
┌─────────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐
│  MongoDB    │  │  Redis   │  │  Kafka  │  │  Email  │
│  (Primary)  │  │ (Cache & │  │ (Events)│  │ Service │
│             │  │  Queue)  │  │         │  │         │
└─────────────┘  └──────────┘  └─────────┘  └─────────┘
```

### Observability Stack

```
┌──────────────┐  ┌───────────┐  ┌────────┐  ┌────────┐
│  Prometheus  │  │  Grafana  │  │  Loki  │  │ Tempo  │
│  (Metrics)   │  │ (Dashboa │  │ (Logs) │  │(Traces)│
│              │  │   rds)    │  │        │  │        │
└──────────────┘  └───────────┘  └────────┘  └────────┘
```

## System Diagram

```
                         ┌─────────────────────┐
                         │   Client / API      │
                         │    Consumer         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express.js API    │
                         │   Load Balancer     │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │   Controller     │  │   Controller     │  │   Controller     │
    │   (HTTP Layer)   │  │   (HTTP Layer)   │  │   (HTTP Layer)   │
    └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
             │                     │                     │
             ▼                     ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │    Service       │  │    Service       │  │    Service       │
    │ (Business Logic) │  │ (Business Logic) │  │ (Business Logic) │
    └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
             │                     │                     │
             ├─────────────────────┼─────────────────────┤
             │                     │                     │
             ▼                     ▼                     ▼
    ┌─────────────────────────────────────────────────────────┐
    │              Repository (Data Access)                    │
    └───────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       ┌───────────┐ ┌───────────┐ ┌───────────┐
       │  MongoDB  │ │   Redis   │ │   Cache   │
       │ (Primary) │ │  (Queue)  │ │  (Fast)   │
       └───────────┘ └───────────┘ └───────────┘

    Background Services:

    ┌────────────────┐         ┌────────────────┐
    │  Queue Workers │         │ Kafka Consumers│
    │   (BullMQ)     │         │  (Event Hdlr)  │
    └────────┬───────┘         └────────┬───────┘
             │                          │
             ▼                          ▼
    ┌────────────────┐         ┌────────────────┐
    │  Email Service │         │  Event Store   │
    │  Notifications │         │  Audit Logs    │
    └────────────────┘         └────────────────┘

    Observability:

    ┌────────────────────────────────────────────┐
    │  Prometheus → Grafana (Metrics & Alerts)   │
    │  Loki (Logs)      Tempo (Traces)           │
    └────────────────────────────────────────────┘
```

## Data Flow

### Synchronous Request Flow (HTTP)

```
1. HTTP Request
      ↓
2. Middleware (logging, validation, metrics)
      ↓
3. Router → Controller
      ↓
4. Controller → Service
      ↓
5. Service → Repository
      ↓
6. Repository → Database/Cache
      ↓
7. Data returned up the chain
      ↓
8. Controller formats response
      ↓
9. HTTP Response
```

### Asynchronous Flow (Events)

```
1. Service publishes event to Kafka
      ↓
2. Kafka stores and distributes event
      ↓
3. Consumer receives event
      ↓
4. Consumer processes event
      ↓
5. Consumer updates state/triggers actions
```

### Background Job Flow (Queue)

```
1. Service adds job to queue
      ↓
2. BullMQ stores job in Redis
      ↓
3. Worker picks up job
      ↓
4. Worker executes job processor
      ↓
5. Job completes or retries on failure
```

## Module Organization

### Feature-Based Structure

Each feature is a self-contained module:

```
features/
  └── user/
      ├── controllers/       # HTTP handlers
      ├── services/          # Business logic
      ├── repositories/      # Data access
      ├── models/            # Mongoose models
      ├── schemas/           # Validation schemas
      ├── dtos/              # Data transfer objects
      ├── entities/          # Domain entities
      ├── routes/            # Route definitions
      ├── consumers/         # Kafka consumers
      ├── helpers/           # Feature-specific utilities
      └── index.ts           # Public exports
```

**Benefits**:

- Easy to understand and navigate
- Clear boundaries between features
- Simple to add new features
- Can be extracted into microservices

### Core Infrastructure

Shared infrastructure in `src/core`:

```
core/
  ├── base/              # Base classes for CRUD
  ├── cache/             # Redis caching
  ├── database/          # MongoDB connection
  ├── email/             # Email service
  ├── kafka/             # Event streaming
  ├── queue/             # Job processing
  ├── observability/     # Metrics & tracing
  ├── middlewares/       # Express middleware
  └── container/         # Dependency injection
```

### Common Utilities

Shared utilities in `src/common`:

```
common/
  ├── constants/         # Application constants
  ├── enums/             # Enumerations
  ├── interfaces/        # TypeScript interfaces
  ├── types/             # Type definitions
  └── utils/             # Utility functions
```

## Request Lifecycle Example

Let's trace a user creation request:

```typescript
// 1. HTTP POST /api/v1/users
// Request: { "name": "John", "email": "john@example.com", "age": 30 }

// 2. Middleware Chain
app.use(requestLogger);          // Log request
app.use(metricsMiddleware);      // Record metrics
app.use(validationMiddleware);   // Validate input

// 3. Route → Controller
router.post('/users', userController.create);

// 4. Controller (HTTP layer)
class UserController {
  async create(req, res) {
    const dto = req.body;
    const user = await this.userService.create(dto);
    return res.status(201).json(user);
  }
}

// 5. Service (Business logic)
class UserService {
  async create(dto) {
    // Check if email exists
    if (await this.repo.findByEmail(dto.email)) {
      throw new ApiError(409, 'Email already exists');
    }

    // Create user
    const user = await this.repository.create(dto);

    // Publish event
    await kafkaService.produce('user.events', {
      type: 'user.created',
      userId: user.id,
      ...
    });

    // Queue welcome email
    await queueService.addJob('email', 'welcome', {
      to: user.email,
      ...
    });

    return user;
  }
}

// 6. Repository (Data access)
class UserRepository {
  async create(dto) {
    const user = new this.model(dto);
    await user.save();

    // Cache the user
    await cacheService.set(`user:${user.id}`, user, 1800);

    return user;
  }
}

// 7. MongoDB saves the document
// 8. Redis caches the user
// 9. Kafka publishes event asynchronously
// 10. BullMQ queues email job
// 11. Response returned to client
// 12. Metrics recorded (latency, status code, etc.)
```

## Scalability Considerations

### Horizontal Scaling

The application is designed for horizontal scaling:

- **Stateless**: No session state in application memory
- **Shared Cache**: Redis for distributed caching
- **Message Queue**: BullMQ for distributed job processing
- **Event Streaming**: Kafka for inter-service communication
- **Load Balancer Ready**: Can run multiple instances

### Vertical Scaling

Resource limits are configurable:

- MongoDB connection pool size
- Redis connection pool
- Worker concurrency
- Kafka consumer threads

### Performance Optimizations

- **Caching**: Redis caching reduces database load
- **Connection Pooling**: Reuse database connections
- **Compression**: Response compression enabled
- **Pagination**: Large result sets are paginated
- **Indexes**: Database indexes for common queries
- **Async Processing**: Long tasks moved to queues

## Monitoring & Observability

Every layer is instrumented:

- **HTTP Metrics**: Request count, latency, status codes
- **Database Metrics**: Query duration, connection pool
- **Cache Metrics**: Hit rate, operation duration
- **Queue Metrics**: Job count, duration, failures
- **Kafka Metrics**: Message production/consumption
- **Business Metrics**: User registration, emails sent

See [Observability Overview](../observability/README.md) for details.

## Security Considerations

- **Helmet**: Security headers
- **CORS**: Cross-origin configuration
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Joi schemas
- **Sanitization**: Prevent NoSQL injection
- **Error Handling**: No sensitive data in errors

See [Security Guide](../guides/SECURITY.md) for details.

## Further Reading

- [Design Patterns](./DESIGN_PATTERNS.md) - Patterns used in the codebase
- [Folder Structure](./FOLDER_STRUCTURE.md) - Detailed folder organization
- [Development Guide](../development/README.md) - How to develop features
- [Infrastructure](../infrastructure/README.md) - Infrastructure components

---

**Next**: [Design Patterns](./DESIGN_PATTERNS.md) →
