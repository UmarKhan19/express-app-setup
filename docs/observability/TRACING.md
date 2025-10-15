# Distributed Tracing with OpenTelemetry and Tempo

> **Track requests across services and identify performance bottlenecks**

This guide covers distributed tracing with OpenTelemetry SDK and Tempo backend.

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Automatic Instrumentation](#automatic-instrumentation)
- [Manual Instrumentation](#manual-instrumentation)
- [Viewing Traces](#viewing-traces)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Distributed tracing tracks requests as they flow through your application, showing:

- **Request flow** - Which services/functions were called
- **Performance** - How long each operation took
- **Errors** - Where failures occurred
- **Dependencies** - Service relationships

### What is a Trace?

```
┌─────────────────────────────────────────────────────┐
│                   Trace                              │
│  ┌────────────────────────────────────────────┐     │
│  │  Root Span: HTTP GET /api/orders/123      │     │
│  │  Duration: 245ms                          │     │
│  │  ┌──────────────────────────────────┐     │     │
│  │  │ Span: Validate Request          │     │     │
│  │  │ Duration: 5ms                   │     │     │
│  │  └──────────────────────────────────┘     │     │
│  │  ┌──────────────────────────────────┐     │     │
│  │  │ Span: Database Query            │     │     │
│  │  │ Duration: 150ms                 │     │     │
│  │  │  ┌──────────────────────────┐   │     │     │
│  │  │  │ Span: MongoDB FindOne   │   │     │     │
│  │  │  │ Duration: 145ms         │   │     │     │
│  │  │  └──────────────────────────┘   │     │     │
│  │  └──────────────────────────────────┘     │     │
│  │  ┌──────────────────────────────────┐     │     │
│  │  │ Span: Cache Update              │     │     │
│  │  │ Duration: 25ms                  │     │     │
│  │  └──────────────────────────────────┘     │     │
│  │  ┌──────────────────────────────────┐     │     │
│  │  │ Span: Send Response             │     │     │
│  │  │ Duration: 2ms                   │     │     │
│  │  └──────────────────────────────────┘     │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘

Trace = Collection of spans showing complete request flow
Span = Single operation with start time, end time, and metadata
```

## Architecture

### Tracing Flow

```
┌─────────────────────────────────────────────────────┐
│              Your Application                        │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │  OpenTelemetry SDK                   │           │
│  │  - Auto instrumentation              │           │
│  │  - Manual spans                      │           │
│  │  - Context propagation               │           │
│  └────────────┬─────────────────────────┘           │
└───────────────┼─────────────────────────────────────┘
                │
                │ Export traces
                ▼
┌─────────────────────────────────────────────────────┐
│           OpenTelemetry Collector                    │
│  - Receives traces                                  │
│  - Batches data                                     │
│  - Exports to backend                               │
└────────────────┬────────────────────────────────────┘
                 │
                 │ OTLP protocol
                 ▼
┌─────────────────────────────────────────────────────┐
│           Tempo (:3200)                              │
│  - Stores traces                                    │
│  - Indexes by trace ID                              │
│  - Provides query API                               │
└────────────────┬────────────────────────────────────┘
                 │
                 │ Trace queries
                 ▼
┌─────────────────────────────────────────────────────┐
│           Grafana (:3001)                            │
│  - Visualizes traces                                │
│  - Links to logs/metrics                            │
│  - Search by trace ID                               │
└─────────────────────────────────────────────────────┘
```

### Context Propagation

```
Service A                 Service B                Service C
   │                         │                        │
   ├─ Create Trace ID        │                        │
   │  trace: abc123          │                        │
   │                         │                        │
   ├─ HTTP Request ──────────►                        │
   │  Header: traceparent    │                        │
   │  trace: abc123          │                        │
   │                         │                        │
   │                         ├─ Extract Trace ID      │
   │                         │  trace: abc123         │
   │                         │                        │
   │                         ├─ HTTP Request ─────────►
   │                         │  Header: traceparent   │
   │                         │  trace: abc123         │
   │                         │                        │
   │                         │                        ├─ Use same trace
   │                         │                        │  trace: abc123
   │                         │                        │
   │                         │                        ├─ Response
   │                         │  ◄──────────────────────┤
   │                         │                        │
   │  ◄───────────────────────┤                        │
   │                         │                        │
```

## Setup

### 1. OpenTelemetry Configuration

File: `src/instrumentation.ts`

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Configure trace exporter
const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:3200/v1/traces',
});

// Configure SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'backend-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
      process.env.NODE_ENV || 'development',
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system tracing
      },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics'],
      },
    }),
  ],
});

// Start SDK
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});

export default sdk;
```

### 2. Import Instrumentation First

File: `src/server.ts`

```typescript
// ⚠️ IMPORTANT: Import instrumentation FIRST
import './instrumentation';

// Then import other modules
import express from 'express';
import { logger } from '@/common/utils/logger.util';
// ... rest of imports

const app = express();
// ... rest of application setup
```

### 3. Tempo Configuration

File: `tempo/tempo-config.yaml`

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        http:
          endpoint: 0.0.0.0:4318
        grpc:
          endpoint: 0.0.0.0:4317

ingester:
  trace_idle_period: 10s
  max_block_bytes: 1_000_000
  max_block_duration: 5m

compactor:
  compaction:
    compacted_block_retention: 1h

storage:
  trace:
    backend: local
    local:
      path: /var/tempo/traces
    wal:
      path: /var/tempo/wal
    pool:
      max_workers: 100
      queue_depth: 10000

querier:
  frontend_worker:
    frontend_address: tempo:9095

metrics_generator:
  registry:
    external_labels:
      source: tempo
  storage:
    path: /var/tempo/generator/wal
```

### 4. Verify Setup

```bash
# Start Tempo
docker-compose up -d tempo

# Check Tempo is ready
curl http://localhost:3200/ready

# Make a request to generate traces
curl http://localhost:3000/api/users

# Query traces
curl http://localhost:3200/api/search

# View in Grafana
open http://localhost:3001/explore
```

## Automatic Instrumentation

OpenTelemetry automatically instruments common libraries:

### HTTP/HTTPS

Automatically traces:

- Incoming HTTP requests
- Outgoing HTTP requests
- Request/response headers
- Status codes
- Error responses

```typescript
// No code needed - automatically traced
app.get('/api/users', async (req, res) => {
  const users = await userService.getAll();
  res.json(users);
});
```

### Express

Automatically traces:

- Route handlers
- Middleware execution
- Route parameters
- Error handlers

### MongoDB/Mongoose

Automatically traces:

- Database queries
- Collection operations
- Query parameters (sanitized)
- Query duration

```typescript
// No code needed - automatically traced
const user = await User.findById(userId);
```

### Redis

Automatically traces:

- Cache operations (GET, SET, DEL, etc.)
- Pipeline operations
- Pub/Sub operations

```typescript
// No code needed - automatically traced
await redis.set('key', 'value');
const value = await redis.get('key');
```

### What Gets Traced Automatically

| Library        | Traced Operations                  |
| -------------- | ---------------------------------- |
| **http/https** | Incoming/outgoing requests         |
| **express**    | Routes, middleware, errors         |
| **mongodb**    | Queries, inserts, updates, deletes |
| **redis**      | All Redis commands                 |
| **kafka**      | Producer sends, consumer receives  |
| **pg**         | PostgreSQL queries                 |
| **mysql**      | MySQL queries                      |
| **dns**        | DNS lookups                        |

## Manual Instrumentation

For custom business logic, add manual spans:

### Basic Span

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

async function processOrder(order: Order): Promise<void> {
  const span = tracer.startSpan('processOrder');

  try {
    // Your business logic
    await validateOrder(order);
    await chargePayment(order);
    await updateInventory(order);

    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Span with Attributes

```typescript
import { SpanStatusCode } from '@opentelemetry/api';

async function processPayment(order: Order): Promise<void> {
  const span = tracer.startSpan('processPayment', {
    attributes: {
      'order.id': order.id,
      'order.total': order.total,
      'payment.method': order.paymentMethod,
    },
  });

  try {
    const result = await paymentGateway.charge({
      amount: order.total,
      method: order.paymentMethod,
    });

    span.setAttributes({
      'payment.transaction_id': result.transactionId,
      'payment.status': result.status,
    });

    span.addEvent('payment_completed', {
      transaction_id: result.transactionId,
    });

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

### Nested Spans

```typescript
async function createOrder(orderData: CreateOrderDto): Promise<Order> {
  const parentSpan = tracer.startSpan('createOrder');

  try {
    // Child span 1: Validation
    const validationSpan = tracer.startSpan('validateOrder', {
      parent: parentSpan,
    });
    await validateOrder(orderData);
    validationSpan.end();

    // Child span 2: Save to database
    const dbSpan = tracer.startSpan('saveOrder', {
      parent: parentSpan,
    });
    const order = await orderRepository.create(orderData);
    dbSpan.end();

    // Child span 3: Send notification
    const notificationSpan = tracer.startSpan('sendNotification', {
      parent: parentSpan,
    });
    await notificationService.sendOrderConfirmation(order);
    notificationSpan.end();

    parentSpan.setStatus({ code: SpanStatusCode.OK });
    return order;
  } catch (error) {
    parentSpan.recordException(error);
    parentSpan.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    parentSpan.end();
  }
}
```

### Using Context

```typescript
import { context, trace } from '@opentelemetry/api';

async function processWithContext(order: Order): Promise<void> {
  const span = tracer.startSpan('processOrder');

  // Run in span context
  await context.with(trace.setSpan(context.active(), span), async () => {
    // All spans created here will be children
    await step1();
    await step2();
    await step3();
  });

  span.end();
}

async function step1(): Promise<void> {
  // Automatically becomes child of parent span
  const span = tracer.startSpan('step1');
  // ... implementation
  span.end();
}
```

### Async Operations

```typescript
async function processBatch(items: Item[]): Promise<void> {
  const parentSpan = tracer.startSpan('processBatch', {
    attributes: {
      'batch.size': items.length,
    },
  });

  try {
    // Process items in parallel, each with own span
    await Promise.all(items.map((item) => processItem(item, parentSpan)));

    parentSpan.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    parentSpan.recordException(error);
    parentSpan.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    parentSpan.end();
  }
}

async function processItem(item: Item, parentSpan: Span): Promise<void> {
  const span = tracer.startSpan('processItem', {
    parent: parentSpan,
    attributes: {
      'item.id': item.id,
    },
  });

  try {
    // Process item
    span.setStatus({ code: SpanStatusCode.OK });
  } finally {
    span.end();
  }
}
```

## Viewing Traces

### Grafana Explore

1. **Open Grafana**: http://localhost:3001
2. **Go to Explore** (compass icon)
3. **Select Tempo** data source
4. **Search traces**:
   - By trace ID
   - By service name
   - By operation name
   - By duration
   - By tags

### Trace Search

```
Query Builder:
- Service Name: backend-service
- Operation Name: GET /api/users
- Min Duration: 100ms
- Tags:
  - status_code = 200
  - user_id = 123
```

### Trace View

```
┌─────────────────────────────────────────────────────┐
│  Trace: abc123def456                                 │
│  Duration: 245ms                                     │
│  Spans: 8                                            │
│  Service: backend-service                            │
├─────────────────────────────────────────────────────┤
│  Timeline:                                           │
│  ═══════════════════════════════════════════════    │
│  0ms                                         245ms   │
│                                                      │
│  GET /api/users                        [245ms]      │
│  │                                                   │
│  ├─ validateRequest                   [5ms]         │
│  │                                                   │
│  ├─ database.query                    [150ms]       │
│  │  └─ mongodb.findOne                [145ms]       │
│  │                                                   │
│  ├─ cache.set                         [25ms]        │
│  │                                                   │
│  └─ response.send                     [2ms]         │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Span Details:                                       │
│  Name: database.query                                │
│  Duration: 150ms                                     │
│  Attributes:                                         │
│    - db.system: mongodb                              │
│    - db.operation: findOne                           │
│    - db.collection: users                            │
│  Events:                                             │
│    - query_start (0ms)                               │
│    - query_complete (150ms)                          │
└─────────────────────────────────────────────────────┘
```

### Linking Traces to Logs

Grafana can link traces to related logs:

```typescript
// Add trace ID to logs
import { trace } from '@opentelemetry/api';
import { logger } from '@/common/utils/logger.util';

const span = trace.getActiveSpan();
const traceId = span?.spanContext().traceId;

logger.info('Processing order', {
  orderId: order.id,
  traceId, // Link to trace
});
```

In Grafana:

1. View trace
2. Click "Logs for this span"
3. See all logs with same trace ID

## Best Practices

### 1. Meaningful Span Names

```typescript
// ✅ Good - Describes operation
tracer.startSpan('processPayment');
tracer.startSpan('getUserById');
tracer.startSpan('sendEmailNotification');

// ❌ Bad - Generic names
tracer.startSpan('process');
tracer.startSpan('function1');
tracer.startSpan('doStuff');
```

### 2. Add Context with Attributes

```typescript
// ✅ Good - Rich context
span.setAttributes({
  'user.id': userId,
  'user.email': userEmail,
  'order.id': orderId,
  'order.total': orderTotal,
  'payment.method': 'credit_card',
});

// ❌ Bad - No context
span.setAttributes({
  id: userId,
});
```

### 3. Record Exceptions

```typescript
// ✅ Good - Full exception details
try {
  await processPayment(order);
} catch (error) {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
  throw error;
}

// ❌ Bad - No exception recording
try {
  await processPayment(order);
} catch (error) {
  throw error;
}
```

### 4. Always End Spans

```typescript
// ✅ Good - Always ends
const span = tracer.startSpan('operation');
try {
  await doWork();
} finally {
  span.end();
}

// ❌ Bad - May not end on error
const span = tracer.startSpan('operation');
await doWork();
span.end();
```

### 5. Use Semantic Conventions

Follow OpenTelemetry semantic conventions:

```typescript
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

span.setAttributes({
  [SemanticAttributes.HTTP_METHOD]: 'GET',
  [SemanticAttributes.HTTP_URL]: '/api/users',
  [SemanticAttributes.HTTP_STATUS_CODE]: 200,
  [SemanticAttributes.DB_SYSTEM]: 'mongodb',
  [SemanticAttributes.DB_OPERATION]: 'findOne',
});
```

### 6. Sample in Production

Reduce trace volume in production:

```typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const sdk = new NodeSDK({
  // Sample 10% of traces
  sampler: new TraceIdRatioBasedSampler(0.1),
  // ... rest of config
});
```

### 7. Don't Trace Too Much

```typescript
// ✅ Good - Trace important operations
span = tracer.startSpan('processOrder'); // Yes
span = tracer.startSpan('saveToDatabase'); // Yes
span = tracer.startSpan('sendNotification'); // Yes

// ❌ Bad - Too granular
span = tracer.startSpan('validateEmail'); // Too small
span = tracer.startSpan('formatDate'); // Too small
span = tracer.startSpan('console.log'); // Never
```

## Performance Impact

### Resource Usage

Approximate overhead per traced request:

| Component           | Overhead          |
| ------------------- | ----------------- |
| Span creation       | ~0.1ms            |
| Context propagation | ~0.05ms           |
| Attribute setting   | ~0.01ms each      |
| Exception recording | ~0.5ms            |
| Export to Tempo     | Async (no impact) |
| **Total**           | ~1-3ms            |

### Optimization Tips

1. **Use sampling** in production
2. **Batch exports** to reduce network calls
3. **Limit span attributes** to essential data
4. **Disable file system tracing**
5. **Ignore health check endpoints**

```typescript
const sdk = new NodeSDK({
  // Batch exports
  spanProcessor: new BatchSpanProcessor(traceExporter, {
    maxQueueSize: 2048,
    scheduledDelayMillis: 5000,
  }),

  // Sample traces
  sampler: new TraceIdRatioBasedSampler(0.1),

  // Disable unnecessary instrumentation
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});
```

## Troubleshooting

### Traces Not Appearing

1. Check instrumentation is imported first:

```typescript
// Must be first import
import './instrumentation';
```

2. Verify Tempo is running:

```bash
docker-compose ps tempo
curl http://localhost:3200/ready
```

3. Check trace exports:

```bash
docker-compose logs tempo
```

### Missing Spans

Problem: Some operations not traced

Solutions:

- Check library is supported by auto-instrumentation
- Add manual instrumentation
- Verify span is ended properly

### High Memory Usage

Problem: Tracing using too much memory

Solutions:

- Increase sampling rate (trace fewer requests)
- Reduce span attributes
- Increase batch export interval

```typescript
sampler: new TraceIdRatioBasedSampler(0.05),  // 5% instead of 100%
```

### Context Not Propagating

Problem: Child spans not linked to parent

Solution: Use context properly:

```typescript
import { context, trace } from '@opentelemetry/api';

// Wrap async operations
await context.with(trace.setSpan(context.active(), span), async () => {
  // Operations here inherit context
});
```

## Related Documentation

- **[Observability Overview](README.md)** - Complete observability stack
- **[Metrics Guide](METRICS.md)** - Prometheus metrics
- **[Logging Guide](LOGGING.md)** - Winston and Loki
- **[Troubleshooting](../guides/TROUBLESHOOTING.md)** - Common issues

## External Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Tempo Documentation](https://grafana.com/docs/tempo/)
- [Semantic Conventions](https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/)
- [Node.js Instrumentation](https://opentelemetry.io/docs/instrumentation/js/)

---

**Next**: Set up [Alerts](ALERTS.md) for proactive monitoring.
