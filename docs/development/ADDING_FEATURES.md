# Adding Features

> **Step-by-step guide to creating new features**

This guide walks you through creating a complete feature module from scratch.

## 📚 Table of Contents

- [Overview](#overview)
- [Feature Structure](#feature-structure)
- [Step-by-Step Guide](#step-by-step-guide)
- [Example: Product Feature](#example-product-feature)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Overview

Features in this project follow a layered architecture:

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│  Routes → Controllers                                │
│  Handle HTTP requests/responses                      │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Business Layer                          │
│  Services → Business Logic                           │
│  Validation, transformation, orchestration           │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Data Layer                              │
│  Repositories → Data Access                          │
│  Database operations, caching                        │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Database                                │
│  MongoDB, Redis                                      │
└─────────────────────────────────────────────────────┘
```

## Feature Structure

A complete feature includes:

```
features/
└── product/
    ├── controllers/
    │   └── product.controller.ts     # HTTP handlers
    ├── services/
    │   └── product.service.ts        # Business logic
    ├── repositories/
    │   └── product.repository.ts     # Data access
    ├── models/
    │   └── product.model.ts          # Mongoose model
    ├── entities/
    │   └── product.entity.ts         # Domain entity interface
    ├── dtos/
    │   ├── create-product.dto.ts     # Request DTOs
    │   └── update-product.dto.ts
    ├── schemas/
    │   └── product.schema.ts         # Validation schemas
    ├── routes/
    │   └── product.routes.ts         # Route definitions
    ├── helpers/
    │   └── product.helper.ts         # Helper functions
    ├── consumers/
    │   └── product-created.consumer.ts  # Kafka consumers
    └── index.ts                      # Public exports
```

## Step-by-Step Guide

### Step 1: Create Feature Folder

```bash
# Create feature directory structure
mkdir -p src/features/product/{controllers,services,repositories,models,entities,dtos,schemas,routes,helpers,consumers}

# Create index file
touch src/features/product/index.ts
```

### Step 2: Define Entity Interface

File: `src/features/product/entities/product.entity.ts`

```typescript
import { IBaseEntity } from '@/common/interfaces';

export interface IProduct extends IBaseEntity {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
}
```

### Step 3: Create Mongoose Model

File: `src/features/product/models/product.model.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../entities/product.entity';

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    images: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
```

### Step 4: Create DTOs

File: `src/features/product/dtos/create-product.dto.ts`

```typescript
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images?: string[];
  isActive?: boolean;
}
```

File: `src/features/product/dtos/update-product.dto.ts`

```typescript
export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  images?: string[];
  isActive?: boolean;
}
```

### Step 5: Create Validation Schemas

File: `src/features/product/schemas/product.schema.ts`

```typescript
import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(200).required().messages({
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name cannot exceed 200 characters',
    'any.required': 'Name is required',
  }),

  description: Joi.string().trim().min(10).max(2000).required(),

  price: Joi.number().min(0).required().messages({
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),

  stock: Joi.number().integer().min(0).default(0),

  category: Joi.string().trim().required(),

  images: Joi.array().items(Joi.string().uri()).optional(),

  isActive: Joi.boolean().default(true),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().min(10).max(2000).optional(),
  price: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  category: Joi.string().trim().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  isActive: Joi.boolean().optional(),
}).min(1); // At least one field required
```

### Step 6: Create Repository

File: `src/features/product/repositories/product.repository.ts`

```typescript
import { BaseRepository } from '@/core/base/base.repository';
import { IProduct } from '../entities/product.entity';
import { Product } from '../models/product.model';

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }

  /**
   * Find products by category
   */
  async findByCategory(category: string): Promise<IProduct[]> {
    return await this.model
      .find({ category, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find active products with stock
   */
  async findAvailable(): Promise<IProduct[]> {
    return await this.model
      .find({
        isActive: true,
        stock: { $gt: 0 },
      })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Search products by text
   */
  async search(query: string): Promise<IProduct[]> {
    return await this.model
      .find({
        $text: { $search: query },
        isActive: true,
      })
      .sort({ score: { $meta: 'textScore' } })
      .exec();
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    return await this.model
      .findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true })
      .exec();
  }
}
```

### Step 7: Create Service

File: `src/features/product/services/product.service.ts`

```typescript
import { BaseService } from '@/core/base/base.service';
import { ApiError } from '@/common/utils/error.util';
import { logger } from '@/common/utils/logger.util';
import { IProduct } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductRepository } from '../repositories/product.repository';
import { CacheService } from '@/core/cache/cache.service';
import { KafkaService } from '@/core/kafka/kafka.service';

export class ProductService extends BaseService<IProduct> {
  private readonly CACHE_PREFIX = 'product:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cacheService: CacheService,
    private readonly kafkaService: KafkaService
  ) {
    super(productRepository);
  }

  /**
   * Create a new product
   */
  async createProduct(
    dto: CreateProductDto,
    userId: string
  ): Promise<IProduct> {
    logger.info('Creating product', { name: dto.name, userId });

    // Create product
    const product = await this.productRepository.create({
      ...dto,
      createdBy: userId,
    });

    // Publish event
    await this.kafkaService.publishEvent('product.created', {
      productId: product.id,
      name: product.name,
      category: product.category,
    });

    // Cache the product
    await this.cacheService.set(
      `${this.CACHE_PREFIX}${product.id}`,
      product,
      this.CACHE_TTL
    );

    logger.info('Product created', { productId: product.id });
    return product;
  }

  /**
   * Get product by ID (with caching)
   */
  async getProductById(id: string): Promise<IProduct> {
    // Try cache first
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get<IProduct>(cacheKey);

    if (cached) {
      logger.debug('Product found in cache', { productId: id });
      return cached;
    }

    // Fetch from database
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Cache the product
    await this.cacheService.set(cacheKey, product, this.CACHE_TTL);

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    userId: string
  ): Promise<IProduct> {
    logger.info('Updating product', { productId: id, userId });

    const product = await this.productRepository.update(id, {
      ...dto,
      updatedBy: userId,
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);

    // Publish event
    await this.kafkaService.publishEvent('product.updated', {
      productId: product.id,
      changes: dto,
    });

    logger.info('Product updated', { productId: id });
    return product;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    logger.info('Deleting product', { productId: id });

    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new ApiError(404, 'Product not found');
    }

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);

    // Publish event
    await this.kafkaService.publishEvent('product.deleted', {
      productId: id,
    });

    logger.info('Product deleted', { productId: id });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<IProduct[]> {
    return await this.productRepository.findByCategory(category);
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<IProduct[]> {
    if (!query || query.trim().length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters');
    }

    return await this.productRepository.search(query);
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number): Promise<IProduct> {
    const product = await this.productRepository.updateStock(id, quantity);

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Invalidate cache
    await this.cacheService.delete(`${this.CACHE_PREFIX}${id}`);

    return product;
  }
}
```

### Step 8: Create Controller

File: `src/features/product/controllers/product.controller.ts`

```typescript
import { Request, Response } from 'express';
import { BaseController } from '@/core/base/base.controller';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { validateRequest } from '@/core/middlewares/validation.middleware';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/product.schema';

export class ProductController extends BaseController {
  constructor(private readonly productService: ProductService) {
    super();
  }

  /**
   * Create a new product
   * POST /api/products
   */
  create = [
    validateRequest(createProductSchema),
    async (req: Request, res: Response): Promise<void> => {
      const dto: CreateProductDto = req.body;
      const userId = req.user?.id || 'system';

      const product = await this.productService.createProduct(dto, userId);
      this.sendSuccess(res, product, 'Product created successfully', 201);
    },
  ];

  /**
   * Get all products
   * GET /api/products
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    const { category, search } = req.query;

    let products;
    if (search) {
      products = await this.productService.searchProducts(search as string);
    } else if (category) {
      products = await this.productService.getProductsByCategory(
        category as string
      );
    } else {
      products = await this.productService.getAll();
    }

    this.sendSuccess(res, products);
  };

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const product = await this.productService.getProductById(id);
    this.sendSuccess(res, product);
  };

  /**
   * Update product
   * PUT /api/products/:id
   */
  update = [
    validateRequest(updateProductSchema),
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const dto: UpdateProductDto = req.body;
      const userId = req.user?.id || 'system';

      const product = await this.productService.updateProduct(id, dto, userId);
      this.sendSuccess(res, product, 'Product updated successfully');
    },
  ];

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.productService.deleteProduct(id);
    this.sendSuccess(res, null, 'Product deleted successfully');
  };

  /**
   * Update product stock
   * PATCH /api/products/:id/stock
   */
  updateStock = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await this.productService.updateStock(id, quantity);
    this.sendSuccess(res, product, 'Stock updated successfully');
  };
}
```

### Step 9: Create Routes

File: `src/features/product/routes/product.routes.ts`

```typescript
import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product.service';
import { ProductRepository } from '../repositories/product.repository';
import { CacheService } from '@/core/cache/cache.service';
import { KafkaService } from '@/core/kafka/kafka.service';
import { asyncHandler } from '@/core/middlewares/error.middleware';

const router = Router();

// Initialize dependencies
const productRepository = new ProductRepository();
const cacheService = new CacheService();
const kafkaService = new KafkaService();
const productService = new ProductService(
  productRepository,
  cacheService,
  kafkaService
);
const productController = new ProductController(productService);

// Routes
router.post('/', asyncHandler(productController.create));
router.get('/', asyncHandler(productController.getAll));
router.get('/:id', asyncHandler(productController.getById));
router.put('/:id', asyncHandler(productController.update));
router.delete('/:id', asyncHandler(productController.delete));
router.patch('/:id/stock', asyncHandler(productController.updateStock));

export default router;
```

### Step 10: Register Routes

File: `src/routes.ts`

```typescript
import { Router } from 'express';
import productRoutes from '@/features/product/routes/product.routes';

const router = Router();

// Register feature routes
router.use('/products', productRoutes);

export default router;
```

### Step 11: Create Helpers (Optional)

File: `src/features/product/helpers/product.helper.ts`

```typescript
import { IProduct } from '../entities/product.entity';

export class ProductHelper {
  /**
   * Calculate discounted price
   */
  static calculateDiscountedPrice(
    product: IProduct,
    discountPercent: number
  ): number {
    return product.price * (1 - discountPercent / 100);
  }

  /**
   * Check if product is in stock
   */
  static isInStock(product: IProduct): boolean {
    return product.isActive && product.stock > 0;
  }

  /**
   * Format product for public API
   */
  static toPublicFormat(product: IProduct): Partial<IProduct> {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      images: product.images,
      isActive: product.isActive,
    };
  }
}
```

### Step 12: Create Kafka Consumer (Optional)

File: `src/features/product/consumers/product-created.consumer.ts`

```typescript
import { BaseConsumer } from '@/core/kafka/base.consumer';
import { logger } from '@/common/utils/logger.util';

export class ProductCreatedConsumer extends BaseConsumer {
  topic = 'product.created';
  groupId = 'product-notification-service';

  async handleMessage(payload: any): Promise<void> {
    logger.info('Product created event received', payload);

    // Handle the event (e.g., send notifications, update analytics)
    // ...
  }
}
```

### Step 13: Export Feature

File: `src/features/product/index.ts`

```typescript
export * from './entities/product.entity';
export * from './dtos/create-product.dto';
export * from './dtos/update-product.dto';
export * from './controllers/product.controller';
export * from './services/product.service';
export * from './repositories/product.repository';
export * from './models/product.model';
export * from './helpers/product.helper';
```

### Step 14: Test the Feature

```bash
# Start the server
npm run dev

# Test endpoints
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"A test product","price":99.99,"stock":10,"category":"electronics"}'

curl http://localhost:3000/api/products

curl http://localhost:3000/api/products/:id
```

## Best Practices

### 1. Single Responsibility

Each layer has one responsibility:

- **Controllers**: Handle HTTP, delegate to services
- **Services**: Business logic, orchestration
- **Repositories**: Data access only

### 2. Dependency Injection

Use constructor injection for testability:

```typescript
class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly cache: CacheService
  ) {}
}
```

### 3. Error Handling

Use ApiError for consistent errors:

```typescript
if (!product) {
  throw new ApiError(404, 'Product not found');
}
```

### 4. Validation

Always validate input:

```typescript
router.post(
  '/',
  validateRequest(createProductSchema),
  asyncHandler(controller.create)
);
```

### 5. Caching

Cache frequently accessed data:

```typescript
const cached = await cache.get(key);
if (cached) return cached;

const data = await repository.find();
await cache.set(key, data, TTL);
return data;
```

### 6. Events

Publish events for important actions:

```typescript
await kafka.publishEvent('product.created', {
  productId: product.id,
  name: product.name,
});
```

## Common Patterns

### Pagination

```typescript
async findPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.model.find().skip(skip).limit(limit),
    this.model.countDocuments(),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
```

### Soft Delete

```typescript
async softDelete(id: string): Promise<void> {
  await this.model.findByIdAndUpdate(id, {
    deletedAt: new Date(),
    isActive: false,
  });
}
```

### Bulk Operations

```typescript
async createMany(dtos: CreateProductDto[]): Promise<IProduct[]> {
  return await this.model.insertMany(dtos);
}

async updateMany(ids: string[], update: Partial<IProduct>): Promise<void> {
  await this.model.updateMany(
    { _id: { $in: ids } },
    { $set: update }
  );
}
```

## Related Documentation

- **[Development Guide](README.md)** - Overall development workflow
- **[Coding Standards](CODING_STANDARDS.md)** - Code style guidelines
- **[Error Handling](ERROR_HANDLING.md)** - Error handling patterns
- **[Architecture](../architecture/ARCHITECTURE.md)** - System architecture

---

**Congratulations!** You've created a complete feature following best practices.
