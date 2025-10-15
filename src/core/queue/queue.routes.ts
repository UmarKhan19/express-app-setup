import { Router } from 'express';
import queueController from './queue.controller';

const router = Router();

/**
 * @route GET /api/v1/queues/health
 * @desc Get queue health status
 * @access Public
 */
router.get('/health', queueController.getQueueHealth.bind(queueController));

/**
 * @route GET /api/v1/queues
 * @desc Get all queues with statistics
 * @access Private (should be protected in production)
 */
router.get('/', queueController.getAllQueues.bind(queueController));

/**
 * @route GET /api/v1/queues/:queueName
 * @desc Get statistics for a specific queue
 * @access Private
 */
router.get('/:queueName', queueController.getQueueStats.bind(queueController));

/**
 * @route POST /api/v1/queues/:queueName/pause
 * @desc Pause a queue
 * @access Private
 */
router.post(
  '/:queueName/pause',
  queueController.pauseQueue.bind(queueController)
);

/**
 * @route POST /api/v1/queues/:queueName/resume
 * @desc Resume a queue
 * @access Private
 */
router.post(
  '/:queueName/resume',
  queueController.resumeQueue.bind(queueController)
);

/**
 * @route POST /api/v1/queues/:queueName/clean
 * @desc Clean old jobs from a queue
 * @access Private
 */
router.post(
  '/:queueName/clean',
  queueController.cleanQueue.bind(queueController)
);

/**
 * @route POST /api/v1/queues/:queueName/jobs
 * @desc Add a test job to a queue
 * @access Private
 */
router.post(
  '/:queueName/jobs',
  queueController.addTestJob.bind(queueController)
);

export default router;
