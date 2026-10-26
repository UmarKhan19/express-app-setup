# Environment Configuration

> **Generic environment examples; see the source configuration for supported variables**

This page contains generic deployment examples, not a complete reference to variables consumed by this application. In particular, the JWT and bcrypt variables below do not implement authentication or password hashing here. Check `src/config/index.ts` for variables the application reads.

## Application

```bash
NODE_ENV=development          # Environment: development, staging, production
PORT=3000                     # Server port
LOG_LEVEL=debug              # Log level: error, warn, info, debug
```

## Database

```bash
MONGODB_URI=mongodb://localhost:27017/myapp  # MongoDB connection string
MONGODB_MAX_POOL_SIZE=100                    # Connection pool size
MONGODB_MIN_POOL_SIZE=10                     # Minimum connections
```

## Redis

```bash
REDIS_HOST=localhost          # Redis host
REDIS_PORT=6379              # Redis port
REDIS_PASSWORD=              # Redis password (optional)
REDIS_MAX_RETRIES=3          # Max connection retries
REDIS_RETRY_DELAY=1000       # Retry delay in ms
```

## Kafka

```bash
KAFKA_BROKERS=localhost:9092     # Kafka broker addresses
KAFKA_CLIENT_ID=myapp            # Client identifier
KAFKA_GROUP_ID=myapp-consumers   # Consumer group ID
KAFKA_SSL_ENABLED=false          # Enable SSL
```

## Email

```bash
EMAIL_PROVIDER=nodemailer    # Provider: nodemailer, resend
SMTP_HOST=smtp.gmail.com     # SMTP host
SMTP_PORT=587                # SMTP port
SMTP_USER=your-email         # SMTP username
SMTP_PASSWORD=your-password  # SMTP password
EMAIL_FROM=noreply@example.com  # From address
```

## Observability

```bash
PROMETHEUS_PORT=9090         # Prometheus metrics port
LOKI_URL=http://localhost:3100         # Loki endpoint
TEMPO_URL=http://localhost:3200        # Tempo endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:3200/v1/traces  # OpenTelemetry endpoint
```

## Example security variables (not consumed by this application)

```bash
JWT_SECRET=your-secret-key   # JWT signing key
JWT_EXPIRES_IN=7d           # JWT expiration
BCRYPT_ROUNDS=10            # Password hashing rounds
CORS_ORIGIN=*               # Allowed origins
```

## Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000      # Time window (15 min)
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

## Cache TTL

```bash
CACHE_DEFAULT_TTL=3600      # Default cache TTL (seconds)
CACHE_USER_TTL=1800         # User cache TTL
CACHE_SESSION_TTL=86400     # Session cache TTL
```

## Environment Files

The application loads `.env` if present. This repository does not include `.env.example`, `.env.production`, or `.env.test` files.

See [Configuration Guide](../getting-started/CONFIGURATION.md) for detailed descriptions.
