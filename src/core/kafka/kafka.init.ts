import consumerRegistry from './consumer.registry';
import { AuditLogConsumer } from './consumers/audit-log.consumer';
import { UserEventsConsumer } from '@/features/user/consumers';
import logger from '@/common/utils/logger.util';

/**
 * Initialize all Kafka consumers
 * This function registers all consumers from different feature modules
 *
 * To add new consumers:
 * 1. Create your consumer class extending BaseKafkaConsumer
 * 2. Import it here
 * 3. Register it with consumerRegistry.register()
 */
export async function initializeKafkaConsumers(): Promise<void> {
  logger.info('Initializing Kafka consumers...');

  // Register core consumers (audit logs, etc.)
  consumerRegistry.register(new AuditLogConsumer());

  // Register feature-specific consumers
  consumerRegistry.register(new UserEventsConsumer());

  // Initialize all registered consumers
  await consumerRegistry.initializeAll();

  logger.info('Kafka consumers initialization complete');
}

/**
 * Shutdown all Kafka consumers
 */
export async function shutdownKafkaConsumers(): Promise<void> {
  logger.info('Shutting down Kafka consumers...');
  await consumerRegistry.stopAll();
  logger.info('Kafka consumers shutdown complete');
}
