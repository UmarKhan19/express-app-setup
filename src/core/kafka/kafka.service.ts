import { Producer, Consumer, Admin, EachMessagePayload } from 'kafkajs';
import kafkaClient from './kafka';
import config from '@/config';
import logger from '@/common/utils/logger.util';
import {
  IKafkaService,
  IKafkaMessage,
  IKafkaConsumerConfig,
} from './kafka.interface';
import { v4 as uuidv4 } from 'uuid';
import {
  trackKafkaProduction,
  trackKafkaConsumption,
  trackKafkaError,
} from '@/core/observability';

/**
 * Kafka service implementation
 * Manages producers, consumers, and admin operations
 */
class KafkaService implements IKafkaService {
  private producer: Producer | null = null;
  private admin: Admin | null = null;
  private consumers = new Map<string, Consumer>();

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    if (!config.kafka.enabled) {
      logger.info('Kafka is disabled');
      return;
    }

    try {
      const kafka = kafkaClient.getClient();

      // Create and connect producer
      this.producer = kafka.producer({
        allowAutoTopicCreation: config.kafka.producer.allowAutoTopicCreation,
        transactionTimeout: config.kafka.producer.transactionTimeout,
        idempotent: config.kafka.producer.idempotent,
        maxInFlightRequests: config.kafka.producer.maxInFlightRequests,
      });

      await this.producer.connect();
      logger.info('Kafka producer connected');

      // Create and connect admin
      this.admin = kafka.admin();
      await this.admin.connect();
      logger.info('Kafka admin connected');

      kafkaClient.setConnected(true);
      logger.info('Kafka service connected successfully');
    } catch (error) {
      // Clean up on connection failure
      if (this.producer) {
        try {
          await this.producer.disconnect();
        } catch (disconnectError) {
          logger.error(
            'Error disconnecting producer after failed connection:',
            disconnectError
          );
        }
        this.producer = null;
      }

      if (this.admin) {
        try {
          await this.admin.disconnect();
        } catch (disconnectError) {
          logger.error(
            'Error disconnecting admin after failed connection:',
            disconnectError
          );
        }
        this.admin = null;
      }

      kafkaClient.setConnected(false);
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (!config.kafka.enabled || !kafkaClient.isConnected()) {
      return;
    }

    try {
      // Disconnect all consumers
      for (const [name, consumer] of this.consumers) {
        logger.info(`Disconnecting consumer: ${name}`);
        await consumer.disconnect().catch((error) => {
          logger.error(`Error disconnecting consumer ${name}:`, error);
        });
      }
      this.consumers.clear();

      // Disconnect admin
      if (this.admin) {
        await this.admin.disconnect();
        logger.info('Kafka admin disconnected');
      }

      // Disconnect producer
      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }

      kafkaClient.setConnected(false);
      logger.info('Kafka service disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return kafkaClient.isConnected();
  }

  /**
   * Get producer instance
   */
  getProducer(): Producer | null {
    return this.producer;
  }

  /**
   * Get admin instance
   */
  getAdmin(): Admin | null {
    return this.admin;
  }

  /**
   * Produce a message to a topic
   */
  async produce<T = unknown>(
    topic: string,
    message: IKafkaMessage<T>
  ): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer is not initialized');
    }

    if (!kafkaClient.isConnected()) {
      throw new Error('Kafka is not connected');
    }

    if (!topic || topic.trim() === '') {
      throw new Error('Topic name is required');
    }

    if (message.value === undefined || message.value === null) {
      throw new Error('Message value is required');
    }

    try {
      const value =
        typeof message.value === 'string'
          ? message.value
          : JSON.stringify(message.value);

      await this.producer.send({
        topic,
        messages: [
          {
            key: message.key,
            value,
            headers: message.headers,
            partition: message.partition,
            timestamp: message.timestamp,
          },
        ],
      });

      trackKafkaProduction(topic);

      logger.debug('Message produced to Kafka', {
        topic,
        key: message.key,
      });
    } catch (error) {
      trackKafkaError(topic, 'produce');
      logger.error('Error producing message to Kafka:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        topic,
        key: message.key,
      });
      throw error;
    }
  }

  /**
   * Produce multiple messages to a topic
   */
  async produceBatch<T = unknown>(
    topic: string,
    messages: IKafkaMessage<T>[]
  ): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer is not initialized');
    }

    if (!kafkaClient.isConnected()) {
      throw new Error('Kafka is not connected');
    }

    if (!topic || topic.trim() === '') {
      throw new Error('Topic name is required');
    }

    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    try {
      const kafkaMessages = messages.map((message) => {
        if (message.value === undefined || message.value === null) {
          throw new Error('Message value is required for all messages');
        }

        return {
          key: message.key,
          value:
            typeof message.value === 'string'
              ? message.value
              : JSON.stringify(message.value),
          headers: message.headers,
          partition: message.partition,
          timestamp: message.timestamp,
        };
      });

      await this.producer.send({
        topic,
        messages: kafkaMessages,
      });

      // Track each produced message
      messages.forEach(() => trackKafkaProduction(topic));

      logger.debug('Batch of messages produced to Kafka', {
        topic,
        count: messages.length,
      });
    } catch (error) {
      trackKafkaError(topic, 'produce_batch');
      logger.error('Error producing batch messages to Kafka:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        topic,
        count: messages.length,
      });
      throw error;
    }
  }

  /**
   * Register a consumer
   */
  async registerConsumer(
    name: string,
    consumerConfig: IKafkaConsumerConfig,
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    if (!config.kafka.enabled) {
      logger.info(`Kafka is disabled, consumer ${name} not registered`);
      return;
    }

    if (!name || name.trim() === '') {
      throw new Error('Consumer name is required');
    }

    if (!consumerConfig.groupId || consumerConfig.groupId.trim() === '') {
      throw new Error('Consumer group ID is required');
    }

    if (!consumerConfig.topics || consumerConfig.topics.length === 0) {
      throw new Error('Consumer topics array cannot be empty');
    }

    if (!handler || typeof handler !== 'function') {
      throw new Error('Consumer handler must be a function');
    }

    // Check if consumer already registered
    if (this.consumers.has(name)) {
      logger.warn(`Consumer ${name} is already registered`);
      return;
    }

    try {
      const kafka = kafkaClient.getClient();
      const consumer = kafka.consumer({
        groupId: consumerConfig.groupId,
        sessionTimeout: config.kafka.consumer.sessionTimeout,
        rebalanceTimeout: config.kafka.consumer.rebalanceTimeout,
        heartbeatInterval: config.kafka.consumer.heartbeatInterval,
        allowAutoTopicCreation: config.kafka.consumer.allowAutoTopicCreation,
        maxBytesPerPartition: config.kafka.consumer.maxBytesPerPartition,
        maxWaitTimeInMs: config.kafka.consumer.maxWaitTimeInMs,
      });

      // Connect consumer
      await consumer.connect();

      // Subscribe to topics
      for (const topic of consumerConfig.topics) {
        if (typeof topic === 'string') {
          await consumer.subscribe({
            topic,
            fromBeginning: consumerConfig.fromBeginning ?? false,
          });
        } else {
          // RegExp
          await consumer.subscribe({
            topic,
            fromBeginning: consumerConfig.fromBeginning ?? false,
          });
        }
      }

      // Run consumer
      await consumer.run({
        autoCommit: consumerConfig.autoCommit ?? true,
        autoCommitInterval: consumerConfig.autoCommitInterval,
        autoCommitThreshold: consumerConfig.autoCommitThreshold,
        partitionsConsumedConcurrently:
          consumerConfig.partitionsConsumedConcurrently ?? 1,
        eachMessage: async (payload: EachMessagePayload) => {
          try {
            trackKafkaConsumption(payload.topic, consumerConfig.groupId);
            await handler(payload);
          } catch (error) {
            trackKafkaError(payload.topic, 'consume');
            logger.error(`Error in consumer ${name} handler:`, {
              error,
              topic: payload.topic,
              partition: payload.partition,
              offset: payload.message.offset,
            });
            // Let the error propagate so Kafka can handle retries
            throw error;
          }
        },
      });

      this.consumers.set(name, consumer);
      logger.info(`Consumer ${name} registered and running`, {
        groupId: consumerConfig.groupId,
        topics: consumerConfig.topics,
      });
    } catch (error) {
      logger.error(`Error registering consumer ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get a consumer by name
   */
  getConsumer(name: string): Consumer | undefined {
    return this.consumers.get(name);
  }

  /**
   * Stop a consumer
   */
  async stopConsumer(name: string): Promise<void> {
    const consumer = this.consumers.get(name);

    if (!consumer) {
      logger.warn(`Consumer ${name} not found`);
      return;
    }

    try {
      await consumer.disconnect();
      this.consumers.delete(name);
      logger.info(`Consumer ${name} stopped`);
    } catch (error) {
      logger.error(`Error stopping consumer ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create topics
   */
  async createTopics(
    topics: Array<{ topic: string; numPartitions?: number }>
  ): Promise<void> {
    if (!this.admin) {
      throw new Error('Kafka admin is not initialized');
    }

    if (!topics || topics.length === 0) {
      throw new Error('Topics array cannot be empty');
    }

    // Validate topic names
    for (const topic of topics) {
      if (!topic.topic || topic.topic.trim() === '') {
        throw new Error('Topic name cannot be empty');
      }
      if (topic.numPartitions !== undefined && topic.numPartitions < 1) {
        throw new Error('Number of partitions must be at least 1');
      }
    }

    try {
      await this.admin.createTopics({
        topics: topics.map((t) => ({
          topic: t.topic,
          numPartitions: t.numPartitions ?? 1,
          replicationFactor: 1,
        })),
      });

      logger.info('Topics created successfully', {
        topics: topics.map((t) => t.topic),
      });
    } catch (error) {
      logger.error('Error creating topics:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        topics: topics.map((t) => t.topic),
      });
      throw error;
    }
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<string[]> {
    if (!this.admin) {
      throw new Error('Kafka admin is not initialized');
    }

    try {
      const topics = await this.admin.listTopics();
      return topics;
    } catch (error) {
      logger.error('Error listing topics:', error);
      throw error;
    }
  }

  /**
   * Delete topics
   */
  async deleteTopics(topics: string[]): Promise<void> {
    if (!this.admin) {
      throw new Error('Kafka admin is not initialized');
    }

    if (!topics || topics.length === 0) {
      throw new Error('Topics array cannot be empty');
    }

    // Validate topic names
    for (const topic of topics) {
      if (!topic || topic.trim() === '') {
        throw new Error('Topic name cannot be empty');
      }
    }

    try {
      await this.admin.deleteTopics({
        topics,
      });

      logger.info('Topics deleted successfully', { topics });
    } catch (error) {
      logger.error('Error deleting topics:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        topics,
      });
      throw error;
    }
  }

  /**
   * Helper method to create an event with metadata
   */
  createEvent<T>(
    eventType: string,
    data: T,
    source: string = config.kafka.clientId
  ) {
    return {
      metadata: {
        eventId: uuidv4(),
        eventType,
        timestamp: new Date().toISOString(),
        version: '1.0',
        source,
      },
      data,
    };
  }
}

export default new KafkaService();
