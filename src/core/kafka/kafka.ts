import { Kafka, logLevel, LogEntry } from 'kafkajs';
import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * Kafka client singleton
 * Manages Kafka connection and provides client instance
 */
class KafkaClient {
  private static instance: KafkaClient;
  private kafka: Kafka | null = null;
  private isConnectedFlag = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KafkaClient {
    if (!KafkaClient.instance) {
      KafkaClient.instance = new KafkaClient();
    }
    return KafkaClient.instance;
  }

  /**
   * Initialize Kafka client
   */
  public initialize(): void {
    if (this.kafka) {
      logger.warn('Kafka client already initialized');
      return;
    }

    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      connectionTimeout: config.kafka.connectionTimeout,
      requestTimeout: config.kafka.requestTimeout,
      retry: {
        maxRetryTime: config.kafka.retry.maxRetryTime,
        initialRetryTime: config.kafka.retry.initialRetryTime,
        factor: config.kafka.retry.factor,
        multiplier: config.kafka.retry.multiplier,
        retries: config.kafka.retry.retries,
      },
      logLevel: this.getLogLevel(),
      logCreator: this.createLogger,
    });

    logger.info('Kafka client initialized', {
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
    });
  }

  /**
   * Get Kafka client instance
   */
  public getClient(): Kafka {
    if (!this.kafka) {
      this.initialize();
    }
    return this.kafka!;
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
   * Map application log level to Kafka log level
   */
  private getLogLevel(): logLevel {
    const level = config.logging.level.toLowerCase();

    switch (level) {
      case 'error':
        return logLevel.ERROR;
      case 'warn':
        return logLevel.WARN;
      case 'info':
        return logLevel.INFO;
      case 'debug':
        return logLevel.DEBUG;
      default:
        return logLevel.INFO;
    }
  }

  /**
   * Create custom logger for KafkaJS
   */
  private createLogger = () => {
    return ({ level, log }: LogEntry) => {
      const { message, ...extra } = log;

      switch (level) {
        case logLevel.ERROR:
          logger.error(`[Kafka] ${message}`, extra);
          break;
        case logLevel.WARN:
          logger.warn(`[Kafka] ${message}`, extra);
          break;
        case logLevel.INFO:
          logger.info(`[Kafka] ${message}`, extra);
          break;
        case logLevel.DEBUG:
          logger.debug(`[Kafka] ${message}`, extra);
          break;
        default:
          logger.info(`[Kafka] ${message}`, extra);
      }
    };
  };

  /**
   * Reset the client (for testing or reconnection)
   */
  public reset(): void {
    this.kafka = null;
    this.isConnectedFlag = false;
  }
}

export default KafkaClient.getInstance();
