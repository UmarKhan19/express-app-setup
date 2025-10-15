import metricsService from './metrics.service';

/**
 * Helper functions to track operations for observability
 */

/**
 * Track database operations
 */
export const trackDbOperation = async <T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = (Date.now() - start) / 1000;
    metricsService.dbQueryDuration.observe({ operation, collection }, duration);
    return result;
  } catch (error) {
    metricsService.dbQueryErrors.inc({ operation, collection });
    throw error;
  }
};

/**
 * Track cache operations
 */
export const trackCacheOperation = async <T>(
  operation: 'get' | 'set' | 'del',
  fn: () => Promise<T>,
  isHit?: boolean
): Promise<T> => {
  const start = Date.now();
  const result = await fn();
  const duration = (Date.now() - start) / 1000;
  metricsService.cacheOperationDuration.observe({ operation }, duration);

  // Track hits/misses for get operations
  if (operation === 'get') {
    if (isHit !== undefined) {
      if (isHit) {
        metricsService.cacheHits.inc({ operation });
      } else {
        metricsService.cacheMisses.inc({ operation });
      }
    }
  }

  return result;
};

/**
 * Track Kafka message production
 */
export const trackKafkaProduction = (topic: string) => {
  metricsService.kafkaMessagesProduced.inc({ topic });
};

/**
 * Track Kafka message consumption
 */
export const trackKafkaConsumption = (topic: string, consumerGroup: string) => {
  metricsService.kafkaMessagesConsumed.inc({
    topic,
    consumer_group: consumerGroup,
  });
};

/**
 * Track Kafka errors
 */
export const trackKafkaError = (topic: string, errorType: string) => {
  metricsService.kafkaMessageErrors.inc({ topic, error_type: errorType });
};

/**
 * Track queue job processing
 */
export const trackQueueJob = async <T>(
  queue: string,
  processor: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  metricsService.queueJobsTotal.inc({ queue, status: 'processing' });
  metricsService.queueJobsActive.inc({ queue });

  try {
    const result = await fn();
    const duration = (Date.now() - start) / 1000;
    metricsService.queueJobDuration.observe({ queue, processor }, duration);
    metricsService.queueJobsTotal.inc({ queue, status: 'completed' });
    metricsService.queueJobsActive.dec({ queue });
    return result;
  } catch (error) {
    metricsService.queueJobsFailed.inc({ queue, processor });
    metricsService.queueJobsActive.dec({ queue });
    metricsService.queueJobsTotal.inc({ queue, status: 'failed' });
    throw error;
  }
};

/**
 * Track active database connections
 */
export const updateDbConnections = (count: number) => {
  metricsService.dbConnectionsActive.set(count);
};

/**
 * Track business metrics
 */
export const trackUserRegistration = () => {
  metricsService.usersRegistered.inc();
};

export const trackEmailSent = (type: string, status: 'success' | 'failed') => {
  metricsService.emailsSent.inc({ type, status });
};
