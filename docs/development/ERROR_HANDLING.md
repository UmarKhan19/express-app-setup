# Error Handling

> **Consistent error handling across the application**

This guide covers error handling patterns, custom errors, and best practices.

## 📚 Table of Contents

- [Overview](#overview)
- [ApiError Class](#apierror-class)
- [Error Middleware](#error-middleware)
- [Common Error Patterns](#common-error-patterns)
- [HTTP Status Codes](#http-status-codes)
- [Validation Errors](#validation-errors)
- [Best Practices](#best-practices)

## Overview

The application uses a centralized error handling approach:

```
┌─────────────────────────────────────────────────────┐
│              Application Code                        │
│  throw new ApiError(404, 'User not found')          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│           Error Middleware                           │
│  - Catches all errors                                │
│  - Formats response                                  │
│  - Logs error                                        │
│  - Sends response                                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              Client                                  │
│  Receives consistent error format                    │
└─────────────────────────────────────────────────────┘
```

## ApiError Class

### Definition

File: `src/common/utils/error.util.ts`

```typescript
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: any[]
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: any[]): ApiError {
    return new ApiError(400, message, true, errors);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false);
  }
}
```

### Usage

```typescript
// Basic usage
throw new ApiError(404, 'User not found');

// Using static methods
throw ApiError.notFound('User not found');
throw ApiError.badRequest('Invalid email format');
throw ApiError.unauthorized('Invalid credentials');

// With validation errors
throw ApiError.badRequest('Validation failed', [
  { field: 'email', message: 'Email is required' },
  { field: 'password', message: 'Password must be at least 8 characters' },
]);
```

## Error Middleware

### Implementation

File: `src/core/middlewares/error.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/common/utils/error.util';
import { logger } from '@/common/utils/logger.util';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = undefined;

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;

    // Log operational errors as warnings
    if (err.isOperational) {
      logger.warn('API Error', {
        statusCode,
        message,
        path: req.path,
        method: req.method,
      });
    } else {
      // Log non-operational errors as errors
      logger.error('API Error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));

    logger.warn('Validation Error', { errors });
  }
  // Handle Mongoose cast errors
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';

    logger.warn('Cast Error', { error: err.message });
  }
  // Handle duplicate key errors
  else if ((err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyPattern)[0];
    message = `${field} already exists`;

    logger.warn('Duplicate Key Error', { field });
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';

    logger.warn('JWT Error', { error: err.message });
  }
  // Handle JWT expiration
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';

    logger.warn('Token Expired');
  }
  // Handle unexpected errors
  else {
    logger.error('Unexpected Error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

// Async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Registration

```typescript
// src/app.ts
import { errorHandler } from '@/core/middlewares/error.middleware';

// ... other middleware

// Error handler must be last
app.use(errorHandler);
```

## Common Error Patterns

### 1. Not Found

```typescript
async getById(id: string): Promise<IUser> {
  const user = await this.repository.findById(id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}
```

### 2. Validation

```typescript
async create(dto: CreateUserDto): Promise<IUser> {
  // Check if email exists
  const existing = await this.repository.findByEmail(dto.email);
  if (existing) {
    throw ApiError.conflict('Email already exists');
  }

  // Validate age
  if (dto.age < 18) {
    throw ApiError.badRequest('User must be at least 18 years old');
  }

  return await this.repository.create(dto);
}
```

### 3. Authorization

```typescript
async deleteUser(id: string, requestingUserId: string): Promise<void> {
  const user = await this.repository.findById(id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Check ownership
  if (user.id !== requestingUserId && !isAdmin(requestingUserId)) {
    throw ApiError.forbidden('You cannot delete this user');
  }

  await this.repository.delete(id);
}
```

### 4. External Service Errors

```typescript
async sendEmail(to: string, subject: string, body: string): Promise<void> {
  try {
    await this.emailProvider.send({ to, subject, body });
  } catch (error) {
    logger.error('Email sending failed', {
      error: error.message,
      to,
      subject,
    });

    throw ApiError.internal('Failed to send email');
  }
}
```

### 5. Database Errors

```typescript
async createUser(dto: CreateUserDto): Promise<IUser> {
  try {
    return await this.repository.create(dto);
  } catch (error) {
    // Handle specific database errors
    if ((error as any).code === 11000) {
      throw ApiError.conflict('User already exists');
    }

    if (error.name === 'ValidationError') {
      throw ApiError.badRequest('Invalid user data');
    }

    // Re-throw unexpected errors
    throw error;
  }
}
```

### 6. Business Logic Errors

```typescript
async processOrder(orderId: string): Promise<void> {
  const order = await this.orderRepository.findById(orderId);

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.status === 'cancelled') {
    throw ApiError.badRequest('Cannot process cancelled order');
  }

  if (order.status === 'completed') {
    throw ApiError.badRequest('Order already processed');
  }

  // Check inventory
  const product = await this.productRepository.findById(order.productId);
  if (product.stock < order.quantity) {
    throw ApiError.badRequest('Insufficient stock');
  }

  // Process order
  // ...
}
```

## HTTP Status Codes

### Common Status Codes

| Code    | Meaning               | When to Use                             |
| ------- | --------------------- | --------------------------------------- |
| **200** | OK                    | Successful GET, PUT, PATCH, DELETE      |
| **201** | Created               | Successful POST (resource created)      |
| **204** | No Content            | Successful DELETE (no response body)    |
| **400** | Bad Request           | Invalid request data, validation errors |
| **401** | Unauthorized          | Missing or invalid authentication       |
| **403** | Forbidden             | Authenticated but not authorized        |
| **404** | Not Found             | Resource doesn't exist                  |
| **409** | Conflict              | Resource already exists, duplicate      |
| **422** | Unprocessable Entity  | Semantic validation errors              |
| **429** | Too Many Requests     | Rate limiting                           |
| **500** | Internal Server Error | Unexpected server error                 |
| **503** | Service Unavailable   | Temporary service issues                |

### Status Code Usage

```typescript
// 200 OK - Successful retrieval
async getUser(id: string): Promise<void> {
  const user = await userService.getById(id);
  res.status(200).json({ success: true, data: user });
}

// 201 Created - Resource created
async createUser(dto: CreateUserDto): Promise<void> {
  const user = await userService.create(dto);
  res.status(201).json({ success: true, data: user });
}

// 204 No Content - Successful deletion
async deleteUser(id: string): Promise<void> {
  await userService.delete(id);
  res.status(204).send();
}

// 400 Bad Request - Validation error
if (!isValidEmail(email)) {
  throw ApiError.badRequest('Invalid email format');
}

// 401 Unauthorized - Not authenticated
if (!req.user) {
  throw ApiError.unauthorized('Please log in');
}

// 403 Forbidden - Not authorized
if (!req.user.isAdmin) {
  throw ApiError.forbidden('Admin access required');
}

// 404 Not Found - Resource not found
if (!user) {
  throw ApiError.notFound('User not found');
}

// 409 Conflict - Duplicate resource
if (existingUser) {
  throw ApiError.conflict('Email already registered');
}

// 500 Internal Server Error - Unexpected error
throw ApiError.internal('Something went wrong');
```

## Validation Errors

### Joi Validation

```typescript
import Joi from 'joi';

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  age: Joi.number().min(18).required(),
});

// Validate and collect errors
const { error, value } = createUserSchema.validate(req.body, {
  abortEarly: false, // Collect all errors
});

if (error) {
  const errors = error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
  }));

  throw ApiError.badRequest('Validation failed', errors);
}
```

### Custom Validation

```typescript
async validateUser(dto: CreateUserDto): Promise<void> {
  const errors: Array<{ field: string; message: string }> = [];

  // Email validation
  if (!isValidEmail(dto.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
    });
  }

  // Check if email exists
  const existing = await this.repository.findByEmail(dto.email);
  if (existing) {
    errors.push({
      field: 'email',
      message: 'Email already exists',
    });
  }

  // Age validation
  if (dto.age < 18) {
    errors.push({
      field: 'age',
      message: 'Must be at least 18 years old',
    });
  }

  // Throw if errors exist
  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}
```

## Best Practices

### 1. Use ApiError Consistently

```typescript
// ✅ Good - Use ApiError
throw ApiError.notFound('User not found');

// ❌ Bad - Generic Error
throw new Error('User not found');
```

### 2. Provide Clear Messages

```typescript
// ✅ Good - Clear, actionable message
throw ApiError.badRequest('Email must be a valid email address');

// ❌ Bad - Vague message
throw ApiError.badRequest('Invalid input');
```

### 3. Include Context

```typescript
// ✅ Good - Include context in logs
logger.error('Payment processing failed', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  error: err.message,
});

// ❌ Bad - No context
logger.error(err.message);
```

### 4. Handle Errors at the Right Level

```typescript
// ✅ Good - Handle at service layer
class UserService {
  async getById(id: string): Promise<IUser> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}

// ❌ Bad - Handle at repository layer
class UserRepository {
  async findById(id: string): Promise<IUser> {
    const user = await this.model.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found'); // Wrong layer
    }
    return user;
  }
}
```

### 5. Don't Swallow Errors

```typescript
// ✅ Good - Log and re-throw
try {
  await externalService.call();
} catch (error) {
  logger.error('External service failed', { error });
  throw ApiError.internal('Service unavailable');
}

// ❌ Bad - Swallow error
try {
  await externalService.call();
} catch (error) {
  console.log('Error:', error);
  // No throw - error is lost
}
```

### 6. Use Async Handler

```typescript
// ✅ Good - Use asyncHandler
router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id);
    res.json({ success: true, data: user });
  })
);

// ❌ Bad - Manual try-catch everywhere
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});
```

### 7. Operational vs Programming Errors

```typescript
// Operational error - Expected, handle gracefully
if (!user) {
  throw ApiError.notFound('User not found'); // isOperational = true
}

// Programming error - Unexpected, needs fixing
if (typeof id !== 'string') {
  throw ApiError.internal('Invalid ID type'); // isOperational = false
}
```

### 8. Return Error Details in Development Only

```typescript
res.status(statusCode).json({
  success: false,
  message,
  ...(errors && { errors }),
  // Only include stack trace in development
  ...(process.env.NODE_ENV === 'development' && {
    stack: err.stack,
  }),
});
```

## Error Response Format

### Standard Response

```json
{
  "success": false,
  "message": "User not found"
}
```

### With Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Development Mode (with stack)

```json
{
  "success": false,
  "message": "Internal server error",
  "stack": "Error: Something went wrong\n    at UserService.create..."
}
```

## Testing Error Handling

```typescript
describe('UserService', () => {
  describe('getById', () => {
    it('should throw ApiError when user not found', async () => {
      // Mock repository to return null
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      // Expect error to be thrown
      await expect(userService.getById('123')).rejects.toThrow(ApiError);
      await expect(userService.getById('123')).rejects.toThrow(
        'User not found'
      );
    });
  });
});
```

## Related Documentation

- **[Development Guide](README.md)** - Overall development workflow
- **[Coding Standards](CODING_STANDARDS.md)** - Code style guidelines
- **[Adding Features](ADDING_FEATURES.md)** - Feature creation guide
- **[API Documentation](../api/README.md)** - API reference

---

**Remember**: Consistent error handling makes debugging easier and provides better user experience.
