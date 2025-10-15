// Core exports
export { default as kafkaClient } from './kafka';
export { default as kafkaService } from './kafka.service';
export { default as consumerRegistry } from './consumer.registry';
export { initializeKafkaConsumers, shutdownKafkaConsumers } from './kafka.init';
export { default as kafkaRoutes } from './kafka.routes';

// Registry utilities
export * from './kafka.registry';

// Base classes
export { BaseKafkaConsumer } from './base.consumer';

// Interfaces
export * from './kafka.interface';

// Helpers
export * from './kafka.helper';

// Consumers
export * from './consumers';
