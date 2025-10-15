export class CreateUserDto {
  name: string;
  email: string;

  constructor(data: { name: string; email: string }) {
    this.name = data.name;
    this.email = data.email;
  }
}

export class UpdateUserDto {
  name?: string;
  email?: string;

  constructor(data: { name?: string; email?: string }) {
    this.name = data.name;
    this.email = data.email;
  }
}

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
