# Database Guide (MongoDB)

Complete guide to MongoDB setup, patterns, and best practices in this application.

## 📋 Overview

- **Database**: MongoDB 7.0
- **ODM**: Mongoose 8.x
- **Connection**: Connection pooling with auto-reconnect
- **Location**: `src/core/database/`

## 🔌 Connection Management

### Configuration

**File**: `src/core/database/database.ts`

```typescript
class Database {
  private connection: mongoose.Connection | null = null;

  async connect() {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // IPv4
    };

    this.connection = await mongoose.createConnection(
      config.mongodb.uri,
      options
    );
  }
}
```

### Connection Pool

- **Max Pool Size**: 10 connections
- **Min Pool Size**: 2 connections
- **Socket Timeout**: 45 seconds
- **Selection Timeout**: 5 seconds

**Adjust for production**:

```typescript
// For high-traffic applications
maxPoolSize: 50,
minPoolSize: 10,
```

## 🗄️ Data Models

### Model Structure

**Location**: `src/features/{feature}/models/`

**Example**: User Model

```typescript
// src/features/user/models/user.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 150,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    versionKey: false, // Disable __v
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
```

### Schema Best Practices

1. **Use TypeScript interfaces** for type safety
2. **Enable timestamps** for audit trails
3. **Add indexes** for frequently queried fields
4. **Use trim** for string fields
5. **Set validation** rules (required, min, max, etc.)
6. **Use lowercase** for emails
7. **Define unique** constraints where needed

## 📊 Repository Pattern

### Base Repository

**File**: `src/core/base/base.repository.ts`

Provides generic CRUD operations:

- `create(data)` - Create new document
- `findById(id)` - Find by ID
- `findAll()` - Get all documents
- `findWithPagination(filter, params)` - Paginated results
- `update(id, data)` - Update document
- `delete(id)` - Delete document
- `count(filter)` - Count documents
- `exists(filter)` - Check existence

### Custom Repository

**Example**: User Repository

```typescript
// src/features/user/repositories/user.repository.ts
import { BaseRepository } from '@/core/base';
import { UserModel, IUserDocument } from '../models';

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(UserModel);
  }

  // Custom methods
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.countDocuments({ email });
    return count > 0;
  }

  async findActive(): Promise<IUserDocument[]> {
    return await this.model.find({ isActive: true }).exec();
  }
}
```

## 🔍 Querying

### Basic Queries

```typescript
// Find all
const users = await userRepository.findAll();

// Find by ID
const user = await userRepository.findById('507f1f77bcf86cd799439011');

// Find with filter
const activeUsers = await UserModel.find({ isActive: true });

// Find one
const user = await UserModel.findOne({ email: 'john@example.com' });

// Count
const count = await UserModel.countDocuments({ age: { $gte: 18 } });

// Exists
const exists = await UserModel.exists({ email: 'john@example.com' });
```

### Advanced Queries

```typescript
// Projection (select specific fields)
const users = await UserModel.find({}).select('name email').exec();

// Sorting
const users = await UserModel.find({}).sort({ createdAt: -1 }).exec();

// Limit and skip
const users = await UserModel.find({}).limit(10).skip(20).exec();

// Population (if using refs)
const users = await UserModel.find({}).populate('profile').exec();

// Lean (plain JavaScript objects)
const users = await UserModel.find({}).lean();
```

### Pagination

```typescript
// Using base repository
const result = await userRepository.findWithPagination(
  { isActive: true }, // filter
  { page: 1, limit: 10 } // pagination params
);

// Result structure:
// {
//   data: [...],
//   pagination: {
//     page: 1,
//     limit: 10,
//     totalPages: 5,
//     totalItems: 42,
//     hasNextPage: true,
//     hasPrevPage: false
//   }
// }
```

## 📝 CRUD Operations

### Create

```typescript
// Create single document
const user = await userRepository.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
});

// Create multiple documents
const users = await UserModel.insertMany([
  { name: 'John', email: 'john@example.com', age: 30 },
  { name: 'Jane', email: 'jane@example.com', age: 28 },
]);
```

### Read

```typescript
// Find by ID
const user = await userRepository.findById(id);

// Find by email
const user = await userRepository.findByEmail('john@example.com');

// Find all matching
const users = await UserModel.find({ age: { $gte: 18 } });
```

### Update

```typescript
// Update by ID
const user = await userRepository.update(id, {
  name: 'Jane Doe',
  age: 31,
});

// Update one matching
const result = await UserModel.updateOne(
  { email: 'john@example.com' },
  { $set: { age: 31 } }
);

// Update many
const result = await UserModel.updateMany(
  { isActive: false },
  { $set: { status: 'inactive' } }
);

// Find and update (returns updated document)
const user = await UserModel.findOneAndUpdate(
  { email: 'john@example.com' },
  { $set: { age: 31 } },
  { new: true } // Return updated document
);
```

### Delete

```typescript
// Delete by ID
await userRepository.delete(id);

// Delete one matching
await UserModel.deleteOne({ email: 'john@example.com' });

// Delete many
await UserModel.deleteMany({ isActive: false });

// Find and delete
const user = await UserModel.findOneAndDelete({
  email: 'john@example.com',
});
```

## 🎯 Indexes

### Creating Indexes

```typescript
// Single field index
userSchema.index({ email: 1 }); // Ascending
userSchema.index({ createdAt: -1 }); // Descending

// Compound index
userSchema.index({ lastName: 1, firstName: 1 });

// Unique index
userSchema.index({ email: 1 }, { unique: true });

// Text index for search
userSchema.index({ name: 'text', email: 'text' });

// TTL index (auto-delete after time)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Partial index
userSchema.index({ email: 1 }, { partialFilterExpression: { isActive: true } });
```

### Index Best Practices

1. **Index frequently queried fields**
2. **Use compound indexes** for multiple field queries
3. **Limit index count** (each adds write overhead)
4. **Monitor index usage** with `explain()`
5. **Create indexes in background** in production

### Checking Indexes

```bash
# In MongoDB shell
db.users.getIndexes()

# Check index usage
db.users.find({ email: 'john@example.com' }).explain('executionStats')
```

## ⚡ Performance Optimization

### Query Optimization

```typescript
// Use lean() for read-only data (faster)
const users = await UserModel.find({}).lean();

// Select only needed fields
const users = await UserModel.find({}).select('name email');

// Use indexes for sorting
const users = await UserModel.find({}).sort({ createdAt: -1 });

// Limit results
const users = await UserModel.find({}).limit(100);

// Use explain to analyze queries
const explanation = await UserModel.find({ email: 'john@example.com' }).explain(
  'executionStats'
);
```

### Connection Pool Tuning

```typescript
// For high-traffic apps
const options = {
  maxPoolSize: 50, // More connections
  minPoolSize: 10, // Higher minimum
  maxIdleTimeMS: 10000, // Close idle connections
};
```

### Projection

```typescript
// Include only specific fields (reduces data transfer)
const users = await UserModel.find({}, 'name email');

// Exclude specific fields
const users = await UserModel.find({}, '-password -__v');
```

## 🔄 Transactions

### Multi-Document Transactions

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Operation 1
  const user = await UserModel.create(
    [
      {
        name: 'John',
        email: 'john@example.com',
      },
    ],
    { session }
  );

  // Operation 2
  await ProfileModel.create(
    [
      {
        userId: user[0]._id,
        bio: 'Hello world',
      },
    ],
    { session }
  );

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## 🔍 Aggregation Pipeline

### Basic Aggregation

```typescript
// Group and count
const result = await UserModel.aggregate([
  { $group: { _id: '$age', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

// Match, group, and project
const result = await UserModel.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$country', total: { $sum: 1 } } },
  { $project: { country: '$_id', total: 1, _id: 0 } },
  { $sort: { total: -1 } },
]);

// Lookup (join)
const result = await UserModel.aggregate([
  {
    $lookup: {
      from: 'profiles',
      localField: '_id',
      foreignField: 'userId',
      as: 'profile',
    },
  },
]);
```

## 🛡️ Data Validation

### Schema-Level Validation

```typescript
const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v: string) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Invalid email format',
    },
  },
  age: {
    type: Number,
    required: true,
    min: [1, 'Age must be at least 1'],
    max: [150, 'Age must be at most 150'],
  },
});
```

### Custom Validators

```typescript
userSchema.path('email').validate(async function (email: string) {
  const count = await this.constructor.countDocuments({ email });
  return count === 0;
}, 'Email already exists');
```

## 🔐 Security

### Prevent NoSQL Injection

```typescript
// Already implemented with express-mongo-sanitize
app.use(mongoSanitize());

// This converts:
// { email: { $gt: "" } }
// to:
// { email: { "$gt": "" } } // Safe string
```

### Password Hashing Example

```typescript
// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const bcrypt = require('bcrypt');
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

## 📊 Monitoring

### Query Logging

```typescript
// Enable Mongoose debug mode
mongoose.set('debug', true);

// Custom query logging
mongoose.set('debug', function (coll, method, query, doc) {
  logger.debug(`Mongoose: ${coll}.${method}`, { query, doc });
});
```

### Slow Query Logging

MongoDB logs slow queries (> 100ms) by default. Check MongoDB logs:

```bash
docker-compose logs backend-mongodb | grep "Slow query"
```

## 🔧 Maintenance

### Backup

```bash
# Backup all databases
docker exec backend-mongodb mongodump --out /backup

# Backup specific database
docker exec backend-mongodb mongodump --db backend-part-2 --out /backup

# Copy backup to host
docker cp backend-mongodb:/backup ./backup
```

### Restore

```bash
# Restore database
docker exec backend-mongodb mongorestore /backup
```

### Indexes Management

```bash
# Rebuild indexes
docker exec -it backend-mongodb mongosh
> use backend-part-2
> db.users.reIndex()
```

## 🐛 Troubleshooting

### Connection Issues

```typescript
// Check connection status
const isConnected = mongoose.connection.readyState === 1;

// Handle connection errors
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
```

### Slow Queries

```typescript
// Analyze query performance
const result = await UserModel.find({ email: 'john@example.com' }).explain(
  'executionStats'
);

console.log(result.executionStats);
// Look for:
// - executionTimeMillis
// - totalDocsExamined
// - nReturned
```

### Memory Issues

```typescript
// Use cursor for large datasets
const cursor = UserModel.find({}).cursor();

for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
  // Process document
  await processUser(doc);
}
```

## Further Reading

- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
- [Repository Pattern](../architecture/DESIGN_PATTERNS.md#repository-pattern)
- [Performance Guide](../guides/PERFORMANCE.md)

---

**Next**: [Cache Guide](./CACHE.md) →
