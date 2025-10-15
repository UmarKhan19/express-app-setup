import { BaseService } from '@/core/base';
import { UserRepository } from '../repositories';
import { CreateUserDto, UpdateUserDto } from '../dtos';
import { IUserDocument } from '../models';
import { ApiError } from '@/common/utils';
import { queueService } from '@/core/queue';
import { EmailJobData } from '@/core/queue/processors';
import { publishUserEvent, publishAuditLog } from '../helpers';
import config from '@/config';
import logger from '@/common/utils/logger.util';
import httpStatus from 'http-status';

export class UserService extends BaseService<
  IUserDocument,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  async create(dto: CreateUserDto): Promise<IUserDocument> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.existsByEmail(dto.email);
    if (existingUser) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already registered');
    }

    const user = await this.repository.create(dto);

    // Publish user.created event to Kafka
    await publishUserEvent('user.created', user.id, {
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString(),
    });

    // Publish audit log event
    await publishAuditLog(
      'create',
      'user',
      user.id,
      user.id,
      dto as unknown as Record<string, unknown>
    );

    // Queue welcome email (async, non-blocking)
    if (config.queue.enabled && queueService.isConnected()) {
      try {
        const emailData: EmailJobData = {
          to: user.email,
          subject: 'Welcome to Our Platform!',
          body: `Hello ${user.name},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team`,
          from: 'noreply@example.com',
        };

        await queueService.addJob('email', 'welcome-email', emailData, {
          priority: 1,
        });

        logger.info('Welcome email queued for user', { userId: user.id });
      } catch (error) {
        logger.error('Failed to queue welcome email', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't fail user creation if email queueing fails
      }
    } else if (config.queue.enabled && !queueService.isConnected()) {
      logger.warn('Queue system not connected, skipping welcome email', {
        userId: user.id,
      });
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<IUserDocument> {
    // If email is being updated, check if it's already taken
    if (dto.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ApiError(httpStatus.CONFLICT, 'Email already taken');
      }
    }

    const user = await this.repository.update(id, dto);
    if (!user) {
      throw ApiError.notFound(`User with id ${id} not found`);
    }

    // Publish user.updated event to Kafka
    await publishUserEvent('user.updated', user.id, {
      userId: user.id,
      email: dto.email,
      name: dto.name,
      updatedAt: new Date().toISOString(),
    });

    // Publish audit log event
    await publishAuditLog(
      'update',
      'user',
      user.id,
      user.id,
      dto as unknown as Record<string, unknown>
    );

    return user;
  }

  async delete(id: string): Promise<void> {
    // Check if user exists before deleting
    const user = await this.repository.findById(id);
    if (!user) {
      throw ApiError.notFound(`User with id ${id} not found`);
    }

    // Delete the user
    await this.repository.delete(id);

    // Publish user.deleted event to Kafka
    await publishUserEvent('user.deleted', id, {
      userId: id,
      deletedAt: new Date().toISOString(),
    });

    // Publish audit log event
    await publishAuditLog('delete', 'user', id, id);
  }

  async findByEmail(email: string): Promise<IUserDocument> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}
