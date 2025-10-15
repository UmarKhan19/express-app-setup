import httpStatus from 'http-status';

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(httpStatus.BAD_REQUEST, message);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(httpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(httpStatus.FORBIDDEN, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(httpStatus.NOT_FOUND, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(httpStatus.CONFLICT, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(httpStatus.INTERNAL_SERVER_ERROR, message, false);
  }
}
