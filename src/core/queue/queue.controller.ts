import { Request, Response, NextFunction } from 'express';
import { queueService } from '@/core/queue';
import { ResponseUtil } from '@/common/utils';
import httpStatus from 'http-status';

/**
 * Queue controller for queue management and monitoring
 */
export class QueueController {
  /**
   * Get all queues with their statistics
   */
  async getAllQueues(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queues = queueService.getQueues();
      const queueStats = await Promise.all(
        queues.map(async (queue) => {
          const stats = await queueService.getQueueStats(queue.name);
          return {
            name: queue.name,
            stats,
          };
        })
      );

      res
        .status(httpStatus.OK)
        .json(
          ResponseUtil.success(queueStats, 'Queues retrieved successfully')
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics for a specific queue
   */
  async getQueueStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { queueName } = req.params;
      const stats = await queueService.getQueueStats(queueName);

      res
        .status(httpStatus.OK)
        .json(
          ResponseUtil.success(
            { name: queueName, stats },
            'Queue statistics retrieved successfully'
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { queueName } = req.params;
      await queueService.pauseQueue(queueName);

      res
        .status(httpStatus.OK)
        .json(
          ResponseUtil.success(null, `Queue ${queueName} paused successfully`)
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { queueName } = req.params;
      await queueService.resumeQueue(queueName);

      res
        .status(httpStatus.OK)
        .json(
          ResponseUtil.success(null, `Queue ${queueName} resumed successfully`)
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { queueName } = req.params;
      const { grace = 3600000, limit = 100, type = 'completed' } = req.query;

      const cleaned = await queueService.cleanQueue(
        queueName,
        Number(grace),
        Number(limit),
        type as 'completed' | 'failed'
      );

      res
        .status(httpStatus.OK)
        .json(
          ResponseUtil.success(
            { cleaned: cleaned.length },
            `Cleaned ${cleaned.length} jobs from queue ${queueName}`
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a test job to a queue
   */
  async addTestJob(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { queueName } = req.params;
      const { jobName, data, options } = req.body;

      // Validate required fields
      if (!jobName) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json(ResponseUtil.error('Job name is required'));
        return;
      }

      if (!data) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json(ResponseUtil.error('Job data is required'));
        return;
      }

      const job = await queueService.addJob(queueName, jobName, data, options);

      res
        .status(httpStatus.CREATED)
        .json(
          ResponseUtil.success(
            { jobId: job.id, queueName, jobName },
            'Job added successfully'
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const isConnected = queueService.isConnected();
      const queues = queueService.getQueues();

      const health = {
        connected: isConnected,
        queuesCount: queues.length,
        queues: queues.map((q) => q.name),
      };

      res
        .status(httpStatus.OK)
        .json(ResponseUtil.success(health, 'Queue health status retrieved'));
    } catch (error) {
      next(error);
    }
  }
}

export default new QueueController();
