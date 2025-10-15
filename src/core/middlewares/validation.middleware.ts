import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '@/common/utils';
import httpStatus from 'http-status';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validSchema = schema.keys({
      body: Joi.object().optional(),
      query: Joi.object().optional(),
      params: Joi.object().optional(),
    });

    const object = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    const { value, error } = validSchema.validate(object, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((details: Joi.ValidationErrorItem) => details.message)
        .join(', ');
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    Object.assign(req, value);
    return next();
  };
};
