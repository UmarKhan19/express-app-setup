import { Job } from 'bullmq';
import { IBaseProcessor } from './queue.interface';
import logger from '@/common/utils/logger.util';

/**
 * Base processor class for job processing
 * Extend this class to create custom job processors
 */
export abstract class BaseProcessor<T = unknown> implements IBaseProcessor<T> {
  protected readonly queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;
  }

  /**
   * Process job - must be implemented by child classes
   */
  abstract process(job: Job<T>): Promise<unknown>;

  /**
   * Handle job completion
   */
  public onCompleted(job: Job<T>, result: unknown): void {
    logger.info(`Job ${job.id} in queue ${this.queueName} completed`, {
      jobId: job.id,
      jobName: job.name,
      result,
    });
  }

  /**
   * Handle job failure
   */
  public onFailed(job: Job<T>, error: Error): void {
    logger.error(`Job ${job.id} in queue ${this.queueName} failed`, {
      jobId: job.id,
      jobName: job.name,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Handle job progress
   */
  public onProgress(job: Job<T>, progress: number | object): void {
    logger.debug(`Job ${job.id} in queue ${this.queueName} progress`, {
      jobId: job.id,
      jobName: job.name,
      progress,
    });
  }

  /**
   * Handle job active
   */
  public onActive(job: Job<T>): void {
    logger.debug(`Job ${job.id} in queue ${this.queueName} started`, {
      jobId: job.id,
      jobName: job.name,
    });
  }

  /**
   * Get queue name
   */
  public getQueueName(): string {
    return this.queueName;
  }
}
