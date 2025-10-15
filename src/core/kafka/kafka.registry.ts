import { BaseKafkaConsumer } from './base.consumer';
import consumerRegistry from './consumer.registry';
import logger from '@/common/utils/logger.util';

/**
 * Register a Kafka consumer
 * This is a utility function to make consumer registration easier
 *
 * @param consumer - Instance of BaseKafkaConsumer or its subclass
 */
export function registerKafkaConsumer(consumer: BaseKafkaConsumer): void {
  try {
    consumerRegistry.register(consumer);
    logger.info(`Consumer ${consumer.name} registered successfully`);
  } catch (error) {
    logger.error(`Failed to register consumer ${consumer.name}:`, error);
    throw error;
  }
}

/**
 * Register multiple Kafka consumers at once
 *
 * @param consumers - Array of BaseKafkaConsumer instances
 */
export function registerKafkaConsumers(consumers: BaseKafkaConsumer[]): void {
  for (const consumer of consumers) {
    registerKafkaConsumer(consumer);
  }
}
