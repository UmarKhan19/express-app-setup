import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { IController, IService } from '@/common/interfaces';
import { ResponseUtil } from '@/common/utils';
import { PaginationParams } from '@/common/types';

export abstract class BaseController<T, CreateDTO, UpdateDTO>
  implements IController
{
  constructor(protected readonly service: IService<T, CreateDTO, UpdateDTO>) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as CreateDTO;
      const entity = await this.service.create(dto);
      res
        .status(httpStatus.CREATED)
        .json(ResponseUtil.success(entity, 'Resource created successfully'));
    } catch (error) {
      next(error);
    }
  };

  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const entities = await this.service.findAll();
      res.status(httpStatus.OK).json(ResponseUtil.success(entities));
    } catch (error) {
      next(error);
    }
  };

  findAllPaginated = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pagination: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await this.service.findWithPagination(pagination);
      res
        .status(httpStatus.OK)
        .json(ResponseUtil.paginated(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  };

  findById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const entity = await this.service.findById(id);
      res.status(httpStatus.OK).json(ResponseUtil.success(entity));
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateDTO;
      const entity = await this.service.update(id, dto);
      res
        .status(httpStatus.OK)
        .json(ResponseUtil.success(entity, 'Resource updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.status(httpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
}
