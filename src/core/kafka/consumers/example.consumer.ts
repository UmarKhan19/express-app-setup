/**
 * EXAMPLE CONSUMER TEMPLATE
 *
 * This is a template showing how to create a new Kafka consumer.
 * Copy this file and modify it for your specific use case.
 *
 * Steps to create a new consumer:
 * 1. Create a new consumer class extending BaseKafkaConsumer
 * 2. Define the consumer name, topics, and group ID
 * 3. Implement the processMessage method
 * 4. Register the consumer in kafka.init.ts
 *
 * Example usage:
 * ```typescript
 * export class MyCustomConsumer extends BaseKafkaConsumer {
 *   name = 'my-custom-consumer';
 *   topics = ['my.topic'];
 *   groupId = 'my-consumer-group';
 *   fromBeginning = false;
 *
 *   async processMessage(payload: EachMessagePayload): Promise<void> {
 *     const event = this.parseMessageValue<IKafkaEvent<MyDataType>>(
 *       payload.message.value
 *     );
 *     // Process your event here
 *   }
 * }
 * ```
 *
 * Then register it in kafka.init.ts:
 * ```typescript
 * import { MyCustomConsumer } from './path/to/consumer';
 *
 * export async function initializeKafkaConsumers(): Promise<void> {
 *   consumerRegistry.register(new MyCustomConsumer());
 *   await consumerRegistry.initializeAll();
 * }
 * ```
 */

import { EachMessagePayload } from 'kafkajs';
import { BaseKafkaConsumer } from '../base.consumer';
import { IKafkaEvent } from '../kafka.interface';
import logger from '@/common/utils/logger.util';

/**
 * Define your event data types
 */
interface MyEventData {
  id: string;
  action: string;
  timestamp: string;
  // Add your fields here
}

/**
 * Example Kafka Consumer
 * This is a template - copy and modify for your needs
 */
export class ExampleConsumer extends BaseKafkaConsumer {
  // Required: Unique consumer name
  name = 'example-consumer';

  // Required: Topics to subscribe to (can be string[] or RegExp[])
  topics = ['example.topic'];

  // Required: Consumer group ID for load balancing
  groupId = 'example-group';

  // Optional: Start from beginning (default: false)
  fromBeginning = false;

  /**
   * Required: Process incoming messages
   * This method is called for each message received
   */
  async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    // Parse the message key (optional)
    const key = this.getMessageKey(message.key);

    // Parse the message value (required)
    const event = this.parseMessageValue<IKafkaEvent<MyEventData>>(
      message.value
    );

    if (!event) {
      logger.warn('Received empty message in example consumer');
      return;
    }

    // Log the event
    logger.info('Processing event in example consumer', {
      eventType: event.metadata.eventType,
      eventId: event.metadata.eventId,
      key,
      topic,
      partition,
      offset: message.offset,
    });

    // Route to specific handlers based on event type
    switch (event.metadata.eventType) {
      case 'example.created':
        await this.handleCreated(event.data);
        break;
      case 'example.updated':
        await this.handleUpdated(event.data);
        break;
      case 'example.deleted':
        await this.handleDeleted(event.data);
        break;
      default:
        logger.warn(`Unknown event type: ${event.metadata.eventType}`);
    }
  }

  /**
   * Handle created events
   */
  private async handleCreated(data: MyEventData): Promise<void> {
    logger.info('Handling created event', { id: data.id });
    // Implement your logic here
  }

  /**
   * Handle updated events
   */
  private async handleUpdated(data: MyEventData): Promise<void> {
    logger.info('Handling updated event', { id: data.id });
    // Implement your logic here
  }

  /**
   * Handle deleted events
   */
  private async handleDeleted(data: MyEventData): Promise<void> {
    logger.info('Handling deleted event', { id: data.id });
    // Implement your logic here
  }

  /**
   * Optional: Override error handling
   * By default, errors are logged. Override this for custom behavior.
   */
  async handleError(error: Error, payload?: EachMessagePayload): Promise<void> {
    logger.error('Error in example consumer:', {
      error: error.message,
      stack: error.stack,
      topic: payload?.topic,
      partition: payload?.partition,
      offset: payload?.message.offset,
    });

    // Add custom error handling logic here
    // For example: send to error tracking service, retry logic, etc.
  }
}
