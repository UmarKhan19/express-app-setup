import { EachMessagePayload } from 'kafkajs';
import { BaseKafkaConsumer } from '../base.consumer';
import { IKafkaEvent } from '../kafka.interface';
import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * Audit log event data
 */
interface AuditLogEvent {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  changes?: Record<string, unknown>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit log consumer
 * Captures and stores all audit events for compliance and tracking
 */
export class AuditLogConsumer extends BaseKafkaConsumer {
  name = 'audit-log-consumer';
  topics = [config.kafka.topics.auditLogs];
  groupId = 'audit-log-group';
  fromBeginning = false;

  /**
   * Process audit log messages
   */
  async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    const key = this.getMessageKey(message.key);
    const event = this.parseMessageValue<IKafkaEvent<AuditLogEvent>>(
      message.value
    );

    if (!event) {
      logger.warn('Received empty message in audit log consumer');
      return;
    }

    logger.info('Processing audit log event', {
      eventType: event.metadata.eventType,
      eventId: event.metadata.eventId,
      action: event.data.action,
      entityType: event.data.entityType,
      entityId: event.data.entityId,
      key,
      topic,
      partition,
      offset: message.offset,
    });

    await this.storeAuditLog(event);
  }

  /**
   * Store audit log
   */
  private async storeAuditLog(
    event: IKafkaEvent<AuditLogEvent>
  ): Promise<void> {
    // In a real application, you would:
    // 1. Store the audit log in a database (MongoDB, PostgreSQL, etc.)
    // 2. Index it in a search engine (Elasticsearch)
    // 3. Send to a SIEM system
    // 4. Archive to long-term storage (S3, etc.)

    logger.info('Audit log stored', {
      eventId: event.metadata.eventId,
      action: event.data.action,
      entityType: event.data.entityType,
      entityId: event.data.entityId,
      timestamp: event.data.timestamp,
    });

    // Example implementation:
    // await AuditLogModel.create({
    //   eventId: event.metadata.eventId,
    //   eventType: event.metadata.eventType,
    //   action: event.data.action,
    //   entityType: event.data.entityType,
    //   entityId: event.data.entityId,
    //   userId: event.data.userId,
    //   changes: event.data.changes,
    //   timestamp: event.data.timestamp,
    //   metadata: event.data.metadata,
    // });
  }
}
