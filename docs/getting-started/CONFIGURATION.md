# Configuration Reference

Complete reference for all environment variables and configuration options in the application.

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
  - [Server Configuration](#server-configuration)
  - [MongoDB Configuration](#mongodb-configuration)
  - [Redis Configuration](#redis-configuration)
  - [Cache Configuration](#cache-configuration)
  - [Queue Configuration](#queue-configuration)
  - [Kafka Configuration](#kafka-configuration)
  - [Email Configuration](#email-configuration)
  - [Observability Configuration](#observability-configuration)
  - [CORS Configuration](#cors-configuration)
  - [Rate Limiting](#rate-limiting)
  - [Logging Configuration](#logging-configuration)
- [Feature Toggles](#feature-toggles)
- [Configuration Files](#configuration-files)

## Environment Variables

### Server Configuration

Basic server settings.

| Variable      | Type   | Default       | Required | Description                                      |
| ------------- | ------ | ------------- | -------- | ------------------------------------------------ |
| `NODE_ENV`    | string | `development` | No       | Environment: `development`, `production`, `test` |
| `PORT`        | number | `3000`        | No       | Port for the application server                  |
| `API_VERSION` | string | `v1`          | No       | API version prefix (e.g., `/api/v1`)             |

**Example:**

```bash
NODE_ENV=production
PORT=8080
API_VERSION=v1
```

---

### MongoDB Configuration

Database connection settings.

| Variable           | Type   | Default                                         | Required | Description               |
| ------------------ | ------ | ----------------------------------------------- | -------- | ------------------------- |
| `MONGODB_URI`      | string | `mongodb://localhost:27017/backend`             | Yes      | MongoDB connection string |
| `MONGODB_URI_TEST` | string | `mongodb://localhost:27017/backend-part-2-test` | No       | Test database URI         |

**Example:**

```bash
# Local development
MONGODB_URI=mongodb://localhost:27017/backend-part-2

# With authentication
MONGODB_URI=mongodb://username:password@localhost:27017/backend-part-2

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/backend?retryWrites=true&w=majority
```

**Connection Options** (hardcoded in `src/config/index.ts`):

- `maxPoolSize`: 10 - Maximum connection pool size
- `minPoolSize`: 2 - Minimum connection pool size
- `socketTimeoutMS`: 45000 - Socket timeout
- `serverSelectionTimeoutMS`: 5000 - Server selection timeout
- `family`: 4 - Use IPv4 only

---

### Redis Configuration

Redis cache and queue backend settings.

| Variable                | Type    | Default     | Required | Description                       |
| ----------------------- | ------- | ----------- | -------- | --------------------------------- |
| `REDIS_ENABLED`         | boolean | `false`     | No       | Enable/disable Redis              |
| `REDIS_HOST`            | string  | `localhost` | No       | Redis host                        |
| `REDIS_PORT`            | number  | `6379`      | No       | Redis port                        |
| `REDIS_PASSWORD`        | string  | -           | No       | Redis password (if required)      |
| `REDIS_DB`              | number  | `0`         | No       | Redis database number (0-15)      |
| `REDIS_TLS`             | boolean | `false`     | No       | Enable TLS for Redis connection   |
| `REDIS_MAX_RETRIES`     | number  | `3`         | No       | Maximum connection retry attempts |
| `REDIS_CONNECT_TIMEOUT` | number  | `10000`     | No       | Connection timeout (milliseconds) |
| `REDIS_COMMAND_TIMEOUT` | number  | `5000`      | No       | Command timeout (milliseconds)    |

**Example:**

```bash
# Local development
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Production with authentication
REDIS_ENABLED=true
REDIS_HOST=redis.production.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS=true
```

---

### Cache Configuration

Caching behavior and TTL settings.

| Variable               | Type    | Default | Required | Description                      |
| ---------------------- | ------- | ------- | -------- | -------------------------------- |
| `CACHE_DEFAULT_TTL`    | number  | `3600`  | No       | Default TTL in seconds (1 hour)  |
| `CACHE_PREFIX`         | string  | `app`   | No       | Key prefix for all cache entries |
| `CACHE_USER_TTL`       | number  | `1800`  | No       | TTL for user cache (30 minutes)  |
| `CACHE_QUERY_TTL`      | number  | `300`   | No       | TTL for query cache (5 minutes)  |
| `CACHE_ENABLE_METRICS` | boolean | `false` | No       | Enable cache metrics tracking    |

**Example:**

```bash
CACHE_DEFAULT_TTL=7200        # 2 hours
CACHE_PREFIX=myapp
CACHE_USER_TTL=3600           # 1 hour
CACHE_QUERY_TTL=600           # 10 minutes
CACHE_ENABLE_METRICS=true
```

**Cache Keys Format:**

- Users: `app:user:{userId}`
- Queries: `app:query:{queryHash}`

---

### Queue Configuration

BullMQ job queue settings.

| Variable                   | Type           | Default       | Required | Description                                        |
| -------------------------- | -------------- | ------------- | -------- | -------------------------------------------------- |
| `QUEUE_ENABLED`            | boolean        | `false`       | No       | Enable/disable queue system                        |
| `QUEUE_REDIS_DB`           | number         | `1`           | No       | Redis DB for queues (separate from cache)          |
| `QUEUE_DEFAULT_ATTEMPTS`   | number         | `3`           | No       | Default retry attempts for failed jobs             |
| `QUEUE_BACKOFF_TYPE`       | string         | `exponential` | No       | Backoff strategy: `exponential` or `fixed`         |
| `QUEUE_BACKOFF_DELAY`      | number         | `2000`        | No       | Initial backoff delay (milliseconds)               |
| `QUEUE_REMOVE_ON_COMPLETE` | number/boolean | `100`         | No       | Keep last N completed jobs, or `false` to keep all |
| `QUEUE_REMOVE_ON_FAIL`     | number/boolean | `50`          | No       | Keep last N failed jobs, or `false` to keep all    |
| `QUEUE_WORKER_CONCURRENCY` | number         | `5`           | No       | Number of concurrent jobs per worker               |

**Example:**

```bash
QUEUE_ENABLED=true
QUEUE_REDIS_DB=1
QUEUE_DEFAULT_ATTEMPTS=5
QUEUE_BACKOFF_TYPE=exponential
QUEUE_BACKOFF_DELAY=3000
QUEUE_REMOVE_ON_COMPLETE=100
QUEUE_REMOVE_ON_FAIL=50
QUEUE_WORKER_CONCURRENCY=10
```

**Available Queues:**

- `email` - Email sending jobs
- `notification` - User notifications

---

### Kafka Configuration

Event streaming settings.

#### Basic Settings

| Variable                   | Type    | Default          | Required | Description                       |
| -------------------------- | ------- | ---------------- | -------- | --------------------------------- |
| `KAFKA_ENABLED`            | boolean | `false`          | No       | Enable/disable Kafka              |
| `KAFKA_CLIENT_ID`          | string  | `backend-app`    | No       | Kafka client identifier           |
| `KAFKA_BROKERS`            | string  | `localhost:9092` | No       | Comma-separated broker list       |
| `KAFKA_CONNECTION_TIMEOUT` | number  | `10000`          | No       | Connection timeout (milliseconds) |
| `KAFKA_REQUEST_TIMEOUT`    | number  | `30000`          | No       | Request timeout (milliseconds)    |

#### Retry Configuration

| Variable                         | Type   | Default | Required | Description                        |
| -------------------------------- | ------ | ------- | -------- | ---------------------------------- |
| `KAFKA_RETRY_MAX_RETRY_TIME`     | number | `30000` | No       | Maximum retry time (milliseconds)  |
| `KAFKA_RETRY_INITIAL_RETRY_TIME` | number | `300`   | No       | Initial retry delay (milliseconds) |
| `KAFKA_RETRY_FACTOR`             | number | `0.2`   | No       | Randomization factor               |
| `KAFKA_RETRY_MULTIPLIER`         | number | `2`     | No       | Exponential backoff multiplier     |
| `KAFKA_RETRY_RETRIES`            | number | `5`     | No       | Number of retry attempts           |

#### Producer Configuration

| Variable                                   | Type    | Default | Required | Description                        |
| ------------------------------------------ | ------- | ------- | -------- | ---------------------------------- |
| `KAFKA_PRODUCER_ALLOW_AUTO_TOPIC_CREATION` | boolean | `true`  | No       | Auto-create topics                 |
| `KAFKA_PRODUCER_TRANSACTION_TIMEOUT`       | number  | `60000` | No       | Transaction timeout (milliseconds) |
| `KAFKA_PRODUCER_IDEMPOTENT`                | boolean | `false` | No       | Enable idempotent producer         |
| `KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS`    | number  | `5`     | No       | Max in-flight requests             |

#### Consumer Configuration

| Variable                                   | Type    | Default             | Required | Description                       |
| ------------------------------------------ | ------- | ------------------- | -------- | --------------------------------- |
| `KAFKA_CONSUMER_GROUP_ID`                  | string  | `backend-app-group` | No       | Consumer group ID                 |
| `KAFKA_CONSUMER_SESSION_TIMEOUT`           | number  | `30000`             | No       | Session timeout (milliseconds)    |
| `KAFKA_CONSUMER_REBALANCE_TIMEOUT`         | number  | `60000`             | No       | Rebalance timeout (milliseconds)  |
| `KAFKA_CONSUMER_HEARTBEAT_INTERVAL`        | number  | `3000`              | No       | Heartbeat interval (milliseconds) |
| `KAFKA_CONSUMER_ALLOW_AUTO_TOPIC_CREATION` | boolean | `true`              | No       | Auto-create topics                |
| `KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION`   | number  | `1048576`           | No       | Max bytes per partition (1MB)     |
| `KAFKA_CONSUMER_MAX_WAIT_TIME_IN_MS`       | number  | `5000`              | No       | Max wait time (milliseconds)      |

#### Topic Configuration

| Variable                   | Type   | Default        | Required | Description             |
| -------------------------- | ------ | -------------- | -------- | ----------------------- |
| `KAFKA_TOPIC_USER_EVENTS`  | string | `user.events`  | No       | User events topic name  |
| `KAFKA_TOPIC_EMAIL_EVENTS` | string | `email.events` | No       | Email events topic name |
| `KAFKA_TOPIC_AUDIT_LOGS`   | string | `audit.logs`   | No       | Audit logs topic name   |

**Example:**

```bash
KAFKA_ENABLED=true
KAFKA_CLIENT_ID=backend-app-prod
KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092

# Topics
KAFKA_TOPIC_USER_EVENTS=production.user.events
KAFKA_TOPIC_EMAIL_EVENTS=production.email.events
KAFKA_TOPIC_AUDIT_LOGS=production.audit.logs

# Consumer
KAFKA_CONSUMER_GROUP_ID=backend-app-prod-group
```

---

### Email Configuration

Email service provider settings.

| Variable           | Type   | Default               | Required | Description                     |
| ------------------ | ------ | --------------------- | -------- | ------------------------------- |
| `EMAIL_PROVIDER`   | string | `maildev`             | No       | Provider: `maildev` or `resend` |
| `EMAIL_FROM_NAME`  | string | `Application`         | No       | Default sender name             |
| `EMAIL_FROM_EMAIL` | string | `noreply@example.com` | No       | Default sender email            |

#### MailDev (Development)

| Variable       | Type   | Default     | Required | Description       |
| -------------- | ------ | ----------- | -------- | ----------------- |
| `MAILDEV_HOST` | string | `localhost` | No       | MailDev SMTP host |
| `MAILDEV_PORT` | number | `1025`      | No       | MailDev SMTP port |

#### Resend (Production)

| Variable         | Type   | Default | Required              | Description    |
| ---------------- | ------ | ------- | --------------------- | -------------- |
| `RESEND_API_KEY` | string | -       | Yes (if using Resend) | Resend API key |

**Example:**

```bash
# Development (MailDev)
EMAIL_PROVIDER=maildev
EMAIL_FROM_NAME=My App
EMAIL_FROM_EMAIL=noreply@myapp.com
MAILDEV_HOST=localhost
MAILDEV_PORT=1025

# Production (Resend)
EMAIL_PROVIDER=resend
EMAIL_FROM_NAME=My App
EMAIL_FROM_EMAIL=noreply@myapp.com
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

### Observability Configuration

Monitoring, metrics, and tracing settings.

| Variable                                | Type    | Default                           | Required | Description                            |
| --------------------------------------- | ------- | --------------------------------- | -------- | -------------------------------------- |
| `OBSERVABILITY_ENABLED`                 | boolean | `true`                            | No       | Enable/disable observability           |
| `OBSERVABILITY_SERVICE_NAME`            | string  | `backend-app`                     | No       | Service name for metrics/traces        |
| `OBSERVABILITY_SERVICE_VERSION`         | string  | `1.0.0`                           | No       | Service version                        |
| `OBSERVABILITY_METRICS_PREFIX`          | string  | `backend_app_`                    | No       | Prometheus metrics prefix              |
| `OBSERVABILITY_METRICS_EXPORT_INTERVAL` | number  | `60000`                           | No       | Metrics export interval (milliseconds) |
| `OBSERVABILITY_TRACING_ENABLED`         | boolean | `true`                            | No       | Enable distributed tracing             |
| `OBSERVABILITY_TRACING_SAMPLE_RATE`     | number  | `1.0`                             | No       | Trace sampling rate (0.0-1.0)          |
| `OBSERVABILITY_DEBUG`                   | boolean | `false`                           | No       | Enable OpenTelemetry debug logging     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`    | string  | `http://localhost:4318/v1/traces` | No       | OTLP trace endpoint                    |

#### Loki (Logging)

| Variable       | Type    | Default                 | Required | Description         |
| -------------- | ------- | ----------------------- | -------- | ------------------- |
| `LOKI_ENABLED` | boolean | `true`                  | No       | Enable Loki logging |
| `LOKI_HOST`    | string  | `http://localhost:3100` | No       | Loki host URL       |

**Example:**

```bash
# Full observability
OBSERVABILITY_ENABLED=true
OBSERVABILITY_SERVICE_NAME=backend-api-prod
OBSERVABILITY_SERVICE_VERSION=1.2.3
OBSERVABILITY_METRICS_PREFIX=backend_
OBSERVABILITY_TRACING_ENABLED=true
OBSERVABILITY_TRACING_SAMPLE_RATE=0.1  # Sample 10% in production

# Loki
LOKI_ENABLED=true
LOKI_HOST=http://loki.production.com:3100

# Tempo
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://tempo.production.com:4318/v1/traces
```

---

### CORS Configuration

Cross-Origin Resource Sharing settings.

| Variable      | Type   | Default                 | Required | Description                                     |
| ------------- | ------ | ----------------------- | -------- | ----------------------------------------------- |
| `CORS_ORIGIN` | string | `http://localhost:3000` | No       | Allowed origin(s), comma-separated for multiple |

**Example:**

```bash
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins
CORS_ORIGIN=http://localhost:3000,https://app.example.com,https://admin.example.com

# Allow all (not recommended)
CORS_ORIGIN=*
```

---

### Rate Limiting

API rate limiting configuration.

| Variable                  | Type   | Default  | Required | Description                                 |
| ------------------------- | ------ | -------- | -------- | ------------------------------------------- |
| `RATE_LIMIT_WINDOW_MS`    | number | `900000` | No       | Time window (milliseconds) - default 15 min |
| `RATE_LIMIT_MAX_REQUESTS` | number | `100`    | No       | Max requests per window per IP              |

**Example:**

```bash
# 100 requests per 15 minutes (default)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 1000 requests per hour
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000

# Strict: 50 requests per 5 minutes
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=50
```

---

### Logging Configuration

Winston logger settings.

| Variable    | Type   | Default | Required | Description                                         |
| ----------- | ------ | ------- | -------- | --------------------------------------------------- |
| `LOG_LEVEL` | string | `info`  | No       | Log level: `error`, `warn`, `info`, `http`, `debug` |

**Example:**

```bash
# Production
LOG_LEVEL=warn

# Development
LOG_LEVEL=debug

# Only errors
LOG_LEVEL=error
```

**Log Levels (ordered by severity):**

1. `error` - Error messages only
2. `warn` - Warnings and errors
3. `info` - General information, warnings, and errors
4. `http` - HTTP requests, info, warnings, and errors
5. `debug` - Detailed debug information (development)

---

## Feature Toggles

Enable or disable major features with these flags:

| Feature           | Variable                     | Description                        | Dependencies      |
| ----------------- | ---------------------------- | ---------------------------------- | ----------------- |
| **Redis/Cache**   | `REDIS_ENABLED=true`         | Enable caching and session storage | Redis service     |
| **Queue System**  | `QUEUE_ENABLED=true`         | Enable background job processing   | Redis service     |
| **Kafka**         | `KAFKA_ENABLED=true`         | Enable event streaming             | Kafka + Zookeeper |
| **Observability** | `OBSERVABILITY_ENABLED=true` | Enable metrics and tracing         | Prometheus, Tempo |
| **Loki Logging**  | `LOKI_ENABLED=true`          | Send logs to Loki                  | Loki service      |

### Graceful Degradation

The application supports graceful degradation:

- If Redis is disabled, the app runs without caching
- If Queue is disabled, jobs are skipped (logged as warnings)
- If Kafka is disabled, events are not published
- If Observability is disabled, no metrics/traces are collected

**Example - Minimal Configuration:**

```bash
# Run with just MongoDB (minimal mode)
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/backend-part-2

REDIS_ENABLED=false
QUEUE_ENABLED=false
KAFKA_ENABLED=false
```

---

## Configuration Files

### `.env` File

Main configuration file (not committed to Git):

```bash
# Copy from example
cp .env.example .env

# Edit with your values
nano .env
```

### `.env.example` File

Template with all available variables and defaults. Safe to commit to Git.

### `src/config/index.ts`

TypeScript configuration module that:

1. Loads environment variables using `dotenv`
2. Validates and parses values
3. Provides type-safe configuration object
4. Sets sensible defaults

**Usage in code:**

```typescript
import config from '@/config';

console.log(config.port); // 3000
console.log(config.mongodb.uri); // mongodb://...
console.log(config.redis.enabled); // true/false
```

### `docker-compose.yml`

Defines all infrastructure services with their configuration. Environment variables can override defaults.

### `tsconfig.json`

TypeScript compiler configuration:

- Strict type checking enabled
- Path aliases configured (`@/` = `src/`)
- CommonJS module output
- Source maps enabled

---

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Local services
MONGODB_URI=mongodb://localhost:27017/backend-part-2
REDIS_HOST=localhost
KAFKA_BROKERS=localhost:9092

# Enable all features
REDIS_ENABLED=true
QUEUE_ENABLED=true
KAFKA_ENABLED=true

# Use MailDev
EMAIL_PROVIDER=maildev
```

### Production

```bash
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn

# Production databases
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prod
REDIS_HOST=redis.production.com
REDIS_PASSWORD=secure-password
REDIS_TLS=true

KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092

# Enable features
REDIS_ENABLED=true
QUEUE_ENABLED=true
KAFKA_ENABLED=true

# Use Resend for emails
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Sample 10% of traces
OBSERVABILITY_TRACING_SAMPLE_RATE=0.1
```

### Testing

```bash
NODE_ENV=test
PORT=3001
MONGODB_URI_TEST=mongodb://localhost:27017/backend-part-2-test

# Disable external services
REDIS_ENABLED=false
QUEUE_ENABLED=false
KAFKA_ENABLED=false
OBSERVABILITY_ENABLED=false
```

---

## Validation

The application validates configuration on startup:

- Required variables must be present
- Type validation (numbers, booleans)
- Dependency checks (Queue requires Redis)
- Connection tests (database, cache, etc.)

**Startup will fail if:**

- `MONGODB_URI` is missing or invalid
- Required ports are already in use
- Services enabled but not reachable (will warn and continue)

---

## Best Practices

1. **Never commit `.env`** - Use `.env.example` as template
2. **Use feature toggles** - Disable unused services
3. **Set appropriate timeouts** - Based on your infrastructure
4. **Use strong passwords** - Especially in production
5. **Enable TLS in production** - For Redis, MongoDB, etc.
6. **Monitor resource limits** - Connection pools, memory, etc.
7. **Use environment-specific configs** - Different settings per environment
8. **Document custom variables** - If you add new config options
9. **Validate on startup** - Fail fast if misconfigured
10. **Use secrets management** - For production credentials (AWS Secrets Manager, Vault, etc.)

---

## Troubleshooting Configuration

### Configuration Not Loading

```bash
# Check .env file exists
ls -la .env

# Check syntax (no spaces around =)
cat .env | grep -v "^#" | grep "="

# Verify Node.js loads it
node -e "require('dotenv').config(); console.log(process.env.PORT)"
```

### Type Conversion Issues

```bash
# Numbers must be valid integers
PORT=3000          # ✅ Correct
PORT="3000"        # ✅ Works (will be parsed)
PORT=three-thousand # ❌ Error

# Booleans must be exactly "true" or "false"
REDIS_ENABLED=true  # ✅ Correct
REDIS_ENABLED=yes   # ❌ Will be false
REDIS_ENABLED=1     # ❌ Will be false
```

### Service Connection Issues

Check the configuration matches your running services:

```bash
# MongoDB
docker exec -it backend-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec -it backend-redis redis-cli -h localhost -p 6379 ping

# Kafka
docker exec -it backend-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

---

## Additional Resources

- [Getting Started Guide](./GETTING_STARTED.md)
- [Docker Compose Configuration](../deployment/DOCKER.md)
- [Infrastructure Setup](../infrastructure/README.md)
- [Environment Variables (Node.js)](https://nodejs.org/api/process.html#process_process_env)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

**Questions?** See [FAQ](../guides/FAQ.md) or [Troubleshooting Guide](../guides/TROUBLESHOOTING.md)
