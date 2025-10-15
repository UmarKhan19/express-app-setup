import { Producer, Consumer, Admin, EachMessagePayload } from 'kafkajs';

/**
 * Kafka message structure
 */
export interface IKafkaMessage<T = unknown> {
  key?: string;
  value: T;
  headers?: Record<string, string>;
  partition?: number;
  timestamp?: string;
}

/**
 * Kafka producer options for sending messages
 */
export interface IKafkaProducerOptions {
  topic: string;
  messages: Array<{
    key?: string;
    value: string | Buffer;
    headers?: Record<string, string>;
    partition?: number;
  }>;
  acks?: number;
  timeout?: number;
  compression?: number;
}

/**
 * Kafka consumer configuration
 */
export interface IKafkaConsumerConfig {
  groupId: string;
  topics: string[] | RegExp[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
  autoCommitInterval?: number;
  autoCommitThreshold?: number;
  partitionsConsumedConcurrently?: number;
}

/**
 * Kafka service interface
 */
export interface IKafkaService {
  /**
   * Connect to Kafka
   */
  connect(): Promise<void>;

  /**
   * Disconnect from Kafka
   */
  disconnect(): Promise<void>;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Get producer instance
   */
  getProducer(): Producer | null;

  /**
   * Get admin instance
   */
  getAdmin(): Admin | null;

  /**
   * Produce a message to a topic
   */
  produce<T = unknown>(topic: string, message: IKafkaMessage<T>): Promise<void>;

  /**
   * Produce multiple messages to a topic
   */
  produceBatch<T = unknown>(
    topic: string,
    messages: IKafkaMessage<T>[]
  ): Promise<void>;

  /**
   * Register a consumer
   */
  registerConsumer(
    name: string,
    config: IKafkaConsumerConfig,
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void>;

  /**
   * Get a consumer by name
   */
  getConsumer(name: string): Consumer | undefined;

  /**
   * Stop a consumer
   */
  stopConsumer(name: string): Promise<void>;

  /**
   * Create topics
   */
  createTopics(
    topics: Array<{ topic: string; numPartitions?: number }>
  ): Promise<void>;

  /**
   * List all topics
   */
  listTopics(): Promise<string[]>;

  /**
   * Delete topics
   */
  deleteTopics(topics: string[]): Promise<void>;
}

/**
 * Base consumer interface
 */
export interface IBaseKafkaConsumer {
  /**
   * Consumer name/identifier
   */
  name: string;

  /**
   * Topics to subscribe to
   */
  topics: string[] | RegExp[];

  /**
   * Consumer group ID
   */
  groupId: string;

  /**
   * Whether to start from the beginning
   */
  fromBeginning?: boolean;

  /**
   * Initialize the consumer
   */
  initialize(): Promise<void>;

  /**
   * Process a message
   */
  processMessage(payload: EachMessagePayload): Promise<void>;

  /**
   * Handle errors
   */
  handleError(error: Error, payload?: EachMessagePayload): Promise<void>;

  /**
   * Stop the consumer
   */
  stop(): Promise<void>;
}

/**
 * Kafka event metadata
 */
export interface IKafkaEventMetadata {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  source: string;
}

/**
 * Kafka event wrapper
 */
export interface IKafkaEvent<T = unknown> {
  metadata: IKafkaEventMetadata;
  data: T;
}

/**
 * Topic statistics
 */
export interface ITopicStats {
  topic: string;
  partitions: number;
  replicas: number;
  configs: Record<string, string>;
}

/**
 * Consumer group statistics
 */
export interface IConsumerGroupStats {
  groupId: string;
  state: string;
  members: Array<{
    memberId: string;
    clientId: string;
    host: string;
  }>;
}
