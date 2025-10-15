import { Server } from 'http';
import createApp from './app';
import config from '@/config';
import { database } from '@/core/database';
import { cacheService } from '@/core/cache';
import { queueService, initializeQueues } from '@/core/queue';
import { emailService } from '@/core/email';
import {
  kafkaService,
  initializeKafkaConsumers,
  shutdownKafkaConsumers,
} from '@/core/kafka';
import logger from '@/common/utils/logger.util';
import { metricsService } from '@/core/observability';

let server: Server;
let metricsUpdateInterval: NodeJS.Timeout | null = null;

// Update queue metrics periodically
const updateQueueMetrics = async () => {
  if (!config.queue.enabled || !queueService.isConnected()) {
    return;
  }

  try {
    const queues = queueService.getQueues();
    for (const queue of queues) {
      const queueName = queue.name;
      const stats = await queueService.getQueueStats(queueName);

      // Update active jobs gauge
      metricsService.queueJobsActive.set({ queue: queueName }, stats.active);
    }
  } catch (error) {
    logger.error('Error updating queue metrics:', error);
  }
};

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await database.connect();

    // Connect to Redis (optional - graceful degradation)
    if (config.redis.enabled) {
      try {
        await cacheService.connect();
        logger.info('Cache service initialized');
      } catch (error) {
        logger.warn(
          'Cache service connection failed, continuing without cache:',
          error
        );
      }
    }

    // Initialize email service
    try {
      emailService.initialize();
      logger.info('Email service initialized');
    } catch (error) {
      logger.warn('Email service initialization failed:', error);
    }

    // Connect to Queue service (optional - graceful degradation)
    if (config.queue.enabled) {
      try {
        await queueService.connect();
        initializeQueues();
        logger.info('Queue service initialized with processors');
      } catch (error) {
        logger.warn(
          'Queue service connection failed, continuing without queues:',
          error
        );
      }
    }

    // Connect to Kafka (optional - graceful degradation)
    if (config.kafka.enabled) {
      try {
        await kafkaService.connect();
        await initializeKafkaConsumers();
        logger.info('Kafka service initialized with consumers');
      } catch (error) {
        logger.warn(
          'Kafka service connection failed, continuing without Kafka:',
          error
        );
      }
    }

    // Create Express app
    const app = createApp();

    // Start periodic metrics update
    if (config.queue.enabled) {
      metricsUpdateInterval = setInterval(updateQueueMetrics, 10000); // Update every 10 seconds
      logger.info('Queue metrics updater started');
    }

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Version: ${config.apiVersion}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Stop metrics update interval
        if (metricsUpdateInterval) {
          clearInterval(metricsUpdateInterval);
          logger.info('Queue metrics updater stopped');
        }

        try {
          // Disconnect from Kafka
          if (config.kafka.enabled && kafkaService.isConnected()) {
            await shutdownKafkaConsumers();
            await kafkaService.disconnect();
            logger.info('Kafka service disconnected');
          }

          // Disconnect from queue service
          if (config.queue.enabled && queueService.isConnected()) {
            await queueService.disconnect();
            logger.info('Queue service disconnected');
          }

          // Disconnect from cache
          if (config.redis.enabled && cacheService.isConnected()) {
            await cacheService.disconnect();
            logger.info('Cache disconnected');
          }

          // Disconnect from database
          await database.disconnect();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error(
          'Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
      throw reason;
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
