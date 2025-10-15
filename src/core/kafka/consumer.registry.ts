import { BaseKafkaConsumer } from './base.consumer';
import logger from '@/common/utils/logger.util';

/**
 * Consumer registry
 * Manages all Kafka consumers
 */
class ConsumerRegistry {
  private consumers: BaseKafkaConsumer[] = [];

  /**
   * Register a consumer
   */
  register(consumer: BaseKafkaConsumer): void {
    this.consumers.push(consumer);
    logger.info(`Consumer ${consumer.name} registered in registry`);
  }

  /**
   * Get all consumers
   */
  getAll(): BaseKafkaConsumer[] {
    return this.consumers;
  }

  /**
   * Get a consumer by name
   */
  getByName(name: string): BaseKafkaConsumer | undefined {
    return this.consumers.find((c) => c.name === name);
  }

  /**
   * Initialize all consumers
   */
  async initializeAll(): Promise<void> {
    logger.info(`Initializing ${this.consumers.length} Kafka consumers`);

    const initPromises = this.consumers.map(async (consumer) => {
      try {
        await consumer.initialize();
        logger.info(`Consumer ${consumer.name} initialized successfully`);
      } catch (error) {
        logger.error(`Failed to initialize consumer ${consumer.name}:`, error);
        // Don't throw - allow other consumers to initialize
      }
    });

    await Promise.all(initPromises);
    logger.info('All Kafka consumers initialized');
  }

  /**
   * Stop all consumers
   */
  async stopAll(): Promise<void> {
    logger.info(`Stopping ${this.consumers.length} Kafka consumers`);

    const stopPromises = this.consumers.map(async (consumer) => {
      try {
        await consumer.stop();
        logger.info(`Consumer ${consumer.name} stopped successfully`);
      } catch (error) {
        logger.error(`Failed to stop consumer ${consumer.name}:`, error);
      }
    });

    await Promise.all(stopPromises);
    logger.info('All Kafka consumers stopped');
  }
}

export default new ConsumerRegistry();
