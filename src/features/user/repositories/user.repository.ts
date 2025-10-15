import { BaseRepository } from '@/core/base';
import { UserModel, IUserDocument } from '../models';
import { cacheService, CacheKeyPatterns, getTTL } from '@/core/cache';

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(UserModel, 'user');
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    // Try cache first
    if (this.cacheEnabled) {
      const cacheKey = CacheKeyPatterns.entityByField('user', 'email', email);
      const cached = await cacheService.get<IUserDocument>(cacheKey);
      if (cached) return cached;
    }

    const user = await this.findOne({ email } as Partial<IUserDocument>);

    // Cache the result
    if (this.cacheEnabled && user) {
      const cacheKey = CacheKeyPatterns.entityByField('user', 'email', email);
      const ttl = getTTL('user');
      await cacheService.set(cacheKey, user, ttl);
    }

    return user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return await this.exists({ email } as Partial<IUserDocument>);
  }

  /**
   * Override update to handle email cache invalidation properly
   */
  async update(
    id: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument | null> {
    // Get the old user to invalidate email cache
    const oldUser = await this.findById(id);

    // Update the user
    const result = await super.update(id, data);

    // Invalidate old email cache if user existed
    if (this.cacheEnabled && oldUser) {
      const oldEmailKey = CacheKeyPatterns.entityByField(
        'user',
        'email',
        oldUser.email
      );
      await cacheService.del(oldEmailKey);

      // If email changed, invalidate new email cache too
      if (data.email && data.email !== oldUser.email) {
        const newEmailKey = CacheKeyPatterns.entityByField(
          'user',
          'email',
          data.email
        );
        await cacheService.del(newEmailKey);
      }
    }

    return result;
  }

  /**
   * Override delete to handle email cache invalidation properly
   */
  async delete(id: string): Promise<boolean> {
    // Get the user to invalidate email cache
    const user = await this.findById(id);

    // Delete the user
    const result = await super.delete(id);

    // Invalidate email cache if user existed
    if (this.cacheEnabled && user) {
      const emailKey = CacheKeyPatterns.entityByField(
        'user',
        'email',
        user.email
      );
      await cacheService.del(emailKey);
    }

    return result;
  }
}
