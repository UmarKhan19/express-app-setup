import { BaseController } from '@/core/base';
import { UserService } from '../services';
import { CreateUserDto, UpdateUserDto } from '../dtos';
import { IUserDocument } from '../models';

export class UserController extends BaseController<
  IUserDocument,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(userService: UserService) {
    super(userService);
  }
}
