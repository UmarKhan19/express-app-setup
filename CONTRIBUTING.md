# CONTRIBUTING

Thank you for considering contributing to this project! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes**:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior includes**:

- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/backend-part-2.git
cd backend-part-2
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start infrastructure
make infra-up

# Start development server
npm run dev
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/bug-description
```

## 💻 Development Process

### 1. Make Your Changes

- Write clean, maintainable code
- Follow existing code style and patterns
- Add comments for complex logic
- Update documentation as needed

### 2. Test Your Changes

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check

# Run tests (when available)
npm test
```

### 3. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add user profile feature"
```

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How has this been tested?

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## 📝 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface IUser {
  name: string;
  email: string;
  age: number;
}

async function createUser(data: IUser): Promise<IUserDocument> {
  return await userRepository.create(data);
}

// ❌ Bad
function createUser(data: any) {
  return userRepository.create(data);
}
```

### File Organization

```typescript
// Imports order:
// 1. Node modules
import express from 'express';
import mongoose from 'mongoose';

// 2. Aliased imports
import config from '@/config';
import { BaseService } from '@/core/base';

// 3. Relative imports
import { UserRepository } from './user.repository';
import { CreateUserDto } from '../dtos';
```

### Naming Conventions

| Type               | Convention       | Example           |
| ------------------ | ---------------- | ----------------- |
| **Files**          | kebab-case       | `user.service.ts` |
| **Classes**        | PascalCase       | `UserService`     |
| **Interfaces**     | IPascalCase      | `IUserService`    |
| **Functions**      | camelCase        | `createUser()`    |
| **Constants**      | UPPER_SNAKE_CASE | `MAX_RETRIES`     |
| **Private fields** | \_camelCase      | `_connection`     |

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Yes
- **Line length**: 80-100 characters (flexible)
- **Trailing commas**: Yes

## 📨 Commit Guidelines

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding/updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(user): add user profile endpoint"

# Bug fix
git commit -m "fix(auth): resolve token expiration issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): change user endpoint structure

BREAKING CHANGE: user endpoint now returns different format"
```

## 🧪 Testing

### Writing Tests

```typescript
// Unit test example
describe('UserService', () => {
  it('should create a user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    const user = await userService.create(userData);

    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📚 Documentation

### Code Documentation

````typescript
/**
 * Creates a new user and sends welcome email
 *
 * @param dto - User creation data
 * @returns Created user document
 * @throws {ApiError} If email already exists
 *
 * @example
 * ```typescript
 * const user = await userService.create({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   age: 30
 * });
 * ```
 */
async create(dto: CreateUserDto): Promise<IUserDocument> {
  // Implementation
}
````

### README Updates

When adding features, update relevant documentation:

- API endpoints → `docs/api/README.md`
- Architecture changes → `docs/architecture/`
- Configuration → `docs/getting-started/CONFIGURATION.md`

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:

1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g. macOS 12.0]
- Node version: [e.g. 18.0.0]
- npm version: [e.g. 9.0.0]

**Additional context**
Add any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots.
```

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested
- `wontfix` - This will not be worked on

## 📞 Getting Help

- **Documentation**: Check [docs/](docs/) folder
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Email**: Contact maintainers

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- CHANGELOG.md for each release
- GitHub contributors page

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's ISC License.

---

**Thank you for contributing! 🎉**
