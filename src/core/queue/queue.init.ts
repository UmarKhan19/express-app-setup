import queueService from './queue.service';
import processorRegistry from './queue.registry';
import { EmailProcessor, NotificationProcessor } from './processors';
import logger from '@/common/utils/logger.util';
import config from '@/config';

/**
 * Register all available processors
 * Add new processors here to make them available
 */
export const registerProcessors = (): void => {
  // Register email processor
  processorRegistry.register({
    queueName: 'email',
    processor: new EmailProcessor(),
    concurrency: 5,
    enabled: true,
  });

  // Register notification processor
  processorRegistry.register({
    queueName: 'notification',
    processor: new NotificationProcessor(),
    concurrency: 10,
    enabled: true,
  });

  // Add more processors here as needed
  // processorRegistry.register({
  //   queueName: 'image-processing',
  //   processor: new ImageProcessor(),
  //   concurrency: 3,
  //   enabled: true,
  // });

  logger.info(
    `Registered ${processorRegistry.getAll().length} queue processors`
  );
};

/**
 * Initialize and start all registered queue processors
 */
export const initializeQueues = (): void => {
  if (!config.queue.enabled) {
    logger.info('Queue system is disabled, skipping processor initialization');
    return;
  }

  try {
    // Register all processors first
    registerProcessors();

    // Get all registered processors
    const processors = processorRegistry.getAll();

    if (processors.length === 0) {
      logger.warn('No processors registered');
      return;
    }

    // Initialize each processor
    for (const config of processors) {
      const { queueName, processor, concurrency } = config;

      queueService.registerProcessor(
        queueName,
        processor.process.bind(processor),
        {
          concurrency,
          onCompleted: processor.onCompleted?.bind(processor),
          onFailed: processor.onFailed?.bind(processor),
          onProgress: processor.onProgress?.bind(processor),
          onActive: processor.onActive?.bind(processor),
        }
      );

      logger.info(`Processor initialized for queue: ${queueName}`);
    }

    logger.info('All queue processors initialized successfully');
  } catch (error) {
    logger.error('Error initializing queue processors:', error);
    throw error;
  }
};
