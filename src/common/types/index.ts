export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type ID = string;

export type AsyncFunction<T = void> = () => Promise<T>;

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResponse<T = any> = {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  meta?: PaginationMeta;
};

export type QueryOptions = {
  select?: string[];
  populate?: string | string[];
  sort?: Record<string, 1 | -1>;
  lean?: boolean;
};
