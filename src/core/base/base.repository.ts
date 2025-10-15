import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
} from 'mongoose';
import { IRepository } from '@/common/interfaces';
import {
  ID,
  PaginationParams,
  PaginatedResult,
  QueryOptions as CustomQueryOptions,
} from '@/common/types';
import { PaginationUtil } from '@/common/utils';
import {
  cacheService,
  CacheKeyPatterns,
  getTTL,
  hashObject,
} from '@/core/cache';
import config from '@/config';
import logger from '@/common/utils/logger.util';
import { trackDbOperation } from '@/core/observability';

export abstract class BaseRepository<T extends Document>
  implements IRepository<T>
{
  protected cacheEnabled = config.redis.enabled;
  protected entityName: string;

  constructor(
    protected readonly model: Model<T>,
    entityName?: string
  ) {
    this.entityName = entityName || model.modelName.toLowerCase();
  }

  async create(data: Partial<T>): Promise<T> {
    return trackDbOperation('insert', this.entityName, async () => {
      const document = await this.model.create(data);
      const result = document.toJSON() as T;

      // Invalidate query caches when creating new entity
      if (this.cacheEnabled) {
        const queryPattern = CacheKeyPatterns.entityQueryPattern(
          this.entityName
        );
        await cacheService.deletePattern(queryPattern);
      }

      return result;
    });
  }

  async findById(id: ID, options?: CustomQueryOptions): Promise<T | null> {
    return trackDbOperation('find', this.entityName, async () => {
      // Try cache first (Cache-Aside pattern)
      if (this.cacheEnabled && !options) {
        const cacheKey = CacheKeyPatterns.entity(this.entityName, String(id));
        const cached = await cacheService.get<T>(cacheKey);

        if (cached) {
          return cached;
        }
      }

      let query = this.model.findById(id);

      if (options?.select) {
        query = query.select(options.select.join(' '));
      }

      if (options?.populate) {
        query = query.populate(options.populate);
      }

      const document = await query.exec();
      const result = document ? (document.toJSON() as T) : null;

      // Cache the result
      if (this.cacheEnabled && result && !options) {
        const cacheKey = CacheKeyPatterns.entity(this.entityName, String(id));
        const ttl = getTTL(this.entityName);
        await cacheService.set(cacheKey, result, ttl);
      }

      return result;
    });
  }

  async findOne(
    filter: Partial<T>,
    options?: CustomQueryOptions
  ): Promise<T | null> {
    return trackDbOperation('find', this.entityName, async () => {
      let query = this.model.findOne(filter as FilterQuery<T>);

      if (options?.select) {
        query = query.select(options.select.join(' '));
      }

      if (options?.populate) {
        query = query.populate(options.populate);
      }

      const document = await query.exec();
      return document ? (document.toJSON() as T) : null;
    });
  }

  async findAll(
    filter: Partial<T> = {},
    options?: CustomQueryOptions
  ): Promise<T[]> {
    return trackDbOperation('find', this.entityName, async () => {
      let query = this.model.find(filter as FilterQuery<T>);

      if (options?.select) {
        query = query.select(options.select.join(' '));
      }

      if (options?.populate) {
        query = query.populate(options.populate);
      }

      if (options?.sort) {
        query = query.sort(options.sort);
      }

      const documents = await query.exec();
      return documents.map((doc) => doc.toJSON() as T);
    });
  }

  async findWithPagination(
    filter: Partial<T>,
    pagination: PaginationParams,
    options?: CustomQueryOptions
  ): Promise<PaginatedResult<T>> {
    return trackDbOperation('find', this.entityName, async () => {
      const validatedPagination = PaginationUtil.validateParams(pagination);

      // Try cache for paginated queries
      if (this.cacheEnabled && !options) {
        const queryHash = hashObject({
          filter,
          pagination: validatedPagination,
        });
        const cacheKey = CacheKeyPatterns.entityQuery(
          this.entityName,
          queryHash
        );
        const cached = await cacheService.get<PaginatedResult<T>>(cacheKey);

        if (cached) {
          return cached;
        }
      }

      const skip = PaginationUtil.calculateSkip(
        validatedPagination.page,
        validatedPagination.limit
      );

      let query = this.model.find(filter as FilterQuery<T>);

      if (options?.select) {
        query = query.select(options.select.join(' '));
      }

      if (options?.populate) {
        query = query.populate(options.populate);
      }

      // Apply sorting
      const sortField = validatedPagination.sortBy || 'createdAt';
      const sortOrder = validatedPagination.sortOrder === 'asc' ? 1 : -1;
      query = query.sort({ [sortField]: sortOrder });

      const [documents, total] = await Promise.all([
        query.skip(skip).limit(validatedPagination.limit).exec(),
        this.model.countDocuments(filter as FilterQuery<T>).exec(),
      ]);

      const data = documents.map((doc) => doc.toJSON() as T);
      const meta = PaginationUtil.calculateMeta(
        total,
        validatedPagination.page,
        validatedPagination.limit
      );

      const result = { data, meta };

      // Cache the result
      if (this.cacheEnabled && !options) {
        const queryHash = hashObject({
          filter,
          pagination: validatedPagination,
        });
        const cacheKey = CacheKeyPatterns.entityQuery(
          this.entityName,
          queryHash
        );
        const ttl = getTTL('query');
        await cacheService.set(cacheKey, result, ttl);
      }

      return result;
    });
  }

  async update(id: ID, data: Partial<T>): Promise<T | null> {
    return trackDbOperation('update', this.entityName, async () => {
      const document = await this.model
        .findByIdAndUpdate(
          id,
          data as UpdateQuery<T>,
          { new: true, runValidators: true } as QueryOptions
        )
        .exec();

      const result = document ? (document.toJSON() as T) : null;

      // Invalidate cache (Write-Through pattern)
      if (this.cacheEnabled && result) {
        await this.invalidateCache(String(id));
      }

      return result;
    });
  }

  async delete(id: ID): Promise<boolean> {
    return trackDbOperation('delete', this.entityName, async () => {
      const result = await this.model.findByIdAndDelete(id).exec();
      const success = result !== null;

      // Invalidate cache
      if (this.cacheEnabled && success) {
        await this.invalidateCache(String(id));
      }

      return success;
    });
  }

  /**
   * Invalidate cache for an entity
   */
  protected async invalidateCache(id: string): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      // Delete specific entity cache
      const entityKey = CacheKeyPatterns.entity(this.entityName, id);
      await cacheService.del(entityKey);

      // Delete all query caches for this entity
      const queryPattern = CacheKeyPatterns.entityQueryPattern(this.entityName);
      await cacheService.deletePattern(queryPattern);
    } catch (error) {
      // Log but don't throw - cache invalidation failure shouldn't break the app
      logger.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate all cache for this entity type
   */
  protected async invalidateAllCache(): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      const pattern = CacheKeyPatterns.entityPattern(this.entityName);
      await cacheService.deletePattern(pattern);
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  async exists(filter: Partial<T>): Promise<boolean> {
    const count = await this.model
      .countDocuments(filter as FilterQuery<T>)
      .exec();
    return count > 0;
  }

  async count(filter: Partial<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter as FilterQuery<T>).exec();
  }
}
