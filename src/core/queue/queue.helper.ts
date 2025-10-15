import { BaseProcessor } from './base.processor';
import processorRegistry from './queue.registry';
import logger from '@/common/utils/logger.util';

/**
 * Processor helper utilities
 * Provides convenient methods for managing processors
 */
export class ProcessorHelper {
  /**
   * Register a new processor
   */
  static register<T = unknown>(
    queueName: string,
    processor: BaseProcessor<T>,
    options?: {
      concurrency?: number;
      enabled?: boolean;
    }
  ): void {
    processorRegistry.register({
      queueName,
      processor: processor as BaseProcessor<unknown>,
      concurrency: options?.concurrency,
      enabled: options?.enabled ?? true,
    });

    logger.info(`Processor registered for queue: ${queueName}`);
  }

  /**
   * Unregister a processor
   */
  static unregister(queueName: string): boolean {
    const success = processorRegistry.unregister(queueName);

    if (success) {
      logger.info(`Processor unregistered for queue: ${queueName}`);
    } else {
      logger.warn(`No processor found for queue: ${queueName}`);
    }

    return success;
  }

  /**
   * Check if a processor is registered
   */
  static isRegistered(queueName: string): boolean {
    return processorRegistry.has(queueName);
  }

  /**
   * Get all registered queue names
   */
  static getQueueNames(): string[] {
    return processorRegistry.getQueueNames();
  }

  /**
   * Get count of registered processors
   */
  static getCount(): number {
    return processorRegistry.getAll().length;
  }

  /**
   * List all registered processors
   */
  static list(): Array<{
    queueName: string;
    concurrency?: number;
    enabled?: boolean;
  }> {
    return processorRegistry.getAll().map((config) => ({
      queueName: config.queueName,
      concurrency: config.concurrency,
      enabled: config.enabled,
    }));
  }
}
