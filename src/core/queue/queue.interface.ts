import { Job, JobsOptions, Queue, Worker } from 'bullmq';

/**
 * Queue configuration options
 */
export interface QueueConfig {
  name: string;
  defaultJobOptions?: JobsOptions;
  workerConcurrency?: number;
}

/**
 * Job data with type safety
 */
export interface IJobData {
  [key: string]: unknown;
}

/**
 * Job processor function
 */
export type JobProcessor<T = IJobData> = (
  job: Job<T>
) => Promise<unknown> | unknown;

/**
 * Queue service interface
 */
export interface IQueueService {
  /**
   * Connect to queue system
   */
  connect(): Promise<void>;

  /**
   * Disconnect from queue system
   */
  disconnect(): Promise<void>;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Get a queue by name
   */
  getQueue(name: string): Queue | undefined;

  /**
   * Get a worker by name
   */
  getWorker(name: string): Worker | undefined;

  /**
   * Add a job to a queue
   */
  addJob<T = IJobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>>;

  /**
   * Register a job processor
   */
  registerProcessor<T = IJobData>(
    queueName: string,
    processor: JobProcessor<T>,
    options?: { concurrency?: number }
  ): void;

  /**
   * Get queue statistics
   */
  getQueueStats(queueName: string): Promise<QueueStats>;

  /**
   * Pause a queue
   */
  pauseQueue(queueName: string): Promise<void>;

  /**
   * Resume a queue
   */
  resumeQueue(queueName: string): Promise<void>;

  /**
   * Clean old jobs from queue
   */
  cleanQueue(
    queueName: string,
    grace: number,
    limit?: number,
    type?: 'completed' | 'failed'
  ): Promise<string[]>;

  /**
   * Get all queues
   */
  getQueues(): Queue[];
}

/**
 * Queue statistics
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

/**
 * Base processor interface
 */
export interface IBaseProcessor<T = IJobData> {
  /**
   * Process a job
   */
  process(job: Job<T>): Promise<unknown>;

  /**
   * Handle job completion
   */
  onCompleted?(job: Job<T>, result: unknown): void;

  /**
   * Handle job failure
   */
  onFailed?(job: Job<T>, error: Error): void;

  /**
   * Handle job progress
   */
  onProgress?(job: Job<T>, progress: number | object): void;
}
