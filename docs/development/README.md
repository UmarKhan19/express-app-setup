# Development Guide

> **Best practices for developing features in this codebase**

This guide covers coding standards, development workflow, and best practices for building features.

## 📚 Table of Contents

- [Overview](#overview)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Quick Reference](#quick-reference)
- [Development Tools](#development-tools)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Debugging](#debugging)

## Overview

This project follows:

- **Layered Architecture** - Presentation, Business, Data layers
- **Feature-based Structure** - Organize by feature, not type
- **TypeScript** - Strict typing for safety
- **Clean Code** - SOLID principles, DRY, KISS

### Core Principles

```
1. Separation of Concerns
   - Controllers handle HTTP
   - Services handle business logic
   - Repositories handle data access

2. Dependency Injection
   - Use DI container for loose coupling
   - Easy to test and swap implementations

3. Error Handling
   - Use ApiError for consistent errors
   - Centralized error middleware

4. Type Safety
   - Strict TypeScript configuration
   - DTOs for validation
   - Interfaces for contracts
```

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start infrastructure
docker-compose up -d mongodb redis kafka zookeeper

# Start development server
npm run dev
```

### 2. Create a New Feature

See [Adding Features Guide](ADDING_FEATURES.md) for detailed steps.

Quick overview:

1. Create feature folder in `src/features/`
2. Add models, entities, DTOs
3. Implement repository, service, controller
4. Add routes
5. Test your feature

### 3. Make Changes

```bash
# Create a feature branch
git checkout -b feature/user-authentication

# Make changes
# ...

# Check for errors
npm run lint
npm run type-check

# Format code
npm run format

# Commit changes
git add .
git commit -m "feat: add user authentication"

# Push and create PR
git push origin feature/user-authentication
```

### 4. Code Review Process

1. Create pull request
2. Ensure CI passes
3. Request review from team
4. Address feedback
5. Merge when approved

## Project Structure

```
src/
├── server.ts              # Application entry point
├── app.ts                 # Express setup
├── routes.ts              # Main router
├── instrumentation.ts     # OpenTelemetry
│
├── common/                # Shared utilities
│   ├── constants/         # Application constants
│   ├── enums/            # Enumerations
│   ├── interfaces/       # Shared interfaces
│   ├── types/            # Type definitions
│   └── utils/            # Utility functions
│
├── config/               # Configuration
│   └── index.ts          # Config management
│
├── core/                 # Infrastructure
│   ├── base/             # Base classes
│   ├── cache/            # Redis cache
│   ├── database/         # MongoDB
│   ├── email/            # Email service
│   ├── kafka/            # Event streaming
│   ├── queue/            # Background jobs
│   ├── observability/    # Metrics, logs, traces
│   ├── middlewares/      # Express middleware
│   └── container/        # DI container
│
└── features/             # Feature modules
    └── user/             # Example feature
        ├── user.controller.ts
        ├── user.service.ts
        ├── user.repository.ts
        ├── user.model.ts
        ├── user.entity.ts
        ├── user.dto.ts
        ├── user.schema.ts
        ├── user.routes.ts
        ├── user.helper.ts
        └── consumers/    # Kafka consumers
```

## Quick Reference

### File Naming Conventions

```
✅ Good:
user.controller.ts
user.service.ts
user.repository.ts
user.dto.ts
auth.middleware.ts

❌ Bad:
UserController.ts
userService.ts
user_repository.ts
UserDTO.ts
```

### Code Patterns

#### Controllers

```typescript
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @httpGet('/users')
  async getAll(req: Request, res: Response): Promise<void> {
    const users = await this.userService.getAll();
    this.sendSuccess(res, users);
  }
}
```

#### Services

```typescript
export class UserService extends BaseService<IUser> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  async createUser(dto: CreateUserDto): Promise<IUser> {
    // Validation
    // Business logic
    // Data persistence
    return await this.userRepository.create(dto);
  }
}
```

#### Repositories

```typescript
export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email });
  }
}
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript; runtime startup is unverified
npm run start            # Start compiled server; runtime startup is unverified

# Code Quality
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Database
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# Logs
npm run logs             # View application logs
npm run logs:error       # View error logs only
```

## Development Tools

### VS Code Extensions

Recommended extensions:

- ESLint
- Prettier
- TypeScript
- MongoDB for VS Code
- Docker
- GitLens

### Browser Extensions

For API testing:

- REST Client
- Postman
- Thunder Client (VS Code)

### Debugging Tools

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug",
      "program": "${workspaceFolder}/src/server.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

## Code Quality

### ESLint Configuration

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

## Testing

The repository has no test suite or test scripts. The examples below are illustrative only.

### Quick Testing Examples

```typescript
// Unit test
describe('UserService', () => {
  it('should create a user', async () => {
    const user = await userService.create(mockUser);
    expect(user).toBeDefined();
    expect(user.email).toBe(mockUser.email);
  });
});

// Integration test
describe('POST /api/users', () => {
  it('should create a user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(mockUser)
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
  });
});
```

## Debugging

### Using VS Code Debugger

1. Set breakpoints in code
2. Press F5 to start debugging
3. Use Debug Console for evaluation

### Console Debugging

```typescript
// Use logger instead of console.log
import { logger } from '@/common/utils/logger.util';

logger.debug('Debug info', { data });
logger.info('Important event', { userId });
logger.error('Error occurred', { error });
```

### Request Logging

All HTTP requests are automatically logged:

```typescript
// Check logs
tail -f logs/all.log

// Filter by request ID
grep "requestId" logs/all.log
```

### Database Debugging

```typescript
// Enable MongoDB query logging
mongoose.set('debug', true);

// Log query execution time
const start = Date.now();
const result = await User.find();
logger.debug('Query time', { time: Date.now() - start });
```

## Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
MONGODB_URI=mongodb://localhost:27017/myapp

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
```

### Development vs Production

```bash
# Development
LOG_LEVEL=debug
NODE_ENV=development

# Production
LOG_LEVEL=info
NODE_ENV=production
```

## Common Tasks

### Adding a New Endpoint

1. Define DTO in `feature.dto.ts`
2. Add method to service
3. Add method to controller
4. Add route in `feature.routes.ts`
5. Test the endpoint

### Adding Validation

```typescript
// Use Joi for validation
import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
  age: Joi.number().min(18).optional(),
});
```

### Adding Middleware

```typescript
// Create middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check authentication
  if (!req.headers.authorization) {
    throw new ApiError(401, 'Unauthorized');
  }
  next();
};

// Use in routes
router.get('/protected', authMiddleware, controller.getProtected);
```

## Performance Tips

### Database Queries

```typescript
// ✅ Good - Use indexes
User.find({ email }).hint({ email: 1 });

// ✅ Good - Limit fields
User.find().select('name email');

// ✅ Good - Pagination
User.find()
  .limit(20)
  .skip(page * 20);

// ❌ Bad - No indexes
User.find({ customField });

// ❌ Bad - Load all fields
User.find();

// ❌ Bad - No pagination
User.find();
```

### Caching

```typescript
// Cache frequently accessed data
const cached = await cacheService.get(`user:${id}`);
if (cached) return cached;

const user = await userRepository.findById(id);
await cacheService.set(`user:${id}`, user, 3600);
return user;
```

### Async Operations

```typescript
// ✅ Good - Parallel execution
const [users, posts] = await Promise.all([
  userService.getAll(),
  postService.getAll(),
]);

// ❌ Bad - Sequential execution
const users = await userService.getAll();
const posts = await postService.getAll();
```

## Documentation

### Code Comments

```typescript
/**
 * Creates a new user in the system
 *
 * @param dto - User creation data
 * @returns Created user entity
 * @throws ApiError if email already exists
 */
async createUser(dto: CreateUserDto): Promise<IUser> {
  // Implementation
}
```

### README for Features

Each feature should have a README:

```markdown
# User Feature

## Overview

Example feature description only. The current user module does not implement authentication.

## Endpoints

- POST /api/users - Create user
- GET /api/users/:id - Get user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

## Dependencies

- MongoDB for storage
- Redis for sessions
- Email service for notifications
```

## Related Documentation

- **[Coding Standards](CODING_STANDARDS.md)** - Detailed coding guidelines
- **[Adding Features](ADDING_FEATURES.md)** - Step-by-step feature creation
- **[Error Handling](ERROR_HANDLING.md)** - Error handling patterns
- **[Architecture](../architecture/ARCHITECTURE.md)** - System architecture

## Getting Help

- Check [FAQ](../guides/FAQ.md)
- Review [Troubleshooting](../guides/TROUBLESHOOTING.md)
- Ask in team chat
- Create an issue

---

**Ready to add a feature?** Follow the [Adding Features Guide](ADDING_FEATURES.md).
