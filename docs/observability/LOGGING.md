# Logging with Winston and Loki

> **Centralized logging for debugging, monitoring, and auditing**

This guide covers structured logging with Winston and log aggregation with Loki.

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Log Levels](#log-levels)
- [Structured Logging](#structured-logging)
- [Querying Logs](#querying-logs)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The logging stack consists of:

- **Winston**: Application logging library
- **Loki**: Log aggregation system
- **Promtail**: Log shipping agent
- **Grafana**: Log visualization

### Why Structured Logging?

```
Traditional Logging:
"User john@example.com registered at 2025-10-14 10:30:00"
❌ Hard to parse
❌ Hard to query
❌ Hard to analyze

Structured Logging:
{
  "level": "info",
  "message": "User registered",
  "userId": "123",
  "email": "john@example.com",
  "timestamp": "2025-10-14T10:30:00Z"
}
✅ Easy to parse
✅ Easy to query
✅ Easy to analyze
```

## Architecture

### Logging Flow

```
┌─────────────────────────────────────────────────────┐
│              Your Application                        │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │  Winston Logger                      │           │
│  │  - Formats logs                      │           │
│  │  - Writes to files                   │           │
│  │  - Console output                    │           │
│  └────────────┬─────────────────────────┘           │
└───────────────┼─────────────────────────────────────┘
                │
                │ Writes to
                ▼
┌─────────────────────────────────────────────────────┐
│           Log Files (logs/)                          │
│  - all.log (all logs)                               │
│  - error.log (errors only)                          │
│  - combined.log (production)                        │
└────────────────┬────────────────────────────────────┘
                 │
                 │ Reads from
                 ▼
┌─────────────────────────────────────────────────────┐
│           Promtail                                   │
│  - Tails log files                                  │
│  - Adds labels                                      │
│  - Ships to Loki                                    │
└────────────────┬────────────────────────────────────┘
                 │
                 │ HTTP Push
                 ▼
┌─────────────────────────────────────────────────────┐
│           Loki (:3100)                               │
│  - Indexes logs                                     │
│  - Stores log data                                  │
│  - Provides query API                               │
└────────────────┬────────────────────────────────────┘
                 │
                 │ LogQL queries
                 ▼
┌─────────────────────────────────────────────────────┐
│           Grafana (:3001)                            │
│  - Visualizes logs                                  │
│  - Filters and searches                             │
│  - Creates log dashboards                           │
└─────────────────────────────────────────────────────┘
```

## Setup

### 1. Winston Configuration

File: `src/common/utils/logger.util.ts`

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write all logs to all.log
    new winston.transports.File({
      filename: 'logs/all.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write errors to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),

    // Console output in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export { logger };
```

### 2. Loki Configuration

File: `loki/loki-config.yaml`

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2023-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 168h # 7 days
```

### 3. Promtail Configuration

File: `loki/promtail-config.yaml`

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend
          __path__: /var/log/backend/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            timestamp: timestamp
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: RFC3339
```

### 4. Verify Setup

```bash
# Start logging stack
docker-compose up -d loki promtail

# Check logs are being written
tail -f logs/all.log

# Query Loki
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={job="backend"}'

# View in Grafana
open http://localhost:3001/explore
```

## Log Levels

Winston supports multiple log levels:

```typescript
import { logger } from '@/common/utils/logger.util';

// Error - Production issues that need immediate attention
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  database: 'mongodb',
});

// Warn - Potential issues or degraded performance
logger.warn('Cache unavailable, falling back to database', {
  cache: 'redis',
  fallback: 'mongodb',
});

// Info - Important business events
logger.info('User registered', {
  userId: user.id,
  email: user.email,
  method: 'email',
});

// HTTP - HTTP request logs (via middleware)
logger.http('GET /api/users', {
  method: 'GET',
  url: '/api/users',
  statusCode: 200,
  duration: 45,
});

// Debug - Detailed debugging information (development only)
logger.debug('Cache lookup', {
  key: 'user:123',
  hit: false,
  ttl: 3600,
});
```

### Log Level Hierarchy

```
error   ─┐
         ├─ Production (LOG_LEVEL=error)
warn    ─┘

info    ─┐
         ├─ Staging (LOG_LEVEL=info)
http    ─┘

debug   ─── Development (LOG_LEVEL=debug)
```

### Setting Log Level

```bash
# Environment variable
LOG_LEVEL=debug npm run dev

# .env file
LOG_LEVEL=info
```

## Structured Logging

### Basic Structured Logs

```typescript
// ✅ Good - Structured with context
logger.info('Order created', {
  orderId: order.id,
  userId: order.userId,
  total: order.total,
  items: order.items.length,
  paymentMethod: order.paymentMethod,
});

// ❌ Bad - String interpolation
logger.info(
  `Order ${order.id} created by user ${order.userId} for $${order.total}`
);
```

### Error Logging

```typescript
// ✅ Good - Complete error context
try {
  await processPayment(order);
} catch (error) {
  logger.error('Payment processing failed', {
    orderId: order.id,
    userId: order.userId,
    error: error.message,
    errorCode: error.code,
    stack: error.stack,
    paymentMethod: order.paymentMethod,
    amount: order.total,
  });
  throw error;
}

// ❌ Bad - No context
try {
  await processPayment(order);
} catch (error) {
  logger.error(error.message);
  throw error;
}
```

### Request Logging

Use the logger middleware for automatic request logging:

```typescript
// src/core/middlewares/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/common/utils/logger.util';

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.http('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.id,
    });
  });

  next();
};
```

### Context Enrichment

Add context to all logs in a request:

```typescript
// Create child logger with request context
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.logger = logger.child({
    requestId: req.id,
    userId: req.user?.id,
    ip: req.ip,
  });

  next();
};

// Use in controllers
class UserController {
  async getUser(req: Request, res: Response) {
    req.logger.info('Fetching user', { userId: req.params.id });
    // All logs will include requestId, userId, ip
  }
}
```

## Querying Logs

### LogQL Basics

LogQL is Loki's query language, similar to PromQL.

#### Basic Queries

```logql
# All logs from backend job
{job="backend"}

# Logs with specific level
{job="backend", level="error"}

# Logs from specific file
{filename="/var/log/backend/all.log"}
```

#### Text Search

```logql
# Contains text
{job="backend"} |= "User registered"

# Doesn't contain text
{job="backend"} != "health check"

# Regex match
{job="backend"} |~ "user.*created"

# Regex not match
{job="backend"} !~ "GET /health"
```

#### JSON Parsing

```logql
# Parse JSON and filter
{job="backend"} | json | userId="123"

# Extract specific fields
{job="backend"} | json | line_format "{{.level}}: {{.message}}"

# Filter by nested field
{job="backend"} | json | error_code="PAYMENT_FAILED"
```

### Common Queries

#### Error Logs

```logql
# All errors
{job="backend", level="error"}

# Errors in last hour
{job="backend", level="error"}[1h]

# Error rate
rate({job="backend", level="error"}[5m])
```

#### Specific User Activity

```logql
# All logs for user
{job="backend"} | json | userId="123"

# User's errors
{job="backend", level="error"} | json | userId="123"
```

#### Slow Requests

```logql
# Requests taking > 1 second
{job="backend"} | json | duration > 1000

# Average request duration
avg_over_time({job="backend"} | json | unwrap duration [5m])
```

#### Failed Operations

```logql
# Payment failures
{job="backend"} |= "Payment processing failed"

# Database errors
{job="backend"} |= "Database" |= "error"

# Any failed operation
{job="backend"} | json | status="failed"
```

### Aggregations

```logql
# Count logs by level
sum by (level) (count_over_time({job="backend"}[5m]))

# Error rate by endpoint
sum by (url) (rate({job="backend", level="error"} | json [5m]))

# Top error messages
topk(10, sum by (message) (count_over_time({job="backend", level="error"} | json [1h])))
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
logger.error('Payment failed', { orderId, error }); // Needs attention
logger.warn('Slow query', { duration, query }); // Potential issue
logger.info('User registered', { userId }); // Business event
logger.debug('Cache miss', { key }); // Development only

// ❌ Bad
logger.info('Unhandled exception'); // Should be error
logger.error('User clicked button'); // Should be debug/info
```

### 2. Structure Your Logs

```typescript
// ✅ Good - Consistent structure
logger.info('Event name', {
  // What happened
  action: 'user_registered',

  // Who/what was involved
  userId: user.id,
  email: user.email,

  // When
  timestamp: new Date().toISOString(),

  // Additional context
  registrationMethod: 'email',
  referralSource: 'google',
});

// ❌ Bad - Inconsistent structure
logger.info('user registered ' + user.email);
```

### 3. Include Context

```typescript
// ✅ Good - Rich context
logger.error('Order processing failed', {
  orderId: order.id,
  userId: order.userId,
  step: 'payment',
  error: error.message,
  errorCode: error.code,
  stack: error.stack,
  paymentMethod: order.paymentMethod,
  amount: order.total,
  attemptNumber: 2,
});

// ❌ Bad - No context
logger.error('Order failed');
```

### 4. Avoid Sensitive Data

```typescript
// ✅ Good - No sensitive data
logger.info('Payment processed', {
  orderId: order.id,
  userId: order.userId,
  amount: order.total,
  last4: card.last4, // Only last 4 digits
});

// ❌ Bad - Sensitive data exposed
logger.info('Payment processed', {
  creditCard: card.number, // Full card number ❌
  cvv: card.cvv, // CVV ❌
  password: user.password, // Password ❌
  apiKey: config.apiKey, // API key ❌
});
```

### 5. Use Correlation IDs

```typescript
// Add request ID to track requests across services
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();

  req.logger = logger.child({
    requestId: req.id,
  });

  next();
});

// All logs in request will have requestId
req.logger.info('Processing order', { orderId });
req.logger.error('Payment failed', { error });
```

### 6. Log at Transaction Boundaries

```typescript
// ✅ Good - Log start and end
logger.info('Order processing started', { orderId });

try {
  await validateOrder(order);
  await processPayment(order);
  await updateInventory(order);

  logger.info('Order processing completed', {
    orderId,
    duration: Date.now() - startTime,
  });
} catch (error) {
  logger.error('Order processing failed', {
    orderId,
    error,
    duration: Date.now() - startTime,
  });
}
```

### 7. Don't Log Too Much

```typescript
// ✅ Good - Important events only
logger.info('User registered', { userId });
logger.info('Order placed', { orderId, total });

// ❌ Bad - Too verbose
logger.debug('Entering function');
logger.debug('Variable x =', x);
logger.debug('Checking condition');
logger.debug('Exiting function');
```

### 8. Use Log Sampling

For high-throughput logs, sample to reduce volume:

```typescript
// Sample 10% of debug logs
if (Math.random() < 0.1) {
  logger.debug('Cache operation', { key, operation });
}

// Always log errors
logger.error('Operation failed', { error });
```

## Log Rotation

Winston handles log rotation automatically:

```typescript
new winston.transports.File({
  filename: 'logs/all.log',
  maxsize: 5242880, // 5MB
  maxFiles: 5, // Keep 5 files
  tailable: true, // Tail the latest file
});

// Generates:
// all.log       (current)
// all.log.1     (previous)
// all.log.2
// all.log.3
// all.log.4
```

Manual rotation:

```bash
# Rotate logs manually
npm run logs:rotate

# Clear old logs
npm run logs:clear
```

## Troubleshooting

### Logs Not Appearing in Loki

1. Check log files exist:

```bash
ls -la logs/
```

2. Verify Promtail is running:

```bash
docker-compose ps promtail
docker-compose logs promtail
```

3. Check Loki is receiving logs:

```bash
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={job="backend"}'
```

### Log Files Growing Too Large

Solutions:

- Reduce log level in production
- Decrease max file size
- Decrease retention period
- Implement log sampling

```typescript
// Reduce log level
LOG_LEVEL=warn

// Smaller files
maxsize: 1048576,  // 1MB instead of 5MB

// Fewer files
maxFiles: 3,       // 3 instead of 5
```

### Performance Impact

Logging overhead:

- **Console**: ~2-5ms per log
- **File**: ~0.5-2ms per log
- **JSON formatting**: ~0.1-0.5ms per log

Optimization:

```typescript
// Disable console in production
if (process.env.NODE_ENV === 'production') {
  logger.remove(winston.transports.Console);
}

// Use async file writes
new winston.transports.File({
  filename: 'logs/all.log',
  options: { flags: 'a' }, // Append mode
});
```

### Missing Context

Problem: Logs don't have enough context

Solution: Use middleware to add context:

```typescript
app.use((req, res, next) => {
  req.logger = logger.child({
    requestId: req.id,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});
```

## Log Analysis Examples

### Find All Errors in Last Hour

```logql
{job="backend", level="error"}[1h]
```

### Count Errors by Type

```logql
sum by (error_code) (count_over_time({job="backend", level="error"} | json [24h]))
```

### Track User Journey

```logql
{job="backend"} | json | userId="123" | line_format "{{.timestamp}} {{.message}}"
```

### Identify Slow Endpoints

```logql
topk(10, avg by (url) (rate({job="backend"} | json | unwrap duration [1h])))
```

### Monitor Error Rate

```logql
sum(rate({job="backend", level="error"}[5m])) /
sum(rate({job="backend"}[5m])) * 100
```

## Related Documentation

- **[Observability Overview](README.md)** - Complete observability stack
- **[Metrics Guide](METRICS.md)** - Prometheus metrics
- **[Tracing Guide](TRACING.md)** - OpenTelemetry and Tempo
- **[Troubleshooting](../guides/TROUBLESHOOTING.md)** - Common issues

## External Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [LogQL Reference](https://grafana.com/docs/loki/latest/logql/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/)

---

**Next**: Set up [Tracing](TRACING.md) for distributed request tracking.
