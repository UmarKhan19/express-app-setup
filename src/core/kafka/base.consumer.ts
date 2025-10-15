import { EachMessagePayload } from 'kafkajs';
import { IBaseKafkaConsumer } from './kafka.interface';
import kafkaService from './kafka.service';
import logger from '@/common/utils/logger.util';

/**
 * Base Kafka consumer class
 * Provides common functionality for all Kafka consumers
 */
export abstract class BaseKafkaConsumer implements IBaseKafkaConsumer {
  abstract name: string;
  abstract topics: string[] | RegExp[];
  abstract groupId: string;
  fromBeginning?: boolean = false;

  /**
   * Initialize the consumer
   */
  async initialize(): Promise<void> {
    try {
      await kafkaService.registerConsumer(
        this.name,
        {
          groupId: this.groupId,
          topics: this.topics,
          fromBeginning: this.fromBeginning,
          autoCommit: true,
          partitionsConsumedConcurrently: 1,
        },
        this.handleMessage.bind(this)
      );

      logger.info(`Consumer ${this.name} initialized`);
    } catch (error) {
      logger.error(`Failed to initialize consumer ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      await this.processMessage(payload);
    } catch (error) {
      await this.handleError(
        error instanceof Error ? error : new Error(String(error)),
        payload
      );
    }
  }

  /**
   * Process a message - to be implemented by subclasses
   */
  abstract processMessage(payload: EachMessagePayload): Promise<void>;

  /**
   * Handle errors - can be overridden by subclasses
   */
  async handleError(error: Error, payload?: EachMessagePayload): Promise<void> {
    logger.error(`Error in consumer ${this.name}:`, {
      error: error.message,
      stack: error.stack,
      topic: payload?.topic,
      partition: payload?.partition,
      offset: payload?.message.offset,
    });

    // Default error handling - log and continue
    // Subclasses can override this for custom error handling
  }

  /**
   * Stop the consumer
   */
  async stop(): Promise<void> {
    await kafkaService.stopConsumer(this.name);
  }

  /**
   * Parse message value as JSON
   */
  protected parseMessageValue<T>(value: Buffer | null): T | null {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value.toString()) as T;
    } catch (error) {
      logger.error(`Failed to parse message value in ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Get message key as string
   */
  protected getMessageKey(key: Buffer | null): string | null {
    if (!key) {
      return null;
    }

    return key.toString();
  }

  /**
   * Get message headers as object
   */
  protected getMessageHeaders(
    headers?: Record<string, Buffer | Buffer[] | undefined>
  ): Record<string, string> | null {
    if (!headers) {
      return null;
    }

    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (value) {
        if (Array.isArray(value)) {
          result[key] = value[0]?.toString() || '';
        } else {
          result[key] = value.toString();
        }
      }
    }

    return result;
  }
}
