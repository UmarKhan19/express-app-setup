import { BaseProcessor } from './base.processor';
import logger from '@/common/utils/logger.util';

/**
 * Processor configuration
 */
export interface ProcessorConfig {
  queueName: string;
  processor: BaseProcessor<unknown>;
  concurrency?: number;
  enabled?: boolean;
}

/**
 * Queue processor registry
 * Manages registration and retrieval of queue processors
 */
class ProcessorRegistry {
  private static instance: ProcessorRegistry;
  private processors = new Map<string, ProcessorConfig>();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ProcessorRegistry {
    if (!ProcessorRegistry.instance) {
      ProcessorRegistry.instance = new ProcessorRegistry();
    }
    return ProcessorRegistry.instance;
  }

  /**
   * Register a processor
   */
  register(config: ProcessorConfig): void {
    const { queueName, enabled = true } = config;

    if (this.processors.has(queueName)) {
      logger.warn(`Processor for queue ${queueName} is already registered`);
      return;
    }

    if (!enabled) {
      logger.info(`Processor for queue ${queueName} is disabled, skipping`);
      return;
    }

    this.processors.set(queueName, config);
    logger.debug(`Processor registered for queue: ${queueName}`);
  }

  /**
   * Unregister a processor
   */
  unregister(queueName: string): boolean {
    const deleted = this.processors.delete(queueName);
    if (deleted) {
      logger.debug(`Processor unregistered for queue: ${queueName}`);
    }
    return deleted;
  }

  /**
   * Get a processor by queue name
   */
  get(queueName: string): ProcessorConfig | undefined {
    return this.processors.get(queueName);
  }

  /**
   * Get all registered processors
   */
  getAll(): ProcessorConfig[] {
    return Array.from(this.processors.values());
  }

  /**
   * Check if a processor is registered
   */
  has(queueName: string): boolean {
    return this.processors.has(queueName);
  }

  /**
   * Clear all processors
   */
  clear(): void {
    this.processors.clear();
    logger.debug('All processors cleared from registry');
  }

  /**
   * Get queue names
   */
  getQueueNames(): string[] {
    return Array.from(this.processors.keys());
  }
}

export default ProcessorRegistry.getInstance();
