import { EachMessagePayload } from 'kafkajs';
import { BaseKafkaConsumer } from '@/core/kafka/base.consumer';
import { IKafkaEvent } from '@/core/kafka/kafka.interface';
import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * User event data types
 */
interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserUpdatedEvent {
  userId: string;
  email?: string;
  name?: string;
  updatedAt: string;
}

interface UserDeletedEvent {
  userId: string;
  deletedAt: string;
}

type UserEventData = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent;

/**
 * User events consumer
 * Listens to user-related events and processes them
 */
export class UserEventsConsumer extends BaseKafkaConsumer {
  name = 'user-events-consumer';
  topics = [config.kafka.topics.userEvents];
  groupId = 'user-events-group';
  fromBeginning = false;

  /**
   * Process user event messages
   */
  async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    const key = this.getMessageKey(message.key);
    const event = this.parseMessageValue<IKafkaEvent<UserEventData>>(
      message.value
    );

    if (!event) {
      logger.warn('Received empty message in user events consumer');
      return;
    }

    logger.info('Processing user event', {
      eventType: event.metadata.eventType,
      eventId: event.metadata.eventId,
      key,
      topic,
      partition,
      offset: message.offset,
    });

    // Route to appropriate handler based on event type
    switch (event.metadata.eventType) {
      case 'user.created':
        await this.handleUserCreated(event.data as UserCreatedEvent);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event.data as UserUpdatedEvent);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event.data as UserDeletedEvent);
        break;
      default:
        logger.warn(`Unknown user event type: ${event.metadata.eventType}`);
    }
  }

  /**
   * Handle user created event
   */
  private async handleUserCreated(data: UserCreatedEvent): Promise<void> {
    logger.info('User created event received', {
      userId: data.userId,
      email: data.email,
    });

    // Example: Send welcome email, update analytics, etc.
    // This is where you'd integrate with other services
  }

  /**
   * Handle user updated event
   */
  private async handleUserUpdated(data: UserUpdatedEvent): Promise<void> {
    logger.info('User updated event received', {
      userId: data.userId,
    });

    // Example: Update cache, sync with external services, etc.
  }

  /**
   * Handle user deleted event
   */
  private async handleUserDeleted(data: UserDeletedEvent): Promise<void> {
    logger.info('User deleted event received', {
      userId: data.userId,
    });

    // Example: Cleanup user data, notify other services, etc.
  }
}
