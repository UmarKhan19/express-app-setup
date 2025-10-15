# Troubleshooting Guide

> **Solutions to common problems**

## Table of Contents

- [Application Issues](#application-issues)
- [Database Issues](#database-issues)
- [Cache Issues](#cache-issues)
- [Queue Issues](#queue-issues)
- [Kafka Issues](#kafka-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

## Application Issues

### Server Won't Start

**Problem**: Application crashes on startup

**Solutions**:

1. Check environment variables:

```bash
cat .env
```

2. Check logs:

```bash
tail -f logs/error.log
```

3. Verify dependencies:

```bash
npm ci
```

4. Check port availability:

```bash
lsof -i :3000
```

### High Memory Usage

**Problem**: Application using too much memory

**Solutions**:

1. Check for memory leaks:

```typescript
// Enable Node.js memory profiling
node --max-old-space-size=4096 --inspect dist/server.js
```

2. Monitor with Prometheus:

```promql
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100
```

3. Restart application:

```bash
pm2 restart app
```

### Request Timeout

**Problem**: Requests timing out

**Solutions**:

1. Increase timeout:

```typescript
server.setTimeout(120000); // 2 minutes
```

2. Check database queries:

```typescript
mongoose.set('debug', true);
```

3. Add indexes to MongoDB collections

## Database Issues

### Connection Failed

**Problem**: Cannot connect to MongoDB

**Solutions**:

1. Verify MongoDB is running:

```bash
docker-compose ps mongodb
```

2. Check connection string:

```bash
echo $MONGODB_URI
```

3. Test connection:

```bash
mongosh $MONGODB_URI
```

4. Check network:

```bash
docker network inspect app-network
```

### Slow Queries

**Problem**: Database queries are slow

**Solutions**:

1. Check query execution:

```javascript
db.users.find({ email: 'test@example.com' }).explain('executionStats');
```

2. Add indexes:

```javascript
db.users.createIndex({ email: 1 });
```

3. Use projection to limit fields:

```typescript
User.find().select('name email');
```

### Disk Space Full

**Problem**: MongoDB disk space full

**Solutions**:

1. Check disk usage:

```bash
df -h
```

2. Clean up old data:

```javascript
db.logs.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
});
```

3. Enable compression:

```yaml
# mongod.conf
storage:
  wiredTiger:
    engineConfig:
      journalCompressor: snappy
```

## Cache Issues

### Redis Connection Failed

**Problem**: Cannot connect to Redis

**Solutions**:

1. Verify Redis is running:

```bash
docker-compose ps redis
redis-cli ping
```

2. Check password:

```bash
redis-cli -a $REDIS_PASSWORD ping
```

3. Fallback to no-cache mode (graceful degradation)

### Cache Not Working

**Problem**: Cache hit rate is 0%

**Solutions**:

1. Check cache service:

```typescript
const value = await cacheService.get('test');
await cacheService.set('test', 'value', 60);
```

2. Verify Redis memory:

```bash
redis-cli INFO memory
```

3. Check TTL settings:

```typescript
// Ensure TTL is set
await cache.set(key, value, 3600); // 1 hour
```

## Queue Issues

### Jobs Not Processing

**Problem**: Queue jobs stuck in waiting

**Solutions**:

1. Check workers:

```bash
ps aux | grep "bull"
```

2. Restart queue workers:

```bash
npm run queue:restart
```

3. Check Redis connection:

```bash
redis-cli LLEN bull:email:wait
```

4. View failed jobs:

```typescript
const failed = await emailQueue.getFailed();
console.log(failed);
```

### Queue Memory Leak

**Problem**: Queue consuming too much memory

**Solutions**:

1. Limit job data size
2. Clean completed jobs:

```typescript
await queue.clean(24 * 3600 * 1000, 'completed');
```

3. Reduce concurrency:

```typescript
processor.process('email', { concurrency: 5 }, handler);
```

## Kafka Issues

### Consumer Not Receiving Messages

**Problem**: Kafka consumer not processing messages

**Solutions**:

1. Check consumer group:

```bash
kafka-consumer-groups --bootstrap-server localhost:9092 --group myapp --describe
```

2. Reset offset:

```bash
kafka-consumer-groups --bootstrap-server localhost:9092 --group myapp --reset-offsets --to-earliest --execute --topic user.created
```

3. Check consumer status:

```typescript
await consumer.connect();
console.log(consumer.assignment());
```

### Messages Lost

**Problem**: Messages not being delivered

**Solutions**:

1. Enable producer acknowledgments:

```typescript
await producer.send({
  topic: 'user.created',
  messages: [{ value: JSON.stringify(data) }],
  acks: -1, // Wait for all replicas
});
```

2. Check retention:

```bash
kafka-topics --bootstrap-server localhost:9092 --describe --topic user.created
```

## Performance Issues

### High CPU Usage

**Problem**: Application using 100% CPU

**Solutions**:

1. Profile application:

```bash
node --prof dist/server.js
node --prof-process isolate-*-v8.log > processed.txt
```

2. Check event loop:

```promql
nodejs_eventloop_lag_seconds > 0.1
```

3. Optimize queries and algorithms

### High Latency

**Problem**: Response time > 1 second

**Solutions**:

1. Check metrics:

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

2. Add caching:

```typescript
const cached = await cache.get(key);
if (cached) return cached;
```

3. Optimize database queries with indexes

4. Use pagination:

```typescript
User.find()
  .limit(20)
  .skip(page * 20);
```

## Deployment Issues

### Container Won't Start

**Problem**: Docker container crashes on startup

**Solutions**:

1. Check logs:

```bash
docker-compose logs app
```

2. Inspect container:

```bash
docker inspect myapp
```

3. Check health:

```bash
docker ps --filter health=unhealthy
```

### Out of Memory (OOM)

**Problem**: Container killed by OOM

**Solutions**:

1. Increase memory limit:

```yaml
deploy:
  resources:
    limits:
      memory: 4G
```

2. Check for memory leaks
3. Enable garbage collection logs:

```bash
node --expose-gc --max-old-space-size=4096 dist/server.js
```

## General Debugging

### Enable Debug Logs

```bash
LOG_LEVEL=debug npm run dev
```

### Use Debugger

```bash
node --inspect dist/server.js
# Open chrome://inspect
```

### Check Health Endpoints

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/db
curl http://localhost:3000/health/cache
```

## Getting Help

1. Check logs: `logs/error.log`
2. Check metrics: Grafana dashboard
3. Review documentation
4. Search GitHub issues
5. Contact team

Related: [FAQ](FAQ.md) | [Performance Guide](PERFORMANCE.md)
