import { ID, PaginationParams, PaginatedResult, QueryOptions } from '../types';

export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: ID, options?: QueryOptions): Promise<T | null>;
  findOne(filter: Partial<T>, options?: QueryOptions): Promise<T | null>;
  findAll(filter?: Partial<T>, options?: QueryOptions): Promise<T[]>;
  findWithPagination(
    filter: Partial<T>,
    pagination: PaginationParams,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  exists(filter: Partial<T>): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
}
