# Performance Optimization Guide

> **Strategies to improve application performance**

## Database Optimization

### Indexes

```typescript
// Create indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1, createdAt: -1 });

// Compound indexes
userSchema.index({ category: 1, price: -1 });

// Text search index
userSchema.index({ name: 'text', description: 'text' });
```

### Query Optimization

```typescript
// ✅ Good - Use projection
User.find().select('name email');

// ✅ Good - Use lean()
User.find().lean(); // Returns plain JavaScript objects

// ✅ Good - Use pagination
User.find()
  .limit(20)
  .skip(page * 20);

// ❌ Bad - Load everything
User.find();
```

### Connection Pooling

```typescript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
});
```

## Caching Strategy

### Cache Frequently Accessed Data

```typescript
async getUserById(id: string): Promise<IUser> {
  // Try cache first
  const cached = await cache.get(`user:${id}`);
  if (cached) return cached;

  // Fetch from database
  const user = await User.findById(id);

  // Cache for 1 hour
  await cache.set(`user:${id}`, user, 3600);

  return user;
}
```

### Cache Invalidation

```typescript
async updateUser(id: string, data: UpdateUserDto): Promise<IUser> {
  const user = await User.findByIdAndUpdate(id, data, { new: true });

  // Invalidate cache
  await cache.delete(`user:${id}`);

  return user;
}
```

### Cache-Aside Pattern

```typescript
async remember<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const cached = await this.get<T>(key);
  if (cached) return cached;

  const value = await fn();
  await this.set(key, value, ttl);

  return value;
}

// Usage
const users = await cache.remember('all-users', 3600, async () => {
  return await User.find().lean();
});
```

## API Optimization

### Response Compression

```typescript
import compression from 'compression';
app.use(compression());
```

### Pagination

```typescript
async getAll(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find().skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
```

### Field Selection

```typescript
// Only return needed fields
User.find().select('name email avatar');
```

## Async Optimization

### Parallel Execution

```typescript
// ✅ Good - Parallel
const [users, orders, products] = await Promise.all([
  User.find(),
  Order.find(),
  Product.find(),
]);

// ❌ Bad - Sequential
const users = await User.find();
const orders = await Order.find();
const products = await Product.find();
```

### Batch Operations

```typescript
// ✅ Good - Batch insert
await User.insertMany(users);

// ❌ Bad - Loop insert
for (const user of users) {
  await User.create(user);
}
```

## Memory Optimization

### Streaming Large Data

```typescript
const cursor = User.find().cursor();

for (let user = await cursor.next(); user != null; user = await cursor.next()) {
  await processUser(user);
}
```

### Garbage Collection

```bash
# Enable GC logs
node --expose-gc --trace-gc dist/server.js
```

## Load Balancing

### Nginx Configuration

```nginx
upstream backend {
    least_conn;
    server backend-1:3000 weight=3;
    server backend-2:3000 weight=2;
    server backend-3:3000 weight=1;
}
```

## Monitoring Performance

### Key Metrics

```promql
# Response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Throughput
rate(http_requests_total[5m])

# Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100
```

### APM Tools

- New Relic
- Datadog
- AppDynamics
- Elastic APM

## Best Practices

1. **Use indexes** for frequently queried fields
2. **Cache** expensive operations
3. **Paginate** large result sets
4. **Use lean()** when you don't need Mongoose documents
5. **Parallel execution** for independent operations
6. **Connection pooling** for databases
7. **Compression** for API responses
8. **CDN** for static assets
9. **Load balancing** for horizontal scaling
10. **Monitor** and profile regularly

## Performance Checklist

- [ ] Database indexes created
- [ ] Caching implemented
- [ ] Pagination added
- [ ] Connection pooling configured
- [ ] Compression enabled
- [ ] Queries optimized
- [ ] No N+1 queries
- [ ] Async operations parallelized
- [ ] Memory leaks checked
- [ ] Load testing performed

## Load Testing

```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/users

# Artillery
artillery quick --count 10 --num 100 http://localhost:3000/api/users

# k6
k6 run load-test.js
```

Related: [Troubleshooting](TROUBLESHOOTING.md) | [Scaling](../deployment/SCALING.md)
