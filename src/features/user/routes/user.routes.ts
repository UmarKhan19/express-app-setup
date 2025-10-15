import { Router } from 'express';
import { UserController } from '../controllers';
import { UserService } from '../services';
import { UserRepository } from '../repositories';
import { validate } from '@/core/middlewares';
import {
  createUserSchema,
  getUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from '../schemas';

// Initialize dependencies
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = Router();

router
  .route('/')
  .post(validate(createUserSchema), userController.create)
  .get(userController.findAll);

router
  .route('/:id')
  .get(validate(getUserSchema), userController.findById)
  .patch(validate(updateUserSchema), userController.update)
  .delete(validate(deleteUserSchema), userController.delete);

export default router;
