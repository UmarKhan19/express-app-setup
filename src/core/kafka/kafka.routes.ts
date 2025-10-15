import { Router, Request, Response } from 'express';
import kafkaService from './kafka.service';
import consumerRegistry from './consumer.registry';
import config from '@/config';
import logger from '@/common/utils/logger.util';

const router = Router();

/**
 * Kafka health check
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    if (!config.kafka.enabled) {
      return res.status(200).json({
        status: 'success',
        message: 'Kafka is disabled',
        enabled: false,
      });
    }

    const isConnected = kafkaService.isConnected();
    const consumers = consumerRegistry.getAll();

    return res.status(200).json({
      status: 'success',
      enabled: true,
      connected: isConnected,
      consumers: consumers.map((c) => ({
        name: c.name,
        topics: c.topics,
        groupId: c.groupId,
      })),
    });
  } catch (error) {
    logger.error('Error checking Kafka health:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to check Kafka health',
    });
  }
});

/**
 * List all topics
 */
router.get('/topics', async (_req: Request, res: Response) => {
  try {
    if (!kafkaService.isConnected()) {
      return res.status(503).json({
        status: 'error',
        message: 'Kafka is not connected',
      });
    }

    const topics = await kafkaService.listTopics();

    return res.status(200).json({
      status: 'success',
      topics,
    });
  } catch (error) {
    logger.error('Error listing topics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to list topics',
    });
  }
});

/**
 * Create topics
 */
router.post('/topics', async (req: Request, res: Response) => {
  try {
    if (!kafkaService.isConnected()) {
      return res.status(503).json({
        status: 'error',
        message: 'Kafka is not connected',
      });
    }

    const { topics } = req.body;

    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        status: 'error',
        message: 'Topics array is required',
      });
    }

    await kafkaService.createTopics(topics);

    return res.status(201).json({
      status: 'success',
      message: 'Topics created successfully',
      topics,
    });
  } catch (error) {
    logger.error('Error creating topics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create topics',
    });
  }
});

/**
 * Delete topics
 */
router.delete('/topics', async (req: Request, res: Response) => {
  try {
    if (!kafkaService.isConnected()) {
      return res.status(503).json({
        status: 'error',
        message: 'Kafka is not connected',
      });
    }

    const { topics } = req.body;

    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        status: 'error',
        message: 'Topics array is required',
      });
    }

    await kafkaService.deleteTopics(topics);

    return res.status(200).json({
      status: 'success',
      message: 'Topics deleted successfully',
      topics,
    });
  } catch (error) {
    logger.error('Error deleting topics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete topics',
    });
  }
});

/**
 * Test produce a message
 */
router.post('/produce', async (req: Request, res: Response) => {
  try {
    if (!kafkaService.isConnected()) {
      return res.status(503).json({
        status: 'error',
        message: 'Kafka is not connected',
      });
    }

    const { topic, message, key } = req.body;

    if (!topic || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Topic and message are required',
      });
    }

    const event = kafkaService.createEvent('test.event', message);

    await kafkaService.produce(topic, {
      key: key || undefined,
      value: event,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Message produced successfully',
      eventId: event.metadata.eventId,
    });
  } catch (error) {
    logger.error('Error producing message:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to produce message',
    });
  }
});

export default router;
