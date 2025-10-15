import { createClient, RedisClientType } from 'redis';
import config from '@/config';
import logger from '@/common/utils/logger.util';

class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;

  private constructor() {}

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    if (!config.redis.enabled) {
      logger.info('Redis is disabled in configuration');
      return;
    }

    if (this.client?.isOpen) {
      logger.info('Redis client already connected');
      return;
    }

    if (this.isConnecting) {
      logger.info('Redis connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;

      const redisUrl = this.buildRedisUrl();

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: config.redis.connectTimeout,
          reconnectStrategy: (retries: number) => {
            if (retries > config.redis.maxRetries) {
              logger.error(
                `Redis max reconnection attempts (${config.redis.maxRetries}) exceeded`
              );
              return new Error('Max reconnection attempts exceeded');
            }

            // Exponential backoff with jitter
            const jitter = Math.floor(Math.random() * 100);
            const delay = Math.min(Math.pow(2, retries) * 50, 3000);
            logger.info(
              `Redis reconnecting in ${delay + jitter}ms (attempt ${retries})`
            );

            return delay + jitter;
          },
        },
      });

      // Event handlers
      this.client.on('error', (error: Error) => {
        logger.error('Redis client error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client connected and ready');
        this.reconnectAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        logger.info(
          `Redis client reconnecting (attempt ${this.reconnectAttempts})...`
        );
      });

      this.client.on('end', () => {
        logger.warn('Redis client disconnected');
      });

      await this.client.connect();

      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.client = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from Redis server
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.client = null;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      // Don't throw - graceful shutdown should continue even if Redis disconnect fails
      this.client = null;
    }
  }

  /**
   * Get the Redis client instance
   */
  getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.client?.isOpen ?? false;
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected()) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  }

  /**
   * Build Redis connection URL
   */
  private buildRedisUrl(): string {
    const protocol = config.redis.tls ? 'rediss' : 'redis';
    const auth = config.redis.password ? `:${config.redis.password}@` : '';
    const db = config.redis.db ? `/${config.redis.db}` : '';

    return `${protocol}://${auth}${config.redis.host}:${config.redis.port}${db}`;
  }
}

export default RedisClient.getInstance();
