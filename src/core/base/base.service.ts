import { IService } from '@/common/interfaces';
import { IRepository } from '@/common/interfaces';
import { ID, PaginationParams, PaginatedResult } from '@/common/types';
import { ApiError } from '@/common/utils';

export abstract class BaseService<T, CreateDTO, UpdateDTO>
  implements IService<T, CreateDTO, UpdateDTO>
{
  constructor(protected readonly repository: IRepository<T>) {}

  async create(dto: CreateDTO): Promise<T> {
    return await this.repository.create(dto as Partial<T>);
  }

  async findById(id: ID): Promise<T> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw ApiError.notFound(`Resource with id ${id} not found`);
    }
    return entity;
  }

  async findAll(): Promise<T[]> {
    return await this.repository.findAll();
  }

  async findWithPagination(
    pagination: PaginationParams
  ): Promise<PaginatedResult<T>> {
    return await this.repository.findWithPagination({}, pagination);
  }

  async update(id: ID, dto: UpdateDTO): Promise<T> {
    const entity = await this.repository.update(id, dto as Partial<T>);
    if (!entity) {
      throw ApiError.notFound(`Resource with id ${id} not found`);
    }
    return entity;
  }

  async delete(id: ID): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw ApiError.notFound(`Resource with id ${id} not found`);
    }
  }
}
