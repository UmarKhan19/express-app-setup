# Coding Standards

> **Consistent code style for maintainability and readability**

This document defines the coding standards and best practices for this project.

## 📚 Table of Contents

- [TypeScript Guidelines](#typescript-guidelines)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [Code Formatting](#code-formatting)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## TypeScript Guidelines

### Strict Mode

We use strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Annotations

```typescript
// ✅ Good - Explicit return types
async function getUser(id: string): Promise<IUser> {
  return await userRepository.findById(id);
}

// ❌ Bad - Implicit return type
async function getUser(id: string) {
  return await userRepository.findById(id);
}
```

### Avoid `any`

```typescript
// ✅ Good - Proper typing
function processData(data: UserData): ProcessedUser {
  return transform(data);
}

// ❌ Bad - Using any
function processData(data: any): any {
  return transform(data);
}

// ✅ Good - Use unknown for truly unknown types
function handleError(error: unknown): void {
  if (error instanceof Error) {
    logger.error(error.message);
  }
}
```

### Interfaces vs Types

```typescript
// ✅ Use interfaces for object shapes
interface IUser {
  id: string;
  email: string;
  name: string;
}

// ✅ Use types for unions, intersections, primitives
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';
type UserWithRole = IUser & { role: UserRole };
```

### Generics

```typescript
// ✅ Good - Generic repository
class BaseRepository<T> {
  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }
}

// ✅ Good - Generic function
function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
```

### Enums

```typescript
// ✅ Good - String enums for clarity
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// ❌ Bad - Numeric enums (unclear values)
export enum UserStatus {
  ACTIVE,
  INACTIVE,
  SUSPENDED,
}
```

## Naming Conventions

### Files and Folders

```
✅ Good:
user.controller.ts
user.service.ts
user.repository.ts
auth.middleware.ts
email/

❌ Bad:
UserController.ts
userService.ts
user_repository.ts
AuthMiddleware.ts
Email/
```

**Rules**:

- Files: `lowercase.type.ts`
- Folders: `lowercase/`
- Multiple words: `kebab-case.type.ts`

### Classes

```typescript
// ✅ Good - PascalCase
class UserController extends BaseController {}
class EmailService {}
class UserRepository extends BaseRepository {}

// ❌ Bad
class userController {}
class email_service {}
```

### Interfaces

```typescript
// ✅ Good - PascalCase with I prefix for domain interfaces
interface IUser {
  id: string;
  email: string;
}

// ✅ Good - No prefix for simple interfaces
interface CreateUserDto {
  email: string;
  name: string;
}

// ❌ Bad
interface user {}
interface iUser {}
```

### Variables and Functions

```typescript
// ✅ Good - camelCase
const userId = '123';
const isActive = true;
function getUserById(id: string) {}
async function createUser(dto: CreateUserDto) {}

// ❌ Bad
const UserId = '123';
const is_active = true;
function get_user_by_id(id: string) {}
```

### Constants

```typescript
// ✅ Good - UPPER_SNAKE_CASE for true constants
const MAX_RETRIES = 3;
const DEFAULT_PAGE_SIZE = 20;
const API_BASE_URL = 'https://api.example.com';

// ✅ Good - camelCase for config objects
const config = {
  maxRetries: 3,
  timeout: 5000,
};

// ❌ Bad
const maxRetries = 3; // Should be MAX_RETRIES
const max_retries = 3;
```

### Private Members

```typescript
class UserService {
  // ✅ Good - Private members with underscore prefix
  private readonly _userRepository: UserRepository;
  private _cache: Map<string, IUser>;

  // ✅ Good - Private methods
  private async _validateUser(user: IUser): Promise<void> {
    // Validation logic
  }
}
```

## File Organization

### Import Order

```typescript
// 1. Node.js built-ins
import { readFile } from 'fs/promises';

// 2. External packages
import express from 'express';
import mongoose from 'mongoose';

// 3. Internal modules (absolute imports)
import { logger } from '@/common/utils/logger.util';
import { IUser } from '@/common/interfaces';
import { UserService } from '@/features/user/services/user.service';

// 4. Relative imports
import { UserHelper } from './user.helper';
```

### Class Structure

```typescript
class UserService extends BaseService<IUser> {
  // 1. Public static members
  public static readonly DEFAULT_ROLE = 'user';

  // 2. Private static members
  private static readonly _cache = new Map();

  // 3. Public instance members
  public readonly serviceName = 'UserService';

  // 4. Private instance members
  private readonly _repository: UserRepository;
  private readonly _emailService: EmailService;

  // 5. Constructor
  constructor(repository: UserRepository, emailService: EmailService) {
    super(repository);
    this._repository = repository;
    this._emailService = emailService;
  }

  // 6. Public methods (by importance)
  async create(dto: CreateUserDto): Promise<IUser> {}
  async findById(id: string): Promise<IUser | null> {}
  async update(id: string, dto: UpdateUserDto): Promise<IUser> {}
  async delete(id: string): Promise<void> {}

  // 7. Private methods
  private async _validateEmail(email: string): Promise<void> {}
  private async _sendWelcomeEmail(user: IUser): Promise<void> {}
}
```

## Code Formatting

### Indentation

- Use 2 spaces (not tabs)
- Configured in `.editorconfig` and `.prettierrc`

### Line Length

- Maximum 100 characters
- Break long lines logically

```typescript
// ✅ Good
const user = await userRepository.findOne({
  email,
  status: UserStatus.ACTIVE,
  deletedAt: null,
});

// ❌ Bad - Too long
const user = await userRepository.findOne({
  email,
  status: UserStatus.ACTIVE,
  deletedAt: null,
  createdAt: { $gte: startDate },
});
```

### Spacing

```typescript
// ✅ Good
if (condition) {
  doSomething();
}

const result = a + b;
const array = [1, 2, 3];
const obj = { key: 'value' };

// ❌ Bad
if (condition) {
  doSomething();
}

const result = a + b;
const array = [1, 2, 3];
const obj = { key: 'value' };
```

### Semicolons

```typescript
// ✅ Good - Always use semicolons
const user = await getUser();
return user;

// ❌ Bad - No semicolons
const user = await getUser();
return user;
```

### Quotes

```typescript
// ✅ Good - Single quotes for strings
const name = 'John Doe';
const message = `Hello ${name}`;

// ❌ Bad - Inconsistent quotes
const name = 'John Doe';
const message = `Hello ` + name;
```

## Best Practices

### 1. SOLID Principles

#### Single Responsibility

```typescript
// ✅ Good - Single responsibility
class UserValidator {
  validate(user: IUser): void {
    // Only validation logic
  }
}

class UserRepository {
  async save(user: IUser): Promise<IUser> {
    // Only data access logic
  }
}

// ❌ Bad - Multiple responsibilities
class UserService {
  validate(user: IUser): void {}
  async save(user: IUser): Promise<IUser> {}
  sendEmail(user: IUser): void {}
  generateReport(user: IUser): string {}
}
```

#### Open/Closed

```typescript
// ✅ Good - Open for extension, closed for modification
abstract class BaseNotification {
  abstract send(message: string): Promise<void>;
}

class EmailNotification extends BaseNotification {
  async send(message: string): Promise<void> {
    // Email implementation
  }
}

class SMSNotification extends BaseNotification {
  async send(message: string): Promise<void> {
    // SMS implementation
  }
}
```

#### Dependency Inversion

```typescript
// ✅ Good - Depend on abstractions
class UserService {
  constructor(
    private readonly repository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}
}

// ❌ Bad - Depend on concrete implementations
class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly emailService: GmailService
  ) {}
}
```

### 2. DRY (Don't Repeat Yourself)

```typescript
// ✅ Good - Reusable function
function formatDate(date: Date, format: string): string {
  // Format logic
}

const formatted1 = formatDate(date1, 'YYYY-MM-DD');
const formatted2 = formatDate(date2, 'YYYY-MM-DD');

// ❌ Bad - Repeated code
const formatted1 = `${date1.getFullYear()}-${date1.getMonth()}-${date1.getDate()}`;
const formatted2 = `${date2.getFullYear()}-${date2.getMonth()}-${date2.getDate()}`;
```

### 3. KISS (Keep It Simple, Stupid)

```typescript
// ✅ Good - Simple and clear
function isAdult(age: number): boolean {
  return age >= 18;
}

// ❌ Bad - Unnecessarily complex
function isAdult(age: number): boolean {
  return age < 18 ? false : age >= 18 ? true : false;
}
```

### 4. Early Returns

```typescript
// ✅ Good - Early return
async function getUser(id: string): Promise<IUser> {
  if (!id) {
    throw new ApiError(400, 'ID is required');
  }

  const user = await userRepository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
}

// ❌ Bad - Nested conditions
async function getUser(id: string): Promise<IUser> {
  if (id) {
    const user = await userRepository.findById(id);
    if (user) {
      return user;
    } else {
      throw new ApiError(404, 'User not found');
    }
  } else {
    throw new ApiError(400, 'ID is required');
  }
}
```

### 5. Async/Await

```typescript
// ✅ Good - Async/await
async function createUser(dto: CreateUserDto): Promise<IUser> {
  const user = await userRepository.create(dto);
  await emailService.sendWelcome(user.email);
  return user;
}

// ❌ Bad - Promise chains
function createUser(dto: CreateUserDto): Promise<IUser> {
  return userRepository.create(dto).then((user) => {
    return emailService.sendWelcome(user.email).then(() => user);
  });
}
```

### 6. Error Handling

```typescript
// ✅ Good - Specific error handling
async function processPayment(amount: number): Promise<void> {
  try {
    await paymentGateway.charge(amount);
  } catch (error) {
    if (error instanceof PaymentError) {
      throw new ApiError(402, 'Payment failed');
    }
    throw error;
  }
}

// ❌ Bad - Swallowing errors
async function processPayment(amount: number): Promise<void> {
  try {
    await paymentGateway.charge(amount);
  } catch (error) {
    console.log('Error:', error);
  }
}
```

### 7. Logging

```typescript
// ✅ Good - Structured logging
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});

// ❌ Bad - String interpolation
logger.info(`User ${user.id} created at ${new Date()}`);

// ❌ Bad - console.log
console.log('User created:', user);
```

## Anti-Patterns

### 1. God Object

```typescript
// ❌ Bad - God object with too many responsibilities
class UserManager {
  validateUser() {}
  saveUser() {}
  deleteUser() {}
  sendEmail() {}
  generateReport() {}
  processPayment() {}
  updateInventory() {}
}

// ✅ Good - Separate concerns
class UserValidator {}
class UserRepository {}
class UserService {}
class EmailService {}
class ReportService {}
class PaymentService {}
```

### 2. Magic Numbers

```typescript
// ❌ Bad - Magic numbers
if (user.age > 18) {
}
setTimeout(callback, 3000);

// ✅ Good - Named constants
const MINIMUM_AGE = 18;
const CACHE_TTL = 3000;

if (user.age > MINIMUM_AGE) {
}
setTimeout(callback, CACHE_TTL);
```

### 3. Deep Nesting

```typescript
// ❌ Bad - Deep nesting
function processUser(user: IUser) {
  if (user) {
    if (user.email) {
      if (user.age > 18) {
        if (user.isVerified) {
          // Do something
        }
      }
    }
  }
}

// ✅ Good - Early returns
function processUser(user: IUser) {
  if (!user) return;
  if (!user.email) return;
  if (user.age <= 18) return;
  if (!user.isVerified) return;

  // Do something
}
```

### 4. Callback Hell

```typescript
// ❌ Bad - Callback hell
getData((data) => {
  processData(data, (result) => {
    saveData(result, (saved) => {
      sendNotification(saved, (sent) => {
        // Finally done
      });
    });
  });
});

// ✅ Good - Async/await
const data = await getData();
const result = await processData(data);
const saved = await saveData(result);
await sendNotification(saved);
```

### 5. Ignoring Errors

```typescript
// ❌ Bad - Ignoring errors
try {
  await dangerousOperation();
} catch (err) {
  // Silent failure
}

// ✅ Good - Handle errors
try {
  await dangerousOperation();
} catch (error) {
  logger.error('Operation failed', { error });
  throw new ApiError(500, 'Operation failed');
}
```

## Code Review Checklist

Before submitting code for review:

- [ ] Code follows naming conventions
- [ ] No `console.log` statements
- [ ] No `any` types (or justified usage)
- [ ] Functions have return type annotations
- [ ] Error handling is implemented
- [ ] Logging uses structured format
- [ ] No magic numbers or strings
- [ ] Code is DRY
- [ ] No deep nesting
- [ ] Tests are included
- [ ] Documentation is updated

## Related Documentation

- **[Development Guide](README.md)** - Overall development workflow
- **[Adding Features](ADDING_FEATURES.md)** - Feature creation guide
- **[Error Handling](ERROR_HANDLING.md)** - Error handling patterns
- **[Architecture](../architecture/ARCHITECTURE.md)** - System architecture

---

**Remember**: Consistency is key. Follow these standards to maintain a clean, maintainable codebase.
