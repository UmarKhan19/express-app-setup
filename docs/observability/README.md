# Observability

> **The Three Pillars of Observability**: Metrics, Logs, and Traces

This guide explains the complete observability stack used in this project, providing comprehensive monitoring, logging, and tracing capabilities.

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Components](#components)
- [Access URLs](#access-urls)
- [Integration](#integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The observability stack provides complete visibility into system behavior through:

- **📊 Metrics** - Prometheus for time-series data
- **📝 Logs** - Winston + Loki for centralized logging
- **🔍 Traces** - OpenTelemetry + Tempo for distributed tracing
- **📈 Dashboards** - Grafana for visualization

### Why Observability Matters

```
┌─────────────────────────────────────────────────────────┐
│                    Production System                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Metrics  │  │   Logs   │  │  Traces  │             │
│  │          │  │          │  │          │             │
│  │ What is  │  │ What     │  │ Where is │             │
│  │ broken?  │  │ happened?│  │ the      │             │
│  │          │  │          │  │ problem? │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                     │
│       └─────────────┴─────────────┘                     │
│                     │                                   │
│              Complete Picture                           │
└─────────────────────────────────────────────────────────┘
```

## Architecture

### Observability Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐      │
│  │ Prometheus │  │  Winston   │  │ OpenTelemetry    │      │
│  │ Client     │  │  Logger    │  │ SDK              │      │
│  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘      │
└────────┼───────────────┼──────────────────┼─────────────────┘
         │               │                  │
         ▼               ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────────┐
│ Prometheus  │  │ Loki         │  │ Tempo           │
│ (Metrics)   │  │ (Logs)       │  │ (Traces)        │
└──────┬──────┘  └──────┬───────┘  └────────┬────────┘
       │                │                   │
       └────────────────┴───────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │    Grafana      │
              │ (Visualization) │
              └─────────────────┘
```

### Data Flow

1. **Application** generates metrics, logs, and traces
2. **Collectors** gather data:
   - Prometheus scrapes `/metrics` endpoint
   - Winston sends logs to Loki via Promtail
   - OpenTelemetry exports traces to Tempo
3. **Storage** persists data in time-series databases
4. **Grafana** queries and visualizes all data sources

## Quick Start

### 1. Start Observability Stack

```bash
# Start all observability services
docker-compose up -d prometheus grafana loki tempo

# Verify services are running
docker-compose ps | grep -E "prometheus|grafana|loki|tempo"
```

### 2. Verify Access

```bash
# Check Prometheus
curl http://localhost:9090/-/healthy

# Check Grafana
curl http://localhost:3001/api/health

# Check Loki
curl http://localhost:3100/ready

# Check Tempo
curl http://localhost:3200/ready
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Tempo**: http://localhost:3200

## Components

### Prometheus (Metrics)

**Purpose**: Collect and store time-series metrics

**Configuration**: `prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['host.docker.internal:3000']
    scrape_interval: 15s
```

**Metrics Exposed**: `/metrics` endpoint

**Key Features**:

- Time-series database
- PromQL query language
- Alert manager integration
- Service discovery

**Learn More**: [METRICS.md](METRICS.md)

### Winston + Loki (Logging)

**Purpose**: Centralized log aggregation and search

**Components**:

- **Winston**: Application logging library
- **Promtail**: Log shipping agent
- **Loki**: Log aggregation system

**Configuration**: `loki/loki-config.yaml`, `loki/promtail-config.yaml`

**Key Features**:

- Structured logging
- Log levels (error, warn, info, debug)
- Log streaming
- LogQL query language

**Learn More**: [LOGGING.md](LOGGING.md)

### OpenTelemetry + Tempo (Tracing)

**Purpose**: Distributed tracing for request flows

**Components**:

- **OpenTelemetry SDK**: Instrumentation library
- **Tempo**: Trace storage and querying

**Configuration**: `src/instrumentation.ts`, `tempo/tempo-config.yaml`

**Key Features**:

- Automatic instrumentation
- Span tracking
- Context propagation
- Performance analysis

**Learn More**: [TRACING.md](TRACING.md)

### Grafana (Visualization)

**Purpose**: Unified dashboard for all observability data

**Configuration**: `grafana/provisioning/`

**Data Sources**:

- Prometheus (metrics)
- Loki (logs)
- Tempo (traces)

**Dashboards**:

- System Overview
- Application Metrics
- Error Tracking
- Performance Analysis

**Key Features**:

- Multi-data source queries
- Custom dashboards
- Alerting
- User management

## Access URLs

### Development

| Service     | URL                           | Credentials    |
| ----------- | ----------------------------- | -------------- |
| Grafana     | http://localhost:3001         | admin/admin123 |
| Prometheus  | http://localhost:9090         | None           |
| Loki        | http://localhost:3100         | None           |
| Tempo       | http://localhost:3200         | None           |
| App Metrics | http://localhost:3000/metrics | None           |

### Production

Configure environment variables:

```bash
# Grafana
GRAFANA_URL=https://grafana.example.com
GRAFANA_API_KEY=your-api-key

# Prometheus
PROMETHEUS_URL=https://prometheus.example.com

# Loki
LOKI_URL=https://loki.example.com

# Tempo
TEMPO_URL=https://tempo.example.com
```

## Integration

### Application Setup

The observability stack is automatically initialized:

```typescript
// src/instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

// Initialize OpenTelemetry
const sdk = new NodeSDK({
  serviceName: 'backend-service',
  traceExporter: tempoExporter,
  metricReader: prometheusExporter,
});

sdk.start();
```

### Adding Custom Metrics

```typescript
import { metricsService } from '@/core/observability';

// Counter
metricsService.incrementCounter('custom_operation_total', {
  operation: 'user_registration',
  status: 'success',
});

// Histogram
metricsService.recordHistogram('custom_operation_duration', 150, {
  operation: 'database_query',
});

// Gauge
metricsService.setGauge('custom_active_connections', 42);
```

### Adding Structured Logs

```typescript
import { logger } from '@/common/utils/logger.util';

logger.info('User registration', {
  userId: user.id,
  email: user.email,
  registrationMethod: 'email',
});

logger.error('Database error', {
  error: err.message,
  query: 'findOne',
  collection: 'users',
});
```

### Adding Traces

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

const span = tracer.startSpan('processOrder');
try {
  // Your code here
  span.setAttributes({
    orderId: order.id,
    amount: order.total,
  });
} finally {
  span.end();
}
```

## Best Practices

### 1. Metric Naming

```typescript
// ✅ Good - Clear, descriptive, follows conventions
http_requests_total;
http_request_duration_seconds;
db_query_errors_total;

// ❌ Bad - Unclear, inconsistent
requests;
time;
errors;
```

### 2. Log Levels

```typescript
// Use appropriate log levels
logger.error('Critical failure'); // Production issues
logger.warn('Degraded performance'); // Potential issues
logger.info('User registered'); // Important events
logger.debug('Cache miss'); // Development debugging
```

### 3. Structured Logging

```typescript
// ✅ Good - Structured data
logger.info('Order placed', {
  orderId: '123',
  userId: '456',
  amount: 99.99,
  timestamp: new Date().toISOString(),
});

// ❌ Bad - String interpolation
logger.info(`Order 123 placed by user 456 for $99.99`);
```

### 4. Span Attributes

```typescript
// ✅ Good - Rich context
span.setAttributes({
  'user.id': userId,
  'order.id': orderId,
  'payment.method': 'credit_card',
  'cart.items': items.length,
});

// ❌ Bad - Minimal context
span.setAttributes({ orderId });
```

### 5. Error Handling

```typescript
// ✅ Good - Comprehensive error tracking
try {
  await processPayment(order);
} catch (error) {
  logger.error('Payment processing failed', {
    orderId: order.id,
    error: error.message,
    stack: error.stack,
  });

  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });

  metricsService.incrementCounter('payment_errors_total', {
    reason: error.code,
  });

  throw error;
}
```

## Troubleshooting

### Metrics Not Appearing

**Problem**: Prometheus shows no data

**Solutions**:

1. Check application is running:

```bash
curl http://localhost:3000/metrics
```

2. Verify Prometheus configuration:

```bash
# Check targets
curl http://localhost:9090/api/v1/targets
```

3. Check Docker networking:

```bash
docker-compose logs prometheus
```

### Logs Not Visible

**Problem**: Loki doesn't show logs

**Solutions**:

1. Verify Winston configuration:

```typescript
// Check log files
ls -la logs/
```

2. Check Promtail status:

```bash
docker-compose logs promtail
```

3. Query Loki directly:

```bash
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={job="backend"}'
```

### Traces Not Appearing

**Problem**: Tempo shows no traces

**Solutions**:

1. Verify OpenTelemetry initialization:

```typescript
// Check instrumentation.ts is imported first
import './instrumentation';
import express from 'express';
```

2. Check Tempo status:

```bash
curl http://localhost:3200/ready
```

3. Verify trace exports:

```bash
docker-compose logs tempo
```

### Grafana Connection Issues

**Problem**: Can't access Grafana

**Solutions**:

1. Check service status:

```bash
docker-compose ps grafana
```

2. Verify port binding:

```bash
netstat -tulpn | grep 3001
```

3. Check data source configuration:

- Go to Configuration → Data Sources
- Test each connection

### High Memory Usage

**Problem**: Observability services using too much memory

**Solutions**:

1. Adjust retention periods:

```yaml
# prometheus.yml
storage:
  tsdb:
    retention.time: 7d # Reduce from default
```

2. Limit log retention:

```yaml
# loki-config.yaml
table_manager:
  retention_deletes_enabled: true
  retention_period: 168h # 7 days
```

3. Reduce scrape frequency:

```yaml
# prometheus.yml
global:
  scrape_interval: 30s # Increase from 15s
```

## Performance Impact

### Resource Usage

Approximate resource consumption:

| Service    | CPU           | Memory         | Disk I/O   |
| ---------- | ------------- | -------------- | ---------- |
| Prometheus | Low (5%)      | Medium (500MB) | Low        |
| Loki       | Low (3%)      | Low (200MB)    | Medium     |
| Tempo      | Low (5%)      | Medium (400MB) | Medium     |
| Grafana    | Very Low (2%) | Low (150MB)    | Very Low   |
| **Total**  | ~15%          | ~1.25GB        | Low-Medium |

### Application Impact

- **Metrics**: < 1ms overhead per request
- **Logging**: < 0.5ms overhead per log
- **Tracing**: 1-3ms overhead per request

### Optimization Tips

1. **Sample traces** in production:

```typescript
// Sample 10% of traces
sampler: new TraceIdRatioBasedSampler(0.1),
```

2. **Buffer logs** to reduce I/O:

```typescript
// Winston buffering
transports: [
  new winston.transports.File({
    filename: 'logs/app.log',
    bufferSize: 100,  // Buffer 100 log entries
  }),
],
```

3. **Use appropriate scrape intervals**:

```yaml
# High-traffic services
scrape_interval: 30s

# Low-traffic services
scrape_interval: 60s
```

## Related Documentation

- **[Metrics Guide](METRICS.md)** - Prometheus metrics in detail
- **[Logging Guide](LOGGING.md)** - Winston and Loki setup
- **[Tracing Guide](TRACING.md)** - OpenTelemetry and Tempo
- **[Alerts Guide](ALERTS.md)** - Setting up alerts and notifications
- **[Troubleshooting](../guides/TROUBLESHOOTING.md)** - Common issues

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Tempo Documentation](https://grafana.com/docs/tempo/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)

---

**Next Steps**:

1. Set up Grafana dashboards
2. Configure alerting rules
3. Review metrics and logs regularly
4. Optimize retention policies

Need help? Check the [FAQ](../guides/FAQ.md) or [Troubleshooting Guide](../guides/TROUBLESHOOTING.md).
