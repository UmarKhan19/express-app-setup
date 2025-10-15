import { PaginationParams, PaginationMeta } from '../types';
import { DEFAULT_PAGINATION } from '../constants';

export class PaginationUtil {
  static validateParams(params: Partial<PaginationParams>): PaginationParams {
    const page = Math.max(1, params.page || DEFAULT_PAGINATION.PAGE);
    const limit = Math.min(
      Math.max(1, params.limit || DEFAULT_PAGINATION.LIMIT),
      DEFAULT_PAGINATION.MAX_LIMIT
    );

    return {
      page,
      limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'desc',
    };
  }

  static calculateMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
