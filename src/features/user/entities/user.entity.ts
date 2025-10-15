import { IBaseEntity } from '@/common/interfaces';

/**
 * User entity interface
 * Represents the domain model for a User
 */
export interface IUser extends IBaseEntity {
  name: string;
  email: string;
}
