import { ApiResponse } from '../types';

export class ResponseUtil {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      status: 'success',
      message,
      data,
    };
  }

  static error(message: string): ApiResponse {
    return {
      status: 'error',
      message,
    };
  }

  static paginated<T>(
    data: T[],
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  ): ApiResponse<T[]> {
    return {
      status: 'success',
      data,
      meta,
    };
  }
}
