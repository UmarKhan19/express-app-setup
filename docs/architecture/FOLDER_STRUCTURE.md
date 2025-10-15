# Folder Structure

Detailed explanation of the project's folder organization and file placement conventions.

## 📁 Root Structure

```
backend-part-2/
├── docs/                      # Documentation
├── grafana/                   # Grafana dashboards and provisioning
├── loki/                      # Loki configuration
├── logs/                      # Application logs
├── node_modules/              # Dependencies (git-ignored)
├── src/                       # Source code
├── tempo/                     # Tempo configuration
├── .env                       # Environment variables (git-ignored)
├── .env.example               # Environment template
├── .eslintignore              # ESLint ignore rules
├── .eslintrc.js               # ESLint configuration
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier configuration
├── alerts.yml                 # Prometheus alert rules
├── CHANGELOG.md               # Version history
├── CONTRIBUTING.md            # Contributing guidelines
├── docker-compose.yml         # Docker services
├── Makefile                   # Common commands
├── package.json               # Dependencies and scripts
├── prometheus.yml             # Prometheus configuration
├── README.md                  # Project overview
└── tsconfig.json              # TypeScript configuration
```

## 📂 Source Code Structure (`src/`)

```
src/
├── app.ts                     # Express app configuration
├── server.ts                  # Application entry point
├── routes.ts                  # Main router
├── instrumentation.ts         # OpenTelemetry setup
├── common/                    # Shared code
├── config/                    # Configuration
├── core/                      # Infrastructure layer
└── features/                  # Feature modules
```

### Entry Points

| File                 | Purpose               | Responsibilities                                |
| -------------------- | --------------------- | ----------------------------------------------- |
| `server.ts`          | Application startup   | Connect services, start server, handle shutdown |
| `app.ts`             | Express configuration | Middleware, routes, error handling              |
| `routes.ts`          | Main router           | Register feature routes                         |
| `instrumentation.ts` | Observability         | OpenTelemetry SDK initialization                |

---

## 🌐 Common (`src/common/`)

Shared utilities, types, and interfaces used across the application.

```
common/
├── index.ts                   # Re-exports
├── constants/
│   └── index.ts               # Application constants
├── enums/
│   └── index.ts               # Enumerations (Environment, Status, etc.)
├── interfaces/
│   ├── controller.interface.ts    # IController
│   ├── entity.interface.ts        # IEntity
│   ├── repository.interface.ts    # IRepository
│   ├── service.interface.ts       # IService
│   └── index.ts
├── types/
│   └── index.ts               # Type definitions (ID, PaginationParams, etc.)
└── utils/
    ├── error.util.ts          # ApiError class
    ├── logger.util.ts         # Winston logger
    ├── pagination.util.ts     # Pagination helpers
    ├── response.util.ts       # Response formatting
    └── index.ts
```

### Constants

Application-wide constants that don't change:

```typescript
// common/constants/index.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  // ...
};

export const CACHE_KEYS = {
  USER: 'user',
  QUERY: 'query',
};
```

### Enums

Enumerated types for type safety:

```typescript
// common/enums/index.ts
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}
```

### Interfaces

Contracts for type checking:

```typescript
// common/interfaces/repository.interface.ts
export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: ID): Promise<T | null>;
  // ...
}
```

### Types

Reusable type definitions:

```typescript
// common/types/index.ts
export type ID = string;
export type PaginationParams = {
  page: number;
  limit: number;
};
```

### Utils

Utility functions and classes:

- **error.util.ts**: `ApiError` class for standardized errors
- **logger.util.ts**: Winston logger configuration
- **pagination.util.ts**: Pagination helpers
- **response.util.ts**: API response formatting

---

## ⚙️ Configuration (`src/config/`)

```
config/
└── index.ts                   # Configuration management
```

Centralized configuration loading and validation:

- Loads environment variables
- Provides type-safe config object
- Sets defaults for optional values
- Validates required values

**Usage**:

```typescript
import config from '@/config';

console.log(config.port); // 3000
console.log(config.mongodb.uri); // mongodb://...
```

---

## 🏗️ Core (`src/core/`)

Infrastructure layer providing cross-cutting concerns and technical capabilities.

```
core/
├── index.ts                   # Re-exports
├── base/                      # Base classes
├── cache/                     # Redis caching
├── container/                 # Dependency injection
├── database/                  # MongoDB connection
├── email/                     # Email service
├── kafka/                     # Event streaming
├── middlewares/               # Express middleware
├── observability/             # Metrics & tracing
└── queue/                     # Job processing
```

### Base Classes (`src/core/base/`)

```
base/
├── base.controller.ts         # Generic controller
├── base.repository.ts         # Generic repository
├── base.service.ts            # Generic service
└── index.ts
```

**Purpose**: Provide common CRUD operations that can be extended

**Example**:

```typescript
export abstract class BaseController<T, CreateDTO, UpdateDTO> {
  constructor(protected service: IService<T, CreateDTO, UpdateDTO>) {}

  async create(req, res) { ... }
  async findById(req, res) { ... }
  // ... other CRUD methods
}
```

### Cache (`src/core/cache/`)

```
cache/
├── cache.ts                   # Redis connection
├── cache.service.ts           # Cache operations
├── cache.interface.ts         # ICacheService interface
├── cache.util.ts              # Helper functions
└── index.ts
```

**Features**:

- Get/set/delete operations
- TTL management
- Key pattern matching
- Statistics tracking
- Metrics integration

### Container (`src/core/container/`)

```
container/
├── container.ts               # DI container
└── index.ts
```

**Purpose**: Simple dependency injection container

### Database (`src/core/database/`)

```
database/
├── database.ts                # MongoDB connection management
└── index.ts
```

**Responsibilities**:

- Connection pooling
- Retry logic
- Health checks
- Graceful disconnection

### Email (`src/core/email/`)

```
email/
├── email.service.ts           # Email service
├── email.factory.ts           # Provider factory
├── email.helper.ts            # Helper functions
├── email.interface.ts         # Interfaces
├── index.ts
└── providers/
    ├── base.provider.ts       # Base provider
    ├── maildev.provider.ts    # MailDev implementation
    ├── resend.provider.ts     # Resend implementation
    └── index.ts
```

**Architecture**: Provider pattern with factory for easy extension

### Kafka (`src/core/kafka/`)

```
kafka/
├── kafka.ts                   # Kafka client
├── kafka.service.ts           # Producer operations
├── kafka.interface.ts         # Interfaces
├── kafka.helper.ts            # Helper functions
├── kafka.routes.ts            # Management API
├── kafka.init.ts              # Consumer initialization
├── kafka.registry.ts          # Topic registry
├── base.consumer.ts           # Base consumer class
├── consumer.registry.ts       # Consumer registry
├── index.ts
└── consumers/
    ├── example.consumer.ts    # Example consumer
    ├── audit-log.consumer.ts  # Audit logging
    └── index.ts
```

**Features**:

- Producer with idempotency
- Consumer groups
- Auto-reconnection
- Error handling
- Metrics tracking

### Middlewares (`src/core/middlewares/`)

```
middlewares/
├── error.middleware.ts        # Error handling
├── logger.middleware.ts       # Request logging
├── metrics.middleware.ts      # Metrics collection
├── validation.middleware.ts   # Input validation
└── index.ts
```

**Purpose**: Express middleware for cross-cutting concerns

### Observability (`src/core/observability/`)

```
observability/
├── index.ts
├── metrics.service.ts         # Prometheus metrics
└── tracking.helper.ts         # Metric tracking helpers
```

**Features**:

- HTTP metrics (requests, latency, status codes)
- Database metrics (query duration, connections)
- Cache metrics (hit/miss rate, operations)
- Queue metrics (job count, duration, failures)
- Kafka metrics (messages produced/consumed)
- Business metrics (users, emails, etc.)

### Queue (`src/core/queue/`)

```
queue/
├── queue.ts                   # BullMQ connection
├── queue.service.ts           # Queue operations
├── queue.interface.ts         # Interfaces
├── queue.helper.ts            # Helper functions
├── queue.routes.ts            # Management API
├── queue.controller.ts        # Queue controller
├── queue.init.ts              # Processor initialization
├── queue.registry.ts          # Processor registry
├── base.processor.ts          # Base processor class
├── index.ts
└── processors/
    ├── email.processor.ts     # Email job processor
    ├── notification.processor.ts  # Notification processor
    └── index.ts
```

**Features**:

- Job scheduling
- Retry with exponential backoff
- Job prioritization
- Progress tracking
- Completed/failed job cleanup

---

## 🎯 Features (`src/features/`)

Feature-based module organization following vertical slicing.

```
features/
└── user/
    ├── index.ts               # Public exports
    ├── controllers/
    │   ├── user.controller.ts
    │   └── index.ts
    ├── services/
    │   ├── user.service.ts
    │   └── index.ts
    ├── repositories/
    │   ├── user.repository.ts
    │   └── index.ts
    ├── models/
    │   ├── user.model.ts
    │   └── index.ts
    ├── entities/
    │   ├── user.entity.ts
    │   └── index.ts
    ├── dtos/
    │   ├── user.dto.ts
    │   └── index.ts
    ├── schemas/
    │   ├── user.schema.ts
    │   └── index.ts
    ├── routes/
    │   ├── user.routes.ts
    │   └── index.ts
    ├── consumers/
    │   ├── user-events.consumer.ts
    │   └── index.ts
    └── helpers/
        ├── kafka.helper.ts
        └── index.ts
```

### Feature Module Structure

Each feature follows this consistent structure:

| Folder            | Purpose                    | Example              |
| ----------------- | -------------------------- | -------------------- |
| **controllers/**  | HTTP request handlers      | `UserController`     |
| **services/**     | Business logic             | `UserService`        |
| **repositories/** | Data access                | `UserRepository`     |
| **models/**       | Mongoose models            | `UserModel`          |
| **entities/**     | Domain entities            | `IUserEntity`        |
| **dtos/**         | Data transfer objects      | `CreateUserDto`      |
| **schemas/**      | Validation schemas         | `createUserSchema`   |
| **routes/**       | Route definitions          | `userRoutes`         |
| **consumers/**    | Kafka event consumers      | `UserEventsConsumer` |
| **helpers/**      | Feature-specific utilities | `publishUserEvent()` |

### Adding a New Feature

To add a feature (e.g., `product`):

```bash
mkdir -p src/features/product/{controllers,services,repositories,models,entities,dtos,schemas,routes,consumers,helpers}
```

Then create files following the user feature pattern.

---

## 📄 Documentation (`docs/`)

```
docs/
├── README.md                  # Documentation index
├── GLOSSARY.md                # Technical terms
├── getting-started/
│   ├── GETTING_STARTED.md
│   └── CONFIGURATION.md
├── architecture/
│   ├── ARCHITECTURE.md
│   ├── DESIGN_PATTERNS.md
│   └── FOLDER_STRUCTURE.md
├── api/
│   └── README.md
├── infrastructure/
│   ├── README.md
│   ├── DATABASE.md
│   ├── CACHE.md
│   ├── QUEUE.md
│   ├── KAFKA.md
│   └── EMAIL.md
├── observability/
│   ├── README.md
│   ├── METRICS.md
│   ├── LOGGING.md
│   ├── TRACING.md
│   └── ALERTS.md
├── development/
│   ├── README.md
│   ├── ADDING_FEATURES.md
│   ├── ERROR_HANDLING.md
│   └── TESTING.md
├── deployment/
│   ├── README.md
│   ├── DOCKER.md
│   ├── ENVIRONMENT.md
│   └── SCALING.md
└── guides/
    ├── TROUBLESHOOTING.md
    ├── FAQ.md
    ├── SECURITY.md
    └── PERFORMANCE.md
```

---

## 🐳 Infrastructure Config

### Grafana (`grafana/`)

```
grafana/
├── dashboards/
│   └── overview.json          # Main dashboard
└── provisioning/
    ├── dashboards/
    │   └── default.yml        # Dashboard provisioning
    └── datasources/
        └── prometheus.yml     # Prometheus datasource
```

### Loki (`loki/`)

```
loki/
├── loki-config.yaml           # Loki configuration
└── promtail-config.yaml       # Promtail configuration
```

### Tempo (`tempo/`)

```
tempo/
└── tempo-config.yaml          # Tempo configuration
```

### Logs (`logs/`)

```
logs/
├── all.log                    # All logs
└── error.log                  # Error logs only
```

---

## 🔧 Configuration Files

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/common/*": ["common/*"],
      "@/core/*": ["core/*"],
      "@/features/*": ["features/*"],
      "@/config/*": ["config/*"]
    }
  }
}
```

**Path Aliases**:

- `@/` → `src/`
- `@/common/*` → `src/common/*`
- `@/core/*` → `src/core/*`
- `@/features/*` → `src/features/*`
- `@/config/*` → `src/config/*`

### ESLint (`.eslintrc.js`)

Linting rules for code quality.

### Prettier (`.prettierrc`)

Code formatting rules.

### Docker Compose (`docker-compose.yml`)

Defines all infrastructure services.

### Makefile

Common development commands.

---

## 📝 File Naming Conventions

### TypeScript Files

| Type             | Convention                | Example                   |
| ---------------- | ------------------------- | ------------------------- |
| **Controllers**  | `{feature}.controller.ts` | `user.controller.ts`      |
| **Services**     | `{feature}.service.ts`    | `user.service.ts`         |
| **Repositories** | `{feature}.repository.ts` | `user.repository.ts`      |
| **Models**       | `{feature}.model.ts`      | `user.model.ts`           |
| **DTOs**         | `{feature}.dto.ts`        | `user.dto.ts`             |
| **Interfaces**   | `{name}.interface.ts`     | `cache.interface.ts`      |
| **Types**        | `{name}.types.ts`         | `pagination.types.ts`     |
| **Utils**        | `{name}.util.ts`          | `logger.util.ts`          |
| **Constants**    | `{name}.constants.ts`     | `http.constants.ts`       |
| **Routes**       | `{feature}.routes.ts`     | `user.routes.ts`          |
| **Schemas**      | `{feature}.schema.ts`     | `user.schema.ts`          |
| **Consumers**    | `{name}.consumer.ts`      | `user-events.consumer.ts` |
| **Processors**   | `{name}.processor.ts`     | `email.processor.ts`      |

### Index Files

Each folder has an `index.ts` that re-exports public members:

```typescript
// src/features/user/index.ts
export * from './controllers';
export * from './services';
export * from './routes';
```

**Purpose**: Clean imports

```typescript
// Instead of:
import { UserController } from '@/features/user/controllers/user.controller';
import { UserService } from '@/features/user/services/user.service';

// You can do:
import { UserController, UserService } from '@/features/user';
```

---

## 🎯 Import Best Practices

### Use Path Aliases

```typescript
// ✅ Good - using path alias
import config from '@/config';
import { UserService } from '@/features/user';
import logger from '@/common/utils/logger.util';

// ❌ Bad - relative paths
import config from '../../../config';
import { UserService } from '../user';
```

### Import Order

```typescript
// 1. Node modules
import express from 'express';
import mongoose from 'mongoose';

// 2. Aliased imports
import config from '@/config';
import { BaseService } from '@/core/base';

// 3. Relative imports
import { UserRepository } from './user.repository';
import { CreateUserDto } from '../dtos';
```

---

## 📊 Folder Size Guidelines

| Folder             | Recommended Max Files | When to Split           |
| ------------------ | --------------------- | ----------------------- |
| **Feature module** | 50 files              | Create sub-features     |
| **Controllers**    | 5 files               | Split by responsibility |
| **Services**       | 10 files              | Extract helper services |
| **Utils**          | 15 files              | Create sub-folders      |

---

## 🔍 Finding Files

### By Convention

- Controllers → `src/features/{feature}/controllers/`
- Services → `src/features/{feature}/services/`
- Infrastructure → `src/core/{component}/`

### By Function

- HTTP routes → Look in `routes/` folders
- Business logic → Look in `services/` folders
- Data access → Look in `repositories/` folders
- Background jobs → Look in `queue/processors/`
- Event handling → Look in `kafka/consumers/`

---

## Further Reading

- [Architecture Overview](./ARCHITECTURE.md)
- [Design Patterns](./DESIGN_PATTERNS.md)
- [Adding Features](../development/ADDING_FEATURES.md)
- [Development Guide](../development/README.md)

---

**Next**: [API Reference](../api/README.md) →
