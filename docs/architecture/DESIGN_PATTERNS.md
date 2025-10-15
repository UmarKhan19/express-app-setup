# Design Patterns

This document describes the design patterns used throughout the codebase and explains how they improve maintainability, testability, and scalability.

## 📋 Table of Contents

- [Creational Patterns](#creational-patterns)
- [Structural Patterns](#structural-patterns)
- [Behavioral Patterns](#behavioral-patterns)
- [Architectural Patterns](#architectural-patterns)

## Creational Patterns

### 1. Factory Pattern

**Purpose**: Create objects without specifying exact classes

**Location**: `src/core/email/email.factory.ts`

**Implementation**:

```typescript
export class EmailProviderFactory {
  static createProvider(): IEmailProvider {
    const provider = config.email.provider;

    switch (provider) {
      case 'maildev':
        return new MailDevProvider();
      case 'resend':
        return new ResendProvider();
      default:
        throw new Error(`Unknown email provider: ${provider}`);
    }
  }
}
```

**Benefits**:

- Easy to add new email providers
- Configuration-based provider selection
- Centralized provider creation logic

**Usage**:

```typescript
// Email service doesn't know which provider it's using
const provider = EmailProviderFactory.createProvider();
await provider.send(emailOptions);
```

---

### 2. Singleton Pattern

**Purpose**: Ensure only one instance exists

**Locations**:

- `src/core/database/database.ts`
- `src/core/cache/cache.ts`
- `src/core/queue/queue.ts`
- `src/core/kafka/kafka.ts`
- `src/core/container/container.ts`

**Implementation**:

```typescript
class Database {
  private static instance: Database;
  private connection: mongoose.Connection | null = null;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mongoose.createConnection(config.mongodb.uri);
    }
    return this.connection;
  }
}

export default Database.getInstance();
```

**Benefits**:

- Single database connection pool
- Consistent state across application
- Resource optimization

---

### 3. Dependency Injection (DI) Container

**Purpose**: Manage dependencies and their lifecycle

**Location**: `src/core/container/container.ts`

**Implementation**:

```typescript
class Container {
  private services: Map<string, any> = new Map();
  private factories: Map<string, Factory> = new Map();

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  registerFactory<T>(key: string, factory: Factory<T>): void {
    this.factories.set(key, factory);
  }

  resolve<T>(key: string): T {
    if (this.services.has(key)) {
      return this.services.get(key);
    }

    if (this.factories.has(key)) {
      const instance = this.factories.get(key)();
      this.services.set(key, instance);
      return instance;
    }

    throw new Error(`Service not found: ${key}`);
  }
}
```

**Usage**:

```typescript
// Register services
container.register('userRepository', new UserRepository());
container.register(
  'userService',
  new UserService(container.resolve('userRepository'))
);

// Resolve when needed
const userService = container.resolve<UserService>('userService');
```

**Benefits**:

- Loose coupling between components
- Easier testing with mock dependencies
- Centralized dependency management

---

## Structural Patterns

### 1. Repository Pattern

**Purpose**: Abstract data access logic from business logic

**Location**: Base in `src/core/base/base.repository.ts`, implementations in feature repositories

**Implementation**:

```typescript
// Interface
interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

// Base implementation
export abstract class BaseRepository<T> implements IRepository<T> {
  constructor(protected model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return await doc.save();
  }

  async findById(id: ID): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  // ... other methods
}

// Feature implementation
export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(UserModel);
  }

  // Custom methods
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email }).exec();
  }
}
```

**Benefits**:

- Business logic doesn't know about database
- Easy to swap data sources
- Testable with mock repositories
- Common CRUD operations in base class

---

### 2. Adapter Pattern

**Purpose**: Make incompatible interfaces work together

**Location**: Email providers (`src/core/email/providers/`)

**Implementation**:

```typescript
// Common interface
interface IEmailProvider {
  getName(): string;
  isConfigured(): boolean;
  send(options: IEmailOptions): Promise<IEmailResult>;
}

// Adapter for MailDev
export class MailDevProvider extends BaseEmailProvider {
  private transporter: nodemailer.Transporter;

  async send(options: IEmailOptions): Promise<IEmailResult> {
    // Adapt MailDev's interface to our interface
    const result = await this.transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.html,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  }
}

// Adapter for Resend
export class ResendProvider extends BaseEmailProvider {
  private client: Resend;

  async send(options: IEmailOptions): Promise<IEmailResult> {
    // Adapt Resend's interface to our interface
    const result = await this.client.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.html,
    });

    return {
      success: true,
      messageId: result.id,
    };
  }
}
```

**Benefits**:

- Switch email providers without changing business logic
- Unified interface for different implementations
- Easy to add new providers

---

### 3. Decorator Pattern (Conceptual)

**Purpose**: Add behavior without modifying original code

**Location**: Cache utilities (`src/core/cache/cache.util.ts`)

**Implementation**:

```typescript
// Cache decorator concept
export function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  return async () => {
    // Try cache first
    const cached = await cacheService.get<T>(key);
    if (cached) {
      return cached;
    }

    // Execute function
    const result = await fn();

    // Cache result
    await cacheService.set(key, result, ttl);

    return result;
  };
}

// Usage
const getUser = withCache(`user:${id}`, 1800, () => repository.findById(id));
```

**Benefits**:

- Add caching without modifying repository
- Reusable caching logic
- Transparent to business logic

---

### 4. Proxy Pattern

**Purpose**: Control access to an object

**Location**: Observability tracking (`src/core/observability/tracking.helper.ts`)

**Implementation**:

```typescript
// Wrap operations with metrics tracking
export function trackOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const timer = metricsService.startTimer();

  return operation()
    .then((result) => {
      const duration = Date.now() - startTime;
      metricsService.recordSuccess(operationName, duration);
      timer.end();
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      metricsService.recordError(operationName, duration);
      timer.end();
      throw error;
    });
}
```

**Benefits**:

- Transparent metrics collection
- Error tracking without changing business logic
- Centralized monitoring

---

## Behavioral Patterns

### 1. Strategy Pattern

**Purpose**: Select algorithm at runtime

**Location**: Email provider selection, cache TTL strategies

**Implementation**:

```typescript
// TTL strategies
interface TTLStrategy {
  getTTL(key: string): number;
}

class UserTTLStrategy implements TTLStrategy {
  getTTL(key: string): number {
    return config.cache.ttlStrategies.user; // 1800s
  }
}

class QueryTTLStrategy implements TTLStrategy {
  getTTL(key: string): number {
    return config.cache.ttlStrategies.query; // 300s
  }
}

// Select strategy based on key type
function selectTTLStrategy(key: string): TTLStrategy {
  if (key.startsWith('user:')) {
    return new UserTTLStrategy();
  }
  if (key.startsWith('query:')) {
    return new QueryTTLStrategy();
  }
  return new DefaultTTLStrategy();
}
```

**Benefits**:

- Different TTLs for different data types
- Easy to add new strategies
- Configurable behavior

---

### 2. Observer Pattern (Event-Driven)

**Purpose**: Notify multiple subscribers about events

**Location**: Kafka producers and consumers

**Implementation**:

```typescript
// Producer (Observable)
class KafkaService {
  async produce(topic: string, message: any) {
    // Notify all consumers subscribed to this topic
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}

// Consumer (Observer)
class UserEventsConsumer extends BaseConsumer {
  async consume(message: IKafkaMessage) {
    const event = JSON.parse(message.value);

    switch (event.type) {
      case 'user.created':
        await this.handleUserCreated(event);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event);
        break;
    }
  }
}
```

**Benefits**:

- Loose coupling between publishers and subscribers
- Multiple consumers can react to same event
- Asynchronous communication

---

### 3. Template Method Pattern

**Purpose**: Define algorithm skeleton, let subclasses fill in steps

**Location**: Base classes (`src/core/base/`)

**Implementation**:

```typescript
// Base service defines the template
export abstract class BaseService<T, CreateDTO, UpdateDTO> {
  constructor(protected repository: IRepository<T>) {}

  // Template method
  async create(dto: CreateDTO): Promise<T> {
    await this.beforeCreate(dto);     // Hook
    const entity = await this.repository.create(dto);
    await this.afterCreate(entity);   // Hook
    return entity;
  }

  // Hooks that can be overridden
  protected async beforeCreate(dto: CreateDTO): Promise<void> {
    // Default: do nothing
  }

  protected async afterCreate(entity: T): Promise<void> {
    // Default: do nothing
  }
}

// Subclass overrides hooks
export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  protected async beforeCreate(dto: CreateUserDto): Promise<void> {
    // Custom validation
    await this.validateEmailUnique(dto.email);
  }

  protected async afterCreate(user: User): Promise<void> {
    // Publish event
    await publishUserEvent('user.created', user);
    // Queue email
    await queueService.addJob('email', 'welcome', {...});
  }
}
```

**Benefits**:

- Common flow in base class
- Customization through hooks
- Consistent behavior across features

---

### 4. Chain of Responsibility

**Purpose**: Pass request through chain of handlers

**Location**: Express middleware chain

**Implementation**:

```typescript
// Middleware chain
app.use(requestLogger); // Handler 1: Log request
app.use(metricsMiddleware); // Handler 2: Record metrics
app.use(validateToken); // Handler 3: Validate auth
app.use(validateInput); // Handler 4: Validate input
app.use(controllerHandler); // Handler 5: Execute business logic
app.use(errorHandler); // Handler 6: Handle errors

// Each middleware decides whether to pass to next handler
function validateToken(req, res, next) {
  if (req.headers.authorization) {
    // Valid, pass to next
    next();
  } else {
    // Invalid, stop chain
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

**Benefits**:

- Flexible request processing
- Easy to add/remove middleware
- Each handler has single responsibility

---

### 5. Registry Pattern

**Purpose**: Centrally register and lookup components

**Location**: Queue processors, Kafka consumers

**Implementation**:

```typescript
// Queue processor registry
class QueueRegistry {
  private processors = new Map<string, BaseProcessor>();

  register(name: string, processor: BaseProcessor) {
    this.processors.set(name, processor);
    logger.info(`Registered processor: ${name}`);
  }

  getProcessor(name: string): BaseProcessor | undefined {
    return this.processors.get(name);
  }

  getAllProcessors(): BaseProcessor[] {
    return Array.from(this.processors.values());
  }
}

// Usage
const registry = new QueueRegistry();
registry.register('email', new EmailProcessor());
registry.register('notification', new NotificationProcessor());

// Initialize all registered processors
registry.getAllProcessors().forEach((processor) => {
  processor.initialize();
});
```

**Benefits**:

- Centralized component management
- Easy to discover available processors
- Dynamic registration

---

## Architectural Patterns

### 1. Layered Architecture

**Pattern**: Organize code into distinct layers

```
Controller Layer  →  HTTP concerns
     ↓
Service Layer     →  Business logic
     ↓
Repository Layer  →  Data access
     ↓
Infrastructure    →  External services
```

See [Architecture Overview](./ARCHITECTURE.md#layered-architecture) for details.

---

### 2. Domain-Driven Design (DDD) Elements

**Entities**: `src/features/*/entities/` - Domain objects with identity

```typescript
export interface IUserEntity extends IEntity {
  name: string;
  email: string;
  age: number;
}
```

**Value Objects**: DTOs in `src/features/*/dtos/` - Immutable data containers

```typescript
export interface CreateUserDto {
  name: string;
  email: string;
  age: number;
}
```

**Repositories**: Abstract data access

**Services**: Encapsulate business logic

---

### 3. CQRS (Light)

**Pattern**: Separate read and write operations

```typescript
// Write operations
class UserService {
  async create(dto: CreateUserDto) { ... }
  async update(id: string, dto: UpdateUserDto) { ... }
  async delete(id: string) { ... }
}

// Read operations (can be optimized separately)
class UserRepository {
  async findById(id: string) { ... }
  async findAll() { ... }
  async findByEmail(email: string) { ... }
  async findWithPagination(params) { ... }
}
```

**Benefits**:

- Optimize reads separately from writes
- Scale read replicas independently
- Different models for read/write

---

### 4. Event-Driven Architecture

**Pattern**: Components communicate via events

```typescript
// Producer
async createUser(dto: CreateUserDto) {
  const user = await this.repository.create(dto);

  // Emit event (fire and forget)
  await kafkaService.produce('user.events', {
    type: 'user.created',
    userId: user.id,
    timestamp: new Date(),
  });

  return user;
}

// Consumer
class AuditLogConsumer extends BaseConsumer {
  async consume(message) {
    const event = JSON.parse(message.value);
    // Store audit log
    await auditRepository.create({
      action: event.type,
      userId: event.userId,
      timestamp: event.timestamp,
    });
  }
}
```

**Benefits**:

- Loose coupling between components
- Asynchronous processing
- Event history for audit
- Multiple consumers per event

---

## Anti-Patterns Avoided

### ❌ God Object

**Avoided by**: Separating concerns into controllers, services, repositories

### ❌ Tight Coupling

**Avoided by**: Dependency injection, interfaces

### ❌ Premature Optimization

**Avoided by**: Simple solutions first, optimize based on metrics

### ❌ Magic Numbers/Strings

**Avoided by**: Constants in `src/common/constants/`

### ❌ Callback Hell

**Avoided by**: Async/await throughout

### ❌ Copy-Paste Programming

**Avoided by**: Base classes, utility functions

---

## Pattern Usage Guide

### When to Use Each Pattern

| Pattern             | Use When                                  | Don't Use When                |
| ------------------- | ----------------------------------------- | ----------------------------- |
| **Factory**         | Creating objects based on configuration   | Simple object creation        |
| **Singleton**       | Need exactly one instance (DB connection) | Need multiple instances       |
| **Repository**      | Abstracting data access                   | Direct DB access is simpler   |
| **Adapter**         | Integrating third-party services          | Internal code                 |
| **Strategy**        | Algorithm selection at runtime            | Single algorithm              |
| **Observer**        | One-to-many dependencies                  | Direct calls are sufficient   |
| **Template Method** | Common algorithm with variations          | Each implementation is unique |

---

## Further Reading

- [Architecture Overview](./ARCHITECTURE.md)
- [Folder Structure](./FOLDER_STRUCTURE.md)
- [Development Guide](../development/README.md)
- [Adding Features](../development/ADDING_FEATURES.md)

---

**Next**: [Folder Structure](./FOLDER_STRUCTURE.md) →
