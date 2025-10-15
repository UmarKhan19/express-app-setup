import { ICacheService, CacheStats } from './cache.interface';
import redisClient from './cache';
import {
  serializeValue,
  deserializeValue,
  generateCacheKey,
} from './cache.util';
import config from '@/config';
import logger from '@/common/utils/logger.util';
import { trackCacheOperation } from '@/core/observability';

class CacheService implements ICacheService {
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Connect to cache
   */
  async connect(): Promise<void> {
    await redisClient.connect();
  }

  /**
   * Disconnect from cache
   */
  async disconnect(): Promise<void> {
    await redisClient.disconnect();
  }

  /**
   * Check if cache is connected
   */
  isConnected(): boolean {
    return redisClient.isConnected();
  }

  /**
   * Ping cache server
   */
  async ping(): Promise<boolean> {
    return await redisClient.ping();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!config.redis.enabled || !this.isConnected()) {
      return null;
    }

    const client = redisClient.getClient();
    if (!client) return null;

    const value = await client.get(key);
    const isHit = value !== null;

    return trackCacheOperation(
      'get',
      async () => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;
        return deserializeValue<T>(value);
      },
      isHit
    );
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!config.redis.enabled || !this.isConnected()) {
      return;
    }

    return trackCacheOperation('set', async () => {
      const client = redisClient.getClient();
      if (!client) return;

      const serialized = serializeValue(value);
      const ttlSeconds = ttl || config.cache.defaultTTL;

      await client.setEx(key, ttlSeconds, serialized);
    });
  }

  /**
   * Delete key(s) from cache
   */
  async del(key: string | string[]): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    return trackCacheOperation('del', async () => {
      const client = redisClient.getClient();
      if (!client) return 0;

      const keys = Array.isArray(key) ? key : [key];
      return await client.del(keys);
    });
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!config.redis.enabled || !this.isConnected()) {
      return false;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get multiple values
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    if (!config.redis.enabled || !this.isConnected()) {
      return keys.map(() => null);
    }

    try {
      const client = redisClient.getClient();
      if (!client) return keys.map(() => null);

      const values = await client.mGet(keys);

      return values.map((value: string | null) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        this.stats.hits++;
        return deserializeValue<T>(value);
      });
    } catch (error) {
      logger.error('Cache getMany error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async setMany(
    entries: Array<{ key: string; value: unknown; ttl?: number }>
  ): Promise<void> {
    if (!config.redis.enabled || !this.isConnected()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return;

      // Use pipeline for better performance
      const pipeline = client.multi();

      for (const entry of entries) {
        const serialized = serializeValue(entry.value);
        const ttlSeconds = entry.ttl || config.cache.defaultTTL;
        pipeline.setEx(entry.key, ttlSeconds, serialized);
      }

      await pipeline.exec();
    } catch (error) {
      logger.error('Cache setMany error:', error);
    }
  }

  /**
   * Get keys matching pattern
   * WARNING: Uses KEYS command which can block Redis in production with large datasets
   * Consider using SCAN for production environments
   */
  async keys(pattern: string): Promise<string[]> {
    if (!config.redis.enabled || !this.isConnected()) {
      return [];
    }

    try {
      const client = redisClient.getClient();
      if (!client) return [];

      // TODO: Consider implementing SCAN-based approach for production
      return await client.keys(pattern);
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;

      return await this.del(keys);
    } catch (error) {
      logger.error('Cache deletePattern error:', error);
      return 0;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return -1;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return -1;

      return await client.ttl(key);
    } catch (error) {
      logger.error('Cache ttl error:', error);
      return -1;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!config.redis.enabled || !this.isConnected()) {
      return false;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return false;

      return await client.expire(key, seconds);
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get hash field value
   */
  async hGet<T>(key: string, field: string): Promise<T | null> {
    if (!config.redis.enabled || !this.isConnected()) {
      return null;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return null;

      const value = await client.hGet(key, field);
      return deserializeValue<T>(value ?? null);
    } catch (error) {
      logger.error('Cache hGet error:', error);
      return null;
    }
  }

  /**
   * Set hash field value
   */
  async hSet(key: string, field: string, value: unknown): Promise<void> {
    if (!config.redis.enabled || !this.isConnected()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return;

      const serialized = serializeValue(value);
      await client.hSet(key, field, serialized);
    } catch (error) {
      logger.error('Cache hSet error:', error);
    }
  }

  /**
   * Get all hash fields
   */
  async hGetAll<T>(key: string): Promise<T | null> {
    if (!config.redis.enabled || !this.isConnected()) {
      return null;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return null;

      const value = await client.hGetAll(key);
      if (Object.keys(value).length === 0) return null;

      // Deserialize each field
      const deserialized: Record<string, unknown> = {};
      for (const [field, val] of Object.entries(value)) {
        deserialized[field] = deserializeValue(String(val));
      }

      return deserialized as T;
    } catch (error) {
      logger.error('Cache hGetAll error:', error);
      return null;
    }
  }

  /**
   * Delete hash fields
   */
  async hDel(key: string, ...fields: string[]): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return 0;

      return await client.hDel(key, fields);
    } catch (error) {
      logger.error('Cache hDel error:', error);
      return 0;
    }
  }

  /**
   * Push to list (left)
   */
  async lPush(key: string, ...values: unknown[]): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return 0;

      const serialized = values.map((v) => serializeValue(v));
      return await client.lPush(key, serialized);
    } catch (error) {
      logger.error('Cache lPush error:', error);
      return 0;
    }
  }

  /**
   * Push to list (right)
   */
  async rPush(key: string, ...values: unknown[]): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return 0;

      const serialized = values.map((v) => serializeValue(v));
      return await client.rPush(key, serialized);
    } catch (error) {
      logger.error('Cache rPush error:', error);
      return 0;
    }
  }

  /**
   * Get list range
   */
  async lRange<T>(key: string, start: number, stop: number): Promise<T[]> {
    if (!config.redis.enabled || !this.isConnected()) {
      return [];
    }

    try {
      const client = redisClient.getClient();
      if (!client) return [];

      const values = await client.lRange(key, start, stop);
      return values.map((v: string) => deserializeValue<T>(v)) as T[];
    } catch (error) {
      logger.error('Cache lRange error:', error);
      return [];
    }
  }

  /**
   * Get list length
   */
  async lLen(key: string): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return 0;

      return await client.lLen(key);
    } catch (error) {
      logger.error('Cache lLen error:', error);
      return 0;
    }
  }

  /**
   * Add to set
   */
  async sAdd(key: string, ...members: string[]): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return 0;

      return await client.sAdd(key, members);
    } catch (error) {
      logger.error('Cache sAdd error:', error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async sMembers<T>(key: string): Promise<T[]> {
    if (!config.redis.enabled || !this.isConnected()) {
      return [];
    }

    try {
      const client = redisClient.getClient();
      if (!client) return [];

      const members = await client.sMembers(key);
      return members.map((m: string) => deserializeValue<T>(m)) as T[];
    } catch (error) {
      logger.error('Cache sMembers error:', error);
      return [];
    }
  }

  /**
   * Check if member exists in set
   */
  async sIsMember(key: string, member: string): Promise<boolean> {
    if (!config.redis.enabled || !this.isConnected()) {
      return false;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return false;

      return await client.sIsMember(key, member);
    } catch (error) {
      logger.error('Cache sIsMember error:', error);
      return false;
    }
  }

  /**
   * Remove from set
   */
  async sRem(key: string, ...members: string[]): Promise<number> {
    if (!config.redis.enabled || !this.isConnected()) {
      return 0;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return 0;

      return await client.sRem(key, members);
    } catch (error) {
      logger.error('Cache sRem error:', error);
      return 0;
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    if (!config.redis.enabled || !this.isConnected()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return;

      await client.flushDb();
      logger.info('Cache flushed successfully');
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const hits = this.stats.hits;
    const misses = this.stats.misses;
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;
    const missRate = total > 0 ? misses / total : 0;

    let keys = 0;
    let memoryUsage: number | undefined;

    if (config.redis.enabled && this.isConnected()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const allKeys = await client.keys(`${config.cache.prefix}:*`);
          keys = allKeys.length;

          // Get memory info
          const info = await client.info('memory');
          const memoryMatch = info.match(/used_memory:(\d+)/);
          if (memoryMatch) {
            memoryUsage = parseInt(memoryMatch[1], 10);
          }
        }
      } catch (error) {
        logger.error('Error getting cache stats:', error);
      }
    }

    return {
      hits,
      misses,
      hitRate,
      missRate,
      keys,
      memoryUsage,
    };
  }

  /**
   * Generate cache key
   */
  generateKey(...parts: string[]): string {
    return generateCacheKey(...parts);
  }
}

export default new CacheService();
