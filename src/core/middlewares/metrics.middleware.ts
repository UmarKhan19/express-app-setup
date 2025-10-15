import { Request, Response, NextFunction } from 'express';
import metricsService from '../observability/metrics.service';

/**
 * Middleware to collect HTTP metrics
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Track request size
  const requestSize = parseInt(req.headers['content-length'] || '0', 10);
  const route = req.route?.path || req.path || 'unknown';

  // On response finish, record metrics
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const statusCode = res.statusCode.toString();
    const method = req.method;

    // Record HTTP metrics
    metricsService.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    metricsService.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );

    if (requestSize > 0) {
      metricsService.httpRequestSize.observe({ method, route }, requestSize);
    }

    // Track response size if available
    const responseSize = parseInt(
      res.getHeader('content-length')?.toString() || '0',
      10
    );
    if (responseSize > 0) {
      metricsService.httpResponseSize.observe({ method, route }, responseSize);
    }

    // Track API errors
    if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
      metricsService.apiErrors.inc({
        error_type: statusCode.startsWith('4')
          ? 'client_error'
          : 'server_error',
        endpoint: route,
      });
    }
  });

  next();
};
