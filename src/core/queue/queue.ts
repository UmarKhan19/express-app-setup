import { Queue, Worker, ConnectionOptions } from 'bullmq';
import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * Queue connection manager singleton
 * Manages Redis connection for BullMQ queues and workers
 */
class QueueConnection {
  private static instance: QueueConnection;
  private connection: ConnectionOptions;
  private isConnectedFlag = false;
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();

  private constructor() {
    this.connection = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.queue.db,
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false, // Required for BullMQ
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 1000, 10000);
        logger.warn(
          `Queue connection retry attempt ${times}, delay: ${delay}ms`
        );
        return delay;
      },
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): QueueConnection {
    if (!QueueConnection.instance) {
      QueueConnection.instance = new QueueConnection();
    }
    return QueueConnection.instance;
  }

  /**
   * Get connection configuration
   */
  public getConnection(): ConnectionOptions {
    return this.connection;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.isConnectedFlag;
  }

  /**
   * Set connected status
   */
  public setConnected(status: boolean): void {
    this.isConnectedFlag = status;
  }

  /**
   * Register a queue
   */
  public registerQueue(name: string, queue: Queue): void {
    this.queues.set(name, queue);
  }

  /**
   * Register a worker
   */
  public registerWorker(name: string, worker: Worker): void {
    this.workers.set(name, worker);
  }

  /**
   * Get a queue by name
   */
  public getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Get a worker by name
   */
  public getWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }

  /**
   * Get all queues
   */
  public getQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get all workers
   */
  public getWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  /**
   * Close all queues and workers
   */
  public async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    // Close all workers first
    for (const [name, worker] of this.workers) {
      logger.info(`Closing worker: ${name}`);
      closePromises.push(
        worker.close().catch((error) => {
          logger.error(`Error closing worker ${name}:`, error);
        })
      );
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      logger.info(`Closing queue: ${name}`);
      closePromises.push(
        queue.close().catch((error) => {
          logger.error(`Error closing queue ${name}:`, error);
        })
      );
    }

    await Promise.all(closePromises);

    this.queues.clear();
    this.workers.clear();
    this.isConnectedFlag = false;
  }
}

export default QueueConnection.getInstance();
