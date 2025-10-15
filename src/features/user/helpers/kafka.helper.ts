import { kafkaService, createMessageKey } from '@/core/kafka';
import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * Helper functions to publish Kafka events
 */

/**
 * Publish a user event to Kafka
 */
export async function publishUserEvent<T>(
  eventType: string,
  userId: string,
  data: T
): Promise<void> {
  if (!config.kafka.enabled || !kafkaService.isConnected()) {
    return;
  }

  try {
    const event = kafkaService.createEvent(eventType, data);

    await kafkaService.produce(config.kafka.topics.userEvents, {
      key: createMessageKey('user', userId),
      value: event,
    });

    logger.debug('User event published', { eventType, userId });
  } catch (error) {
    logger.error('Failed to publish user event', {
      eventType,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - event publishing should not break the main flow
  }
}

/**
 * Publish an audit log event to Kafka
 */
export async function publishAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  userId?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  if (!config.kafka.enabled || !kafkaService.isConnected()) {
    return;
  }

  try {
    const auditEvent = kafkaService.createEvent('audit.log', {
      action,
      entityType,
      entityId,
      userId,
      changes,
      timestamp: new Date().toISOString(),
    });

    await kafkaService.produce(config.kafka.topics.auditLogs, {
      key: createMessageKey('audit', entityId),
      value: auditEvent,
    });

    logger.debug('Audit log published', { action, entityType, entityId });
  } catch (error) {
    logger.error('Failed to publish audit log', {
      action,
      entityType,
      entityId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - event publishing should not break the main flow
  }
}
