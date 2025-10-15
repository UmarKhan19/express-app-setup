# Metrics with Prometheus

> **Time-series metrics for monitoring application performance and behavior**

This guide covers Prometheus metrics collection, custom metrics, queries, and best practices.

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Available Metrics](#available-metrics)
- [Custom Metrics](#custom-metrics)
- [Querying Metrics](#querying-metrics)
- [Dashboards](#dashboards)
- [Alerting](#alerting)
- [Best Practices](#best-practices)

## Overview

Prometheus is a time-series database that collects metrics by scraping HTTP endpoints. It provides:

- **Real-time monitoring** of application health
- **Historical data** for trend analysis
- **Alerting** on threshold breaches
- **Visualization** via Grafana

### Metric Types

```
┌─────────────────────────────────────────────────────┐
│                  Metric Types                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Counter    ─────────►  Always increases            │
│  (requests_total)      Never decreases              │
│                                                      │
│  Gauge      ◄────►     Can go up or down            │
│  (active_users)        Current state                │
│                                                      │
│  Histogram  ▃▅▇█▇▅▃    Distribution of values       │
│  (latency)             Buckets + quantiles          │
│                                                      │
│  Summary    ▃▅▇█▇▅▃    Similar to histogram         │
│  (duration)            Pre-calculated quantiles     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Architecture

### Prometheus Flow

```
┌─────────────────────────────────────────────────────┐
│           Your Application (:3000)                   │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │  PrometheusExporter                  │           │
│  │  - Collects metrics                  │           │
│  │  - Exposes /metrics endpoint         │           │
│  └──────────────┬───────────────────────┘           │
└─────────────────┼───────────────────────────────────┘
                  │
                  │ HTTP GET /metrics
                  │ (every 15s)
                  ▼
┌─────────────────────────────────────────────────────┐
│           Prometheus (:9090)                         │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │  Scraper                             │           │
│  │  - Pulls metrics from /metrics       │           │
│  │  - Stores in time-series DB          │           │
│  │  - Evaluates alert rules             │           │
│  └──────────────┬───────────────────────┘           │
└─────────────────┼───────────────────────────────────┘
                  │
                  │ PromQL queries
                  ▼
┌─────────────────────────────────────────────────────┐
│           Grafana (:3001)                            │
│  - Visualizes metrics                                │
│  - Creates dashboards                                │
│  - Manages alerts                                    │
└─────────────────────────────────────────────────────┘
```

## Setup

### 1. Prometheus Configuration

File: `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### 2. Application Setup

The metrics service is automatically initialized in `src/instrumentation.ts`:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const prometheusExporter = new PrometheusExporter({
  port: 9464, // Internal metrics port
  endpoint: '/metrics',
});

const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  serviceName: 'backend-service',
});

sdk.start();
```

### 3. Verify Setup

```bash
# Check metrics endpoint
curl http://localhost:3000/metrics

# Check Prometheus targets
open http://localhost:9090/targets

# Query a metric
curl 'http://localhost:9090/api/v1/query?query=http_requests_total'
```

## Available Metrics

### HTTP Metrics

Automatically collected by OpenTelemetry instrumentation:

#### `http_requests_total`

**Type**: Counter
**Description**: Total number of HTTP requests
**Labels**: `method`, `route`, `status_code`

```promql
# Total requests
http_requests_total

# Requests by status code
http_requests_total{status_code="200"}

# Rate of requests per second
rate(http_requests_total[5m])
```

#### `http_request_duration_seconds`

**Type**: Histogram
**Description**: HTTP request duration in seconds
**Labels**: `method`, `route`, `status_code`

```promql
# Average request duration
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Requests slower than 1 second
http_request_duration_seconds_bucket{le="1.0"}
```

#### `http_request_size_bytes`

**Type**: Histogram
**Description**: HTTP request size in bytes
**Labels**: `method`, `route`

#### `http_response_size_bytes`

**Type**: Histogram
**Description**: HTTP response size in bytes
**Labels**: `method`, `route`

### Application Metrics

Custom metrics defined in `src/core/observability/metrics.service.ts`:

#### `app_errors_total`

**Type**: Counter
**Description**: Total application errors
**Labels**: `type`, `severity`

```promql
# Error rate
rate(app_errors_total[5m])

# Errors by type
sum by (type) (app_errors_total)
```

#### `db_query_duration_seconds`

**Type**: Histogram
**Description**: Database query duration
**Labels**: `operation`, `collection`

```promql
# Slow queries (> 1 second)
histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m])) > 1

# Query throughput
sum(rate(db_query_duration_seconds_count[5m])) by (collection)
```

#### `cache_operations_total`

**Type**: Counter
**Description**: Cache operations
**Labels**: `operation`, `status`

```promql
# Cache hit rate
sum(rate(cache_operations_total{status="hit"}[5m])) /
sum(rate(cache_operations_total[5m]))

# Cache miss rate
sum(rate(cache_operations_total{status="miss"}[5m])) /
sum(rate(cache_operations_total[5m]))
```

#### `queue_jobs_total`

**Type**: Counter
**Description**: Queue jobs processed
**Labels**: `queue`, `status`

```promql
# Job success rate
sum(rate(queue_jobs_total{status="completed"}[5m])) /
sum(rate(queue_jobs_total[5m]))

# Failed jobs
rate(queue_jobs_total{status="failed"}[5m])
```

#### `active_connections`

**Type**: Gauge
**Description**: Current active connections
**Labels**: `service`

```promql
# Current connections
active_connections

# Connection growth
delta(active_connections[1h])
```

### System Metrics

Collected from Node.js runtime:

#### `nodejs_heap_size_used_bytes`

**Type**: Gauge
**Description**: Used heap size

#### `nodejs_heap_size_total_bytes`

**Type**: Gauge
**Description**: Total heap size

#### `nodejs_eventloop_lag_seconds`

**Type**: Gauge
**Description**: Event loop lag

```promql
# Event loop lag > 100ms
nodejs_eventloop_lag_seconds > 0.1

# Memory usage percentage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100
```

## Custom Metrics

### Creating Custom Metrics

Use the metrics service in `src/core/observability/metrics.service.ts`:

```typescript
import { metricsService } from '@/core/observability';

// Counter - always increases
metricsService.incrementCounter('user_registrations_total', {
  method: 'email',
  source: 'web',
});

// Gauge - current value
metricsService.setGauge('active_websocket_connections', 42);

// Histogram - distribution
metricsService.recordHistogram('file_upload_size_bytes', fileSize, {
  file_type: 'image',
});
```

### Example: Custom Business Metric

```typescript
// src/features/order/order.service.ts
import { metricsService } from '@/core/observability';

class OrderService {
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const startTime = Date.now();

    try {
      const order = await this.orderRepository.create(orderData);

      // Track order value
      metricsService.recordHistogram('order_value_dollars', order.total, {
        payment_method: order.paymentMethod,
        status: 'success',
      });

      // Track order processing time
      const duration = (Date.now() - startTime) / 1000;
      metricsService.recordHistogram(
        'order_processing_duration_seconds',
        duration
      );

      // Increment successful orders
      metricsService.incrementCounter('orders_total', {
        status: 'success',
        payment_method: order.paymentMethod,
      });

      return order;
    } catch (error) {
      // Track failed orders
      metricsService.incrementCounter('orders_total', {
        status: 'failed',
        error_type: error.constructor.name,
      });

      throw error;
    }
  }
}
```

### Metric Naming Conventions

Follow these conventions for consistency:

```typescript
// ✅ Good naming
user_registrations_total; // Clear, descriptive
http_request_duration_seconds; // Includes unit
cache_hit_rate; // Underscores, lowercase

// ❌ Bad naming
userReg; // Too abbreviated
RequestTime; // PascalCase
http - duration; // Hyphens
time_milliseconds; // Use seconds for time
```

**Rules**:

- Use `snake_case`
- Include unit in name (`_seconds`, `_bytes`, `_total`)
- Counters should end in `_total`
- Be descriptive but concise

## Querying Metrics

### PromQL Basics

Prometheus Query Language (PromQL) is used to query metrics.

#### Instant Queries

```promql
# Current value
http_requests_total

# Filter by label
http_requests_total{status_code="200"}

# Multiple label filters
http_requests_total{method="GET", route="/api/users"}
```

#### Range Queries

```promql
# Rate over 5 minutes
rate(http_requests_total[5m])

# Increase over 1 hour
increase(http_requests_total[1h])

# Average over 10 minutes
avg_over_time(active_connections[10m])
```

#### Aggregation

```promql
# Sum by label
sum by (status_code) (http_requests_total)

# Count unique values
count by (route) (http_requests_total)

# Average
avg(http_request_duration_seconds)
```

### Common Queries

#### Request Rate

```promql
# Requests per second
rate(http_requests_total[5m])

# Requests per minute
rate(http_requests_total[5m]) * 60
```

#### Error Rate

```promql
# Error percentage
sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100
```

#### Latency Percentiles

```promql
# 50th percentile (median)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

#### Throughput

```promql
# Total throughput
sum(rate(http_requests_total[5m]))

# Throughput by endpoint
sum by (route) (rate(http_requests_total[5m]))
```

#### Resource Usage

```promql
# Memory usage percentage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100

# CPU usage (from process metrics)
rate(process_cpu_seconds_total[5m]) * 100
```

## Dashboards

### Creating a Grafana Dashboard

1. **Open Grafana** at http://localhost:3001
2. **Add Dashboard** → New Dashboard
3. **Add Panel** → Select metric
4. **Configure Panel**:
   - Choose visualization (Graph, Gauge, Table)
   - Write PromQL query
   - Set legend, colors, thresholds
5. **Save Dashboard**

### Pre-built Dashboard Panels

#### Request Rate Panel

```promql
# Query
sum(rate(http_requests_total[5m])) by (method)

# Visualization: Time Series
# Legend: {{method}}
```

#### Error Rate Panel

```promql
# Query
sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100

# Visualization: Gauge
# Thresholds:
#   - Green: 0-1%
#   - Yellow: 1-5%
#   - Red: >5%
```

#### Latency Panel

```promql
# P50
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Visualization: Time Series
# Multiple queries on same panel
```

#### Resource Usage Panel

```promql
# Memory
nodejs_heap_size_used_bytes / 1024 / 1024

# Visualization: Gauge
# Unit: MiB
```

### Dashboard Variables

Use variables for dynamic dashboards:

```
# Variable: route
label_values(http_requests_total, route)

# Use in query
http_requests_total{route="$route"}
```

## Alerting

### Alert Rules

File: `alerts.yml`

```yaml
groups:
  - name: application_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
          sum(rate(http_requests_total[5m])) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value }}%'

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'High latency detected'
          description: 'P95 latency is {{ $value }}s'

      - alert: HighMemoryUsage
        expr: |
          nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High memory usage'
          description: 'Memory usage is {{ $value }}%'
```

### Alert Configuration

```yaml
# prometheus.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - 'alerts.yml'
```

Learn more: [ALERTS.md](ALERTS.md)

## Best Practices

### 1. Cardinality Management

```typescript
// ✅ Good - Limited cardinality
metricsService.incrementCounter('http_requests_total', {
  method: 'GET', // ~10 values
  status_code: '200', // ~20 values
  route: '/api/users', // ~100 values
});
// Total combinations: 10 × 20 × 100 = 20,000 ✓

// ❌ Bad - High cardinality
metricsService.incrementCounter('http_requests_total', {
  user_id: userId, // Millions of unique users
  request_id: requestId, // Every request unique
  timestamp: Date.now(), // Always unique
});
// Total combinations: Infinite ✗
```

### 2. Use Appropriate Metric Types

```typescript
// ✅ Counter for cumulative values
metricsService.incrementCounter('requests_total');

// ✅ Gauge for current state
metricsService.setGauge('active_users', userCount);

// ✅ Histogram for distributions
metricsService.recordHistogram('request_duration_seconds', duration);

// ❌ Don't use counter for gauge-like data
metricsService.incrementCounter('active_users'); // Wrong!
```

### 3. Include Units

```typescript
// ✅ Good - Units in name
metricsService.recordHistogram('request_duration_seconds', duration);
metricsService.recordHistogram('file_size_bytes', size);

// ❌ Bad - No units
metricsService.recordHistogram('request_duration', duration);
metricsService.recordHistogram('file_size', size);
```

### 4. Meaningful Labels

```typescript
// ✅ Good - Actionable labels
metricsService.incrementCounter('api_errors_total', {
  endpoint: '/api/users',
  error_type: 'ValidationError',
  status_code: '400',
});

// ❌ Bad - Useless labels
metricsService.incrementCounter('api_errors_total', {
  message: error.message, // Too variable
  timestamp: Date.now(), // Useless as label
});
```

### 5. Rate Over Count

```promql
# ✅ Good - Rate (requests per second)
rate(http_requests_total[5m])

# ❌ Bad - Raw count (meaningless)
http_requests_total
```

### 6. Avoid Expensive Queries

```promql
# ✅ Good - Pre-aggregated
sum by (route) (rate(http_requests_total[5m]))

# ❌ Bad - Expensive regex
http_requests_total{route=~"/api/.*"}

# ❌ Bad - Large time range
rate(http_requests_total[24h])
```

## Troubleshooting

### Metrics Not Appearing

1. Check metrics endpoint:

```bash
curl http://localhost:3000/metrics
```

2. Verify Prometheus config:

```bash
docker-compose logs prometheus
```

3. Check Prometheus targets:

```
http://localhost:9090/targets
```

### High Cardinality

Symptoms: Prometheus using too much memory

Solutions:

- Remove high-cardinality labels (user IDs, UUIDs)
- Aggregate before recording
- Use relabeling in Prometheus

### Queries Timing Out

Solutions:

- Reduce time range
- Use recording rules for expensive queries
- Increase Prometheus resources

## Related Documentation

- **[Observability Overview](README.md)** - Complete observability stack
- **[Logging Guide](LOGGING.md)** - Winston and Loki
- **[Tracing Guide](TRACING.md)** - OpenTelemetry and Tempo
- **[Alerts Guide](ALERTS.md)** - Alert configuration

## External Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Best Practices](https://prometheus.io/docs/practices/naming/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

---

**Next**: Set up [Logging](LOGGING.md) for centralized log aggregation.
