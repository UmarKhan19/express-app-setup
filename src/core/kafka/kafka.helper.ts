import { IKafkaEvent, IKafkaEventMetadata } from './kafka.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a Kafka event with metadata
 */
export function createKafkaEvent<T>(
  eventType: string,
  data: T,
  source: string = 'backend-app'
): IKafkaEvent<T> {
  const metadata: IKafkaEventMetadata = {
    eventId: uuidv4(),
    eventType,
    timestamp: new Date().toISOString(),
    version: '1.0',
    source,
  };

  return {
    metadata,
    data,
  };
}

/**
 * Parse a Kafka event from JSON string
 */
export function parseKafkaEvent<T>(jsonString: string): IKafkaEvent<T> {
  return JSON.parse(jsonString) as IKafkaEvent<T>;
}

/**
 * Serialize a Kafka event to JSON string
 */
export function serializeKafkaEvent<T>(event: IKafkaEvent<T>): string {
  return JSON.stringify(event);
}

/**
 * Create a message key from an ID
 */
export function createMessageKey(prefix: string, id: string | number): string {
  return `${prefix}:${id}`;
}

/**
 * Extract entity ID from message key
 */
export function extractIdFromKey(key: string): string {
  const parts = key.split(':');
  return parts[parts.length - 1] || key;
}

/**
 * Create Kafka headers
 */
export function createKafkaHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return headers;
}

/**
 * Validate Kafka event structure
 */
export function isValidKafkaEvent<T>(obj: unknown): obj is IKafkaEvent<T> {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const event = obj as IKafkaEvent<T>;

  return (
    event.metadata !== undefined &&
    typeof event.metadata === 'object' &&
    'eventId' in event.metadata &&
    'eventType' in event.metadata &&
    'timestamp' in event.metadata &&
    'version' in event.metadata &&
    'source' in event.metadata &&
    'data' in event
  );
}
