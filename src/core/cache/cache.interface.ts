/**
 * Cache Statistics Interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  keys: number;
  memoryUsage?: number;
}

/**
 * Cache Service Interface
 * Provides abstraction for caching operations
 */
export interface ICacheService {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  ping(): Promise<boolean>;

  // Basic operations
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  del(key: string | string[]): Promise<number>;
  exists(key: string): Promise<boolean>;

  // Multiple operations
  getMany<T>(keys: string[]): Promise<(T | null)[]>;
  setMany(
    entries: Array<{ key: string; value: unknown; ttl?: number }>
  ): Promise<void>;

  // Pattern operations
  keys(pattern: string): Promise<string[]>;
  deletePattern(pattern: string): Promise<number>;

  // TTL operations
  ttl(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;

  // Hash operations (for structured data)
  hGet<T>(key: string, field: string): Promise<T | null>;
  hSet(key: string, field: string, value: unknown): Promise<void>;
  hGetAll<T>(key: string): Promise<T | null>;
  hDel(key: string, ...fields: string[]): Promise<number>;

  // List operations (for collections)
  lPush(key: string, ...values: unknown[]): Promise<number>;
  rPush(key: string, ...values: unknown[]): Promise<number>;
  lRange<T>(key: string, start: number, stop: number): Promise<T[]>;
  lLen(key: string): Promise<number>;

  // Set operations (for unique collections)
  sAdd(key: string, ...members: string[]): Promise<number>;
  sMembers<T>(key: string): Promise<T[]>;
  sIsMember(key: string, member: string): Promise<boolean>;
  sRem(key: string, ...members: string[]): Promise<number>;

  // Cache management
  flush(): Promise<void>;
  getStats(): Promise<CacheStats>;

  // Utility
  generateKey(...parts: string[]): string;
}
