import { Queue, Worker, Job, JobsOptions } from 'bullmq';
import queueConnection from './queue';
import {
  IQueueService,
  JobProcessor,
  QueueStats,
  IJobData,
} from './queue.interface';
import config from '@/config';
import logger from '@/common/utils/logger.util';
import { trackQueueJob } from '@/core/observability';

/**
 * Queue service implementation
 * Manages queues and workers for job processing
 */
class QueueService implements IQueueService {
  private connection = queueConnection.getConnection();

  /**
   * Connect to queue system
   */
  async connect(): Promise<void> {
    if (!config.queue.enabled) {
      logger.info('Queue system is disabled');
      return;
    }

    try {
      // Test connection by creating a temporary queue
      const testQueue = new Queue('test', { connection: this.connection });
      const client = await testQueue.client;
      await client.ping();
      await testQueue.close();

      queueConnection.setConnected(true);
      logger.info('Queue system connected successfully');
    } catch (error) {
      logger.error('Failed to connect to queue system:', error);
      throw error;
    }
  }

  /**
   * Disconnect from queue system
   */
  async disconnect(): Promise<void> {
    if (!config.queue.enabled || !queueConnection.isConnected()) {
      return;
    }

    try {
      await queueConnection.closeAll();
      logger.info('Queue system disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from queue system:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return queueConnection.isConnected();
  }

  /**
   * Create or get a queue
   */
  private createQueue(name: string): Queue {
    let queue = queueConnection.getQueue(name);

    if (!queue) {
      queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: config.queue.defaultJobOptions,
      });

      // Register queue events (only once)
      queue.on('error', (error) => {
        logger.error(`Queue ${name} error:`, error);
      });

      queue.on('waiting', (job) => {
        logger.debug(`Job ${job.id} is waiting in queue ${name}`);
      });

      queueConnection.registerQueue(name, queue);
      logger.info(`Queue ${name} created`);
    }

    return queue;
  }

  /**
   * Get a queue by name
   */
  getQueue(name: string): Queue | undefined {
    return queueConnection.getQueue(name);
  }

  /**
   * Get a worker by name
   */
  getWorker(name: string): Worker | undefined {
    return queueConnection.getWorker(name);
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = IJobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    if (!config.queue.enabled) {
      logger.warn('Queue system is disabled, job not added');
      throw new Error('Queue system is disabled');
    }

    if (!queueConnection.isConnected()) {
      logger.warn('Queue system is not connected, job not added');
      throw new Error('Queue system is not connected');
    }

    const queue = this.createQueue(queueName);
    const job = await queue.add(jobName, data, options);

    logger.info(`Job ${jobName} added to queue ${queueName}`, {
      jobId: job.id,
      queueName,
      jobName,
    });

    return job as Job<T>;
  }

  /**
   * Register a job processor
   */
  registerProcessor<T = IJobData>(
    queueName: string,
    processor: JobProcessor<T>,
    options?: {
      concurrency?: number;
      onCompleted?: (job: Job<T>, result: unknown) => void;
      onFailed?: (job: Job<T>, error: Error) => void;
      onProgress?: (job: Job<T>, progress: number | object) => void;
      onActive?: (job: Job<T>) => void;
    }
  ): void {
    if (!config.queue.enabled) {
      logger.info(
        `Queue system is disabled, processor for ${queueName} not registered`
      );
      return;
    }

    // Check if worker already registered
    if (queueConnection.getWorker(queueName)) {
      logger.warn(`Worker for queue ${queueName} is already registered`);
      return;
    }

    // Ensure queue exists
    this.createQueue(queueName);

    const concurrency = options?.concurrency || config.queue.workerConcurrency;

    const worker = new Worker(
      queueName,
      async (job: Job<T>) => {
        return await trackQueueJob(queueName, job.name, async () => {
          return await processor(job);
        });
      },
      {
        connection: this.connection,
        concurrency,
      }
    );

    // Register worker events
    worker.on('completed', (job, result) => {
      logger.info(`Job ${job.id} in queue ${queueName} completed`, {
        jobId: job.id,
        jobName: job.name,
        result,
      });

      // Call custom completion handler if provided
      if (options?.onCompleted) {
        try {
          options.onCompleted(job as Job<T>, result);
        } catch (error) {
          logger.error(
            `Error in onCompleted hook for queue ${queueName}:`,
            error
          );
        }
      }
    });

    worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} in queue ${queueName} failed`, {
        jobId: job?.id,
        jobName: job?.name,
        error: error.message,
      });

      // Call custom failure handler if provided
      if (options?.onFailed && job) {
        try {
          options.onFailed(job as Job<T>, error);
        } catch (err) {
          logger.error(`Error in onFailed hook for queue ${queueName}:`, err);
        }
      }
    });

    worker.on('error', (error) => {
      logger.error(`Worker for queue ${queueName} error:`, error);
    });

    worker.on('active', (job) => {
      logger.debug(`Job ${job.id} in queue ${queueName} started processing`);

      // Call custom active handler if provided
      if (options?.onActive) {
        try {
          options.onActive(job as Job<T>);
        } catch (error) {
          logger.error(`Error in onActive hook for queue ${queueName}:`, error);
        }
      }
    });

    worker.on('progress', (job, progress) => {
      // Call custom progress handler if provided
      if (options?.onProgress) {
        try {
          // Convert progress to number or object
          const progressValue =
            typeof progress === 'string' ? JSON.parse(progress) : progress;
          options.onProgress(job as Job<T>, progressValue);
        } catch (error) {
          logger.error(
            `Error in onProgress hook for queue ${queueName}:`,
            error
          );
        }
      }
    });

    queueConnection.registerWorker(queueName, worker);
    logger.info(
      `Worker registered for queue ${queueName} with concurrency ${concurrency}`
    );
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<QueueStats> {
    if (!queueConnection.isConnected()) {
      throw new Error('Queue system is not connected');
    }

    const queue = queueConnection.getQueue(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed, isPaused] =
      await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused,
    };
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    if (!queueConnection.isConnected()) {
      throw new Error('Queue system is not connected');
    }

    const queue = queueConnection.getQueue(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    if (!queueConnection.isConnected()) {
      throw new Error('Queue system is not connected');
    }

    const queue = queueConnection.getQueue(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number,
    limit?: number,
    type: 'completed' | 'failed' = 'completed'
  ): Promise<string[]> {
    if (!queueConnection.isConnected()) {
      throw new Error('Queue system is not connected');
    }

    const queue = queueConnection.getQueue(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobs = await queue.clean(grace, limit || 0, type);
    logger.info(`Cleaned ${jobs.length} ${type} jobs from queue ${queueName}`);

    return jobs;
  }

  /**
   * Get all queues
   */
  getQueues(): Queue[] {
    return queueConnection.getQueues();
  }
}

export default new QueueService();
