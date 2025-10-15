# Frequently Asked Questions (FAQ)

> **Quick answers to common questions**

## General

### What is this project?

A scalable backend application built with Node.js, Express, TypeScript, MongoDB, Redis, and Kafka, following clean architecture principles.

### What technologies are used?

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Cache**: Redis
- **Queue**: BullMQ
- **Events**: Apache Kafka
- **Observability**: Prometheus, Grafana, Loki, Tempo

### How do I get started?

See [Getting Started Guide](../getting-started/GETTING_STARTED.md).

## Development

### How do I add a new feature?

Follow the [Adding Features Guide](../development/ADDING_FEATURES.md).

### What coding standards should I follow?

See [Coding Standards](../development/CODING_STANDARDS.md).

### How do I run tests?

```bash
npm test
npm run test:watch
npm run test:coverage
```

### How do I debug the application?

```bash
# VS Code
Press F5

# Command line
node --inspect dist/server.js
```

## Architecture

### Why layered architecture?

Separation of concerns:

- Controllers: HTTP handling
- Services: Business logic
- Repositories: Data access

Benefits: maintainability, testability, scalability.

### Why use repositories?

- Abstracts data access
- Easy to swap implementations
- Simplifies testing
- Centralizes query logic

### Why dependency injection?

- Loose coupling
- Easy testing (mock dependencies)
- Better code organization

## Database

### Should I use Mongoose or native driver?

We use Mongoose for:

- Schema validation
- Middleware hooks
- Query building
- Virtual fields

### How do I create an index?

```typescript
// In model
userSchema.index({ email: 1 }, { unique: true });

// Or directly
db.users.createIndex({ email: 1 });
```

### When should I use transactions?

Use transactions when you need:

- Atomic operations across multiple collections
- All-or-nothing guarantees
- Consistency across operations

```typescript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await User.create([userData], { session });
  await Order.create([orderData], { session });
});
```

## Caching

### When should I cache?

Cache when:

- Data changes infrequently
- Data is expensive to compute
- Data is frequently accessed

Don't cache:

- Real-time data
- User-specific sensitive data
- Data that changes frequently

### What TTL should I use?

Depends on data:

- Static content: 1 day+
- User profiles: 1 hour
- Session data: 30 minutes
- Real-time data: Don't cache

### What if Redis is down?

The application handles Redis failures gracefully and falls back to database queries.

## Kafka

### When should I use Kafka?

Use Kafka for:

- Event-driven architecture
- Async communication
- Event sourcing
- High throughput messaging

### Kafka vs Queue?

- **Kafka**: Event streaming, multiple consumers, persistence
- **Queue**: Job processing, single consumer, fire-and-forget

### How do I debug Kafka issues?

```bash
# List topics
kafka-topics --bootstrap-server localhost:9092 --list

# Describe consumer group
kafka-consumer-groups --bootstrap-server localhost:9092 --group myapp --describe

# View messages
kafka-console-consumer --bootstrap-server localhost:9092 --topic user.created --from-beginning
```

## Observability

### How do I view logs?

```bash
# Local files
tail -f logs/all.log

# Grafana/Loki
Open http://localhost:3001/explore
```

### How do I view metrics?

```bash
# Prometheus
Open http://localhost:9090

# Grafana
Open http://localhost:3001
```

### How do I trace a request?

1. Make request
2. Copy trace ID from logs
3. Search in Grafana/Tempo

## Deployment

### How do I deploy?

See [Deployment Guide](../deployment/README.md).

### Should I use Docker?

Yes, for:

- Consistent environments
- Easy deployment
- Simplified dependencies
- Container orchestration

### How do I scale?

Horizontal scaling:

```bash
docker-compose up --scale app=3
```

See [Scaling Guide](../deployment/SCALING.md).

## Performance

### How can I improve performance?

1. Add database indexes
2. Enable caching
3. Use pagination
4. Optimize queries
5. Use connection pooling
6. Enable compression

See [Performance Guide](PERFORMANCE.md).

### How do I profile performance?

```bash
# Node.js profiler
node --prof dist/server.js

# Metrics
Check Grafana dashboards
```

## Security

### How is authentication handled?

JWT tokens:

```typescript
const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
```

### How are passwords stored?

Hashed with bcrypt:

```typescript
const hash = await bcrypt.hash(password, 10);
```

### How do I secure my API?

1. Use HTTPS
2. Implement authentication
3. Add rate limiting
4. Validate input
5. Use CORS properly
6. Keep dependencies updated

See [Security Guide](SECURITY.md).

## Errors

### How are errors handled?

Centralized error middleware:

```typescript
throw new ApiError(404, 'User not found');
```

See [Error Handling Guide](../development/ERROR_HANDLING.md).

### What if something breaks?

1. Check logs
2. Check metrics
3. Review [Troubleshooting Guide](TROUBLESHOOTING.md)
4. Contact team

## Contribution

### How do I contribute?

See [Contributing Guide](../../CONTRIBUTING.md).

### What's the Git workflow?

```bash
git checkout -b feature/my-feature
# Make changes
git commit -m "feat: add my feature"
git push origin feature/my-feature
# Create pull request
```

## More Questions?

- Check [Documentation Index](../README.md)
- Review [Troubleshooting](TROUBLESHOOTING.md)
- Contact the team
- Open a GitHub issue
