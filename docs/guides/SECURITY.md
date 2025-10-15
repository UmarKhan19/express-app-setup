# Security Guide

> **Security best practices and implementation**

## Authentication

### JWT Implementation

```typescript
import jwt from 'jsonwebtoken';

// Generate token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Password Hashing

```typescript
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

### Authentication Middleware

```typescript
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid token');
  }
};
```

## Authorization

### Role-Based Access Control (RBAC)

```typescript
export const requireRole = (...roles: string[]) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden');
    }

    next();
  };
};

// Usage
router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);
```

## Input Validation

### Request Validation

```typescript
import Joi from 'joi';

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const { error, value } = schema.validate(req.body);
if (error) {
  throw new ApiError(400, error.message);
}
```

### SQL Injection Prevention

Use parameterized queries (Mongoose handles this):

```typescript
// ✅ Safe - Parameterized
User.findOne({ email });

// ❌ Unsafe - String interpolation (don't do this)
User.findOne({ $where: `this.email == '${email}'` });
```

### XSS Prevention

```typescript
import xss from 'xss';

// Sanitize input
const clean = xss(userInput);

// Or use helmet
app.use(helmet.contentSecurityPolicy());
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests',
});

app.use('/api', limiter);
```

## CORS Configuration

```typescript
import cors from 'cors';

app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
```

## Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  })
);
```

## Data Encryption

### Sensitive Data

```typescript
import crypto from 'crypto';

// Encrypt
const encrypt = (text: string) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Decrypt
const decrypt = (encrypted: string) => {
  const decipher = crypto.createDecipher(
    'aes-256-cbc',
    process.env.ENCRYPTION_KEY
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

## Environment Variables

### Never commit secrets

```.gitignore
.env
.env.*
!.env.example
```

### Use secret management

- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- HashiCorp Vault

## Database Security

### Connection Security

```typescript
mongoose.connect(MONGODB_URI, {
  ssl: true,
  authSource: 'admin',
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PASSWORD,
});
```

### Field Encryption

```typescript
// Encrypt fields in schema
userSchema.pre('save', function () {
  if (this.isModified('ssn')) {
    this.ssn = encrypt(this.ssn);
  }
});
```

## API Security

### HTTPS Only

```typescript
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return res.redirect('https://' + req.headers.host + req.url);
}
```

### API Keys

```typescript
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new ApiError(401, 'Invalid API key');
  }

  next();
};
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Implement authentication
- [ ] Use strong password hashing (bcrypt)
- [ ] Validate all inputs
- [ ] Sanitize user input (XSS prevention)
- [ ] Implement rate limiting
- [ ] Configure CORS properly
- [ ] Use security headers (helmet)
- [ ] Never commit secrets
- [ ] Use environment variables
- [ ] Enable MongoDB authentication
- [ ] Use SSL for database connections
- [ ] Keep dependencies updated
- [ ] Implement logging and monitoring
- [ ] Regular security audits

## Security Testing

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Security linting
npm install -g eslint-plugin-security
```

## Incident Response

1. Identify the issue
2. Contain the breach
3. Investigate
4. Fix the vulnerability
5. Document the incident
6. Review and improve

Related: [FAQ](FAQ.md) | [Troubleshooting](TROUBLESHOOTING.md)
