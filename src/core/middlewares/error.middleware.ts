import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import logger from '@/common/utils/logger.util';
import { ApiError } from '@/common/utils';

export const errorConverter = (
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      (err as ApiError).statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message =
      err.message || String(httpStatus[statusCode as keyof typeof httpStatus]);
    error = new ApiError(statusCode, message, false);
  }

  next(error);
};

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  let { statusCode, message } = err;

  if (!err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = String(httpStatus[httpStatus.INTERNAL_SERVER_ERROR]);
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === 'development') {
    logger.error(err);
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = ApiError.notFound('Route not found');
  next(error);
};
