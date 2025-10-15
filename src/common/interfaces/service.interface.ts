import { ID, PaginationParams, PaginatedResult } from '../types';

export interface IService<T, CreateDTO, UpdateDTO> {
  create(dto: CreateDTO): Promise<T>;
  findById(id: ID): Promise<T>;
  findAll(): Promise<T[]>;
  findWithPagination(pagination: PaginationParams): Promise<PaginatedResult<T>>;
  update(id: ID, dto: UpdateDTO): Promise<T>;
  delete(id: ID): Promise<void>;
}
