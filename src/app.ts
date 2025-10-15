import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import config from '@/config';
import {
  errorConverter,
  errorHandler,
  notFoundHandler,
  requestLogger,
  metricsMiddleware,
} from '@/core/middlewares';
import { metricsService } from '@/core/observability';
import { cacheService } from '@/core/cache';
import { queueService } from '@/core/queue';
import { emailService } from '@/core/email';
import { kafkaService } from '@/core/kafka';
import routes from './routes';

const createApp = (): Application => {
  const app: Application = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors(config.cors));

  // Request logging
  app.use(requestLogger);

  // Metrics middleware
  app.use(metricsMiddleware);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Gzip compression
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api', limiter);

  // Metrics endpoint for Prometheus
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', 'text/plain');
      const metrics = await metricsService.getMetrics();
      res.send(metrics);
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  });

  // Liveness probe - checks if the application is alive
  app.get('/liveness', (_req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  // Readiness probe - checks if the application is ready to serve requests
  app.get('/readiness', async (_req, res) => {
    const checks = {
      database: true,
      cache: !config.redis.enabled || cacheService.isConnected(),
      queue: !config.queue.enabled || queueService.isConnected(),
      kafka: !config.kafka.enabled || kafkaService.isConnected(),
    };

    const allChecksPass = Object.values(checks).every((check) => check);

    if (allChecksPass) {
      res.status(200).json({ status: 'ready', checks });
    } else {
      res.status(503).json({ status: 'not ready', checks });
    }
  });

  // Health check endpoint - detailed health information
  app.get('/health', async (_req, res) => {
    const health = {
      status: 'success',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        cache: config.redis.enabled
          ? cacheService.isConnected()
            ? 'connected'
            : 'disconnected'
          : 'disabled',
        queue: config.queue.enabled
          ? queueService.isConnected()
            ? 'connected'
            : 'disconnected'
          : 'disabled',
        kafka: config.kafka.enabled
          ? kafkaService.isConnected()
            ? 'connected'
            : 'disconnected'
          : 'disabled',
        email: {
          provider: emailService.getProviderName(),
          configured: emailService.isConfigured(),
        },
      },
    };

    res.status(200).json(health);
  });

  // API routes
  app.use(`/api/${config.apiVersion}`, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling
  app.use(errorConverter);
  app.use(errorHandler);

  return app;
};

export default createApp;
