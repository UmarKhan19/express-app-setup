import { Counter, Gauge, Histogram, Registry, register } from 'prom-client';
import config from '@/config';

/**
 * Metrics Service
 * Provides Prometheus metrics for application monitoring
 */
class MetricsService {
  private readonly registry: Registry;
  private readonly prefix: string;

  // HTTP Metrics
  public httpRequestsTotal: Counter;
  public httpRequestDuration: Histogram;
  public httpRequestSize: Histogram;
  public httpResponseSize: Histogram;

  // Database Metrics
  public dbQueryDuration: Histogram;
  public dbConnectionsActive: Gauge;
  public dbQueryErrors: Counter;

  // Cache Metrics
  public cacheHits: Counter;
  public cacheMisses: Counter;
  public cacheOperationDuration: Histogram;

  // Queue Metrics
  public queueJobsTotal: Counter;
  public queueJobsActive: Gauge;
  public queueJobDuration: Histogram;
  public queueJobsFailed: Counter;

  // Kafka Metrics
  public kafkaMessagesProduced: Counter;
  public kafkaMessagesConsumed: Counter;
  public kafkaMessageErrors: Counter;

  // Business Metrics
  public usersRegistered: Counter;
  public emailsSent: Counter;
  public apiErrors: Counter;

  // System Metrics
  public activeConnections: Gauge;
  public memoryUsage: Gauge;

  constructor() {
    this.registry = register;
    this.prefix = config.observability?.metricsPrefix || 'backend_app_';

    // Initialize HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: `${this.prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: `${this.prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestSize = new Histogram({
      name: `${this.prefix}http_request_size_bytes`,
      help: 'HTTP request size in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
      registers: [this.registry],
    });

    this.httpResponseSize = new Histogram({
      name: `${this.prefix}http_response_size_bytes`,
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
      registers: [this.registry],
    });

    // Initialize Database Metrics
    this.dbQueryDuration = new Histogram({
      name: `${this.prefix}db_query_duration_seconds`,
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'collection'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new Gauge({
      name: `${this.prefix}db_connections_active`,
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    this.dbQueryErrors = new Counter({
      name: `${this.prefix}db_query_errors_total`,
      help: 'Total number of database query errors',
      labelNames: ['operation', 'collection'],
      registers: [this.registry],
    });

    // Initialize Cache Metrics
    this.cacheHits = new Counter({
      name: `${this.prefix}cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['operation'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: `${this.prefix}cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['operation'],
      registers: [this.registry],
    });

    this.cacheOperationDuration = new Histogram({
      name: `${this.prefix}cache_operation_duration_seconds`,
      help: 'Cache operation duration in seconds',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    // Initialize Queue Metrics
    this.queueJobsTotal = new Counter({
      name: `${this.prefix}queue_jobs_total`,
      help: 'Total number of queue jobs',
      labelNames: ['queue', 'status'],
      registers: [this.registry],
    });

    this.queueJobsActive = new Gauge({
      name: `${this.prefix}queue_jobs_active`,
      help: 'Number of active queue jobs',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.queueJobDuration = new Histogram({
      name: `${this.prefix}queue_job_duration_seconds`,
      help: 'Queue job processing duration in seconds',
      labelNames: ['queue', 'processor'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
      registers: [this.registry],
    });

    this.queueJobsFailed = new Counter({
      name: `${this.prefix}queue_jobs_failed_total`,
      help: 'Total number of failed queue jobs',
      labelNames: ['queue', 'processor'],
      registers: [this.registry],
    });

    // Initialize Kafka Metrics
    this.kafkaMessagesProduced = new Counter({
      name: `${this.prefix}kafka_messages_produced_total`,
      help: 'Total number of Kafka messages produced',
      labelNames: ['topic'],
      registers: [this.registry],
    });

    this.kafkaMessagesConsumed = new Counter({
      name: `${this.prefix}kafka_messages_consumed_total`,
      help: 'Total number of Kafka messages consumed',
      labelNames: ['topic', 'consumer_group'],
      registers: [this.registry],
    });

    this.kafkaMessageErrors = new Counter({
      name: `${this.prefix}kafka_message_errors_total`,
      help: 'Total number of Kafka message errors',
      labelNames: ['topic', 'error_type'],
      registers: [this.registry],
    });

    // Initialize Business Metrics
    this.usersRegistered = new Counter({
      name: `${this.prefix}users_registered_total`,
      help: 'Total number of users registered',
      registers: [this.registry],
    });

    this.emailsSent = new Counter({
      name: `${this.prefix}emails_sent_total`,
      help: 'Total number of emails sent',
      labelNames: ['type', 'status'],
      registers: [this.registry],
    });

    this.apiErrors = new Counter({
      name: `${this.prefix}api_errors_total`,
      help: 'Total number of API errors',
      labelNames: ['error_type', 'endpoint'],
      registers: [this.registry],
    });

    // Initialize System Metrics
    this.activeConnections = new Gauge({
      name: `${this.prefix}active_connections`,
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.memoryUsage = new Gauge({
      name: `${this.prefix}memory_usage_bytes`,
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.registry],
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    // Update memory metrics before exporting
    const memUsage = process.memoryUsage();
    this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
    this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
    this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
    this.memoryUsage.set({ type: 'external' }, memUsage.external);

    return this.registry.metrics();
  }

  /**
   * Get registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.registry.resetMetrics();
  }
}

export const metricsService = new MetricsService();
export default metricsService;
