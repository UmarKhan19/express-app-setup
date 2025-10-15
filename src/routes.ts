import { Router } from 'express';
import { userRoutes } from '@/features/user';
import { cacheService } from '@/core/cache';
import queueRoutes from '@/core/queue/queue.routes';
import kafkaRoutes from '@/core/kafka/kafka.routes';
import config from '@/config';

const router = Router();

// API status route
router.get('/status', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working',
    version: '1.0.0',
  });
});

// Cache statistics route
router.get('/cache/stats', async (_req, res) => {
  if (!config.redis.enabled) {
    return res.status(200).json({
      status: 'success',
      message: 'Cache is disabled',
      enabled: false,
    });
  }

  const stats = await cacheService.getStats();

  return res.status(200).json({
    status: 'success',
    enabled: true,
    connected: cacheService.isConnected(),
    stats,
  });
});

// Feature routes
router.use('/users', userRoutes);

// Queue routes
router.use('/queues', queueRoutes);

// Kafka routes
router.use('/kafka', kafkaRoutes);

export default router;
