# API Reference

Complete API documentation for all available endpoints.

## 📋 Base Information

- **Base URL**: `http://localhost:3000`
- **API Version**: `v1`
- **API Prefix**: `/api/v1`
- **Content-Type**: `application/json`
- **Rate Limit**: 100 requests per 15 minutes per IP

## 🏥 Health & Monitoring Endpoints

### GET /health

Detailed health check with service status.

**Response**:

```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2025-10-14T10:30:00.000Z",
  "uptime": 12345,
  "services": {
    "database": "connected",
    "cache": "connected",
    "queue": "connected",
    "kafka": "connected",
    "email": {
      "provider": "maildev",
      "configured": true
    }
  }
}
```

### GET /liveness

Kubernetes liveness probe.

**Response**: `200 OK`

```json
{
  "status": "alive"
}
```

### GET /readiness

Kubernetes readiness probe.

**Response**: `200 OK` or `503 Service Unavailable`

```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "cache": true,
    "queue": true,
    "kafka": true
  }
}
```

### GET /metrics

Prometheus metrics endpoint.

**Response**: Plain text metrics

```
# HELP backend_app_http_requests_total Total number of HTTP requests
# TYPE backend_app_http_requests_total counter
backend_app_http_requests_total{method="GET",route="/api/v1/users",status_code="200"} 42
```

## 📊 API Status Endpoints

### GET /api/v1/status

API status and version.

**Response**:

```json
{
  "status": "success",
  "message": "API is working",
  "version": "1.0.0"
}
```

### GET /api/v1/cache/stats

Cache statistics (if Redis enabled).

**Response**:

```json
{
  "status": "success",
  "enabled": true,
  "connected": true,
  "stats": {
    "hits": 1250,
    "misses": 350,
    "hitRate": 0.78,
    "keys": 523
  }
}
```

## 👤 User Endpoints

### POST /api/v1/users

Create a new user.

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Validation**:

- `name`: String, 2-100 characters, required
- `email`: Valid email, required, unique
- `age`: Number, 1-150, required

**Success Response**: `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "createdAt": "2025-10-14T10:30:00.000Z",
  "updatedAt": "2025-10-14T10:30:00.000Z"
}
```

**Error Responses**:

- `400 Bad Request` - Validation error
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

**Side Effects**:

- Publishes `user.created` event to Kafka
- Queues welcome email (if queue enabled)
- Publishes audit log

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

---

### GET /api/v1/users

List all users with pagination.

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Request**:

```
GET /api/v1/users?page=1&limit=10
```

**Success Response**: `200 OK`

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "createdAt": "2025-10-14T10:30:00.000Z",
      "updatedAt": "2025-10-14T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalItems": 42,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**cURL Example**:

```bash
curl http://localhost:3000/api/v1/users?page=1&limit=10
```

---

### GET /api/v1/users/:id

Get user by ID.

**Parameters**:

- `id`: MongoDB ObjectId (24 hex characters)

**Success Response**: `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "createdAt": "2025-10-14T10:30:00.000Z",
  "updatedAt": "2025-10-14T10:30:00.000Z"
}
```

**Error Responses**:

- `400 Bad Request` - Invalid ID format
- `404 Not Found` - User not found

**cURL Example**:

```bash
curl http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011
```

---

### PUT /api/v1/users/:id

Update user by ID.

**Parameters**:

- `id`: MongoDB ObjectId

**Request Body** (all fields optional):

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 31
}
```

**Validation**:

- `name`: String, 2-100 characters (if provided)
- `email`: Valid email, unique (if provided)
- `age`: Number, 1-150 (if provided)

**Success Response**: `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 31,
  "createdAt": "2025-10-14T10:30:00.000Z",
  "updatedAt": "2025-10-14T10:35:00.000Z"
}
```

**Error Responses**:

- `400 Bad Request` - Validation error
- `404 Not Found` - User not found
- `409 Conflict` - Email already taken

**Side Effects**:

- Publishes `user.updated` event to Kafka
- Invalidates cache
- Publishes audit log

**cURL Example**:

```bash
curl -X PUT http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "age": 31
  }'
```

---

### DELETE /api/v1/users/:id

Delete user by ID.

**Parameters**:

- `id`: MongoDB ObjectId

**Success Response**: `204 No Content`

**Error Responses**:

- `400 Bad Request` - Invalid ID format
- `404 Not Found` - User not found

**Side Effects**:

- Publishes `user.deleted` event to Kafka
- Removes from cache
- Publishes audit log

**cURL Example**:

```bash
curl -X DELETE http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011
```

---

## 📬 Queue Management Endpoints

### GET /api/v1/queues

List all queues with statistics.

**Success Response**: `200 OK`

```json
{
  "queues": [
    {
      "name": "email",
      "waiting": 5,
      "active": 2,
      "completed": 1523,
      "failed": 12,
      "delayed": 0,
      "paused": false
    },
    {
      "name": "notification",
      "waiting": 0,
      "active": 0,
      "completed": 458,
      "failed": 3,
      "delayed": 0,
      "paused": false
    }
  ]
}
```

---

## 📡 Kafka Management Endpoints

### GET /api/v1/kafka/topics

List all Kafka topics.

**Success Response**: `200 OK`

```json
{
  "topics": ["user.events", "email.events", "audit.logs"]
}
```

---

## 🚫 Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "must be a valid email"
    }
  ]
}
```

### HTTP Status Codes

| Code    | Meaning               | When Used                        |
| ------- | --------------------- | -------------------------------- |
| **200** | OK                    | Successful GET/PUT request       |
| **201** | Created               | Successful POST request          |
| **204** | No Content            | Successful DELETE request        |
| **400** | Bad Request           | Validation error, invalid input  |
| **401** | Unauthorized          | Not authenticated (future)       |
| **403** | Forbidden             | Not authorized (future)          |
| **404** | Not Found             | Resource doesn't exist           |
| **409** | Conflict              | Duplicate resource (e.g., email) |
| **429** | Too Many Requests     | Rate limit exceeded              |
| **500** | Internal Server Error | Server error                     |
| **503** | Service Unavailable   | Service not ready                |

---

## 🔐 Authentication (Future)

Authentication endpoints will be added in future versions:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

---

## 📝 Request/Response Examples

### Postman Collection

Import this collection for testing:

```json
{
  "info": {
    "name": "Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Create User",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/v1/users",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"age\": 30\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## 🔄 Versioning

Current version: **v1**

API versioning is part of the URL: `/api/v1/...`

When breaking changes are introduced, a new version will be released (`v2`), and `v1` will be maintained for a deprecation period.

---

## 📈 Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

**Example Response when rate limited**:

```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","age":30}'

# Get all users
curl http://localhost:3000/api/v1/users

# Get specific user
curl http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011

# Update user
curl -X PUT http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete user
curl -X DELETE http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011
```

### Using HTTPie

```bash
# Create user
http POST localhost:3000/api/v1/users name="John" email="john@example.com" age:=30

# Get all users
http localhost:3000/api/v1/users

# Update user
http PUT localhost:3000/api/v1/users/507f1f77bcf86cd799439011 name="Jane"
```

---

## Further Reading

- [Getting Started](../getting-started/GETTING_STARTED.md)
- [Architecture](../architecture/ARCHITECTURE.md)
- [Development Guide](../development/README.md)
- [Error Handling](../development/ERROR_HANDLING.md)

---

**Questions?** See [FAQ](../guides/FAQ.md) or [Troubleshooting](../guides/TROUBLESHOOTING.md)
