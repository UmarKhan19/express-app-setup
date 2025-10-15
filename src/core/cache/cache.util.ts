import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * Generate a cache key with proper formatting
 */
export const generateCacheKey = (...parts: string[]): string => {
  const sanitizedParts = parts
    .filter((part) => part !== null && part !== undefined && part !== '')
    .map((part) => String(part).replace(/[:\s]/g, '_'));

  return `${config.cache.prefix}:${sanitizedParts.join(':')}`;
};

/**
 * Serialize data for caching
 */
export const serializeValue = (value: unknown): string => {
  return JSON.stringify(value);
};

/**
 * Deserialize cached data
 */
export const deserializeValue = <T>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    // If parsing fails, log warning and return null (safer than returning raw value)
    logger.warn('Failed to deserialize cached value:', error);
    return null;
  }
};

/**
 * Get TTL based on entity type
 */
export const getTTL = (entityType?: string): number => {
  if (!entityType) {
    return config.cache.defaultTTL;
  }

  const ttlStrategies = config.cache.ttlStrategies as Record<string, number>;
  return ttlStrategies[entityType] || config.cache.defaultTTL;
};

/**
 * Create cache key patterns for different scenarios
 */
export const CacheKeyPatterns = {
  // Entity patterns
  entity: (entityName: string, id: string) => generateCacheKey(entityName, id),

  entityByField: (entityName: string, field: string, value: string) =>
    generateCacheKey(entityName, field, value),

  entityAll: (entityName: string) => generateCacheKey(entityName, 'all'),

  entityQuery: (entityName: string, queryHash: string) =>
    generateCacheKey(entityName, 'query', queryHash),

  // Pattern for deletion
  entityPattern: (entityName: string) => generateCacheKey(entityName, '*'),

  entityQueryPattern: (entityName: string) =>
    generateCacheKey(entityName, 'query', '*'),
};

/**
 * Create a simple hash from an object (for query caching)
 */
export const hashObject = (obj: Record<string, unknown>): string => {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};
