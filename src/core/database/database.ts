import mongoose from 'mongoose';
import logger from '@/common/utils/logger.util';
import config from '@/config';
import { updateDbConnections } from '@/core/observability';

class Database {
  private static instance: Database;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    try {
      mongoose.set('strictQuery', false);

      await mongoose.connect(config.mongodb.uri, config.mongodb.options);

      logger.info('MongoDB connected successfully');

      // Update connection metrics
      updateDbConnections(1);

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        updateDbConnections(0);
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        updateDbConnections(1);
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      updateDbConnections(0);
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    if (config.env === 'test') {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  }

  getConnection(): typeof mongoose {
    return mongoose;
  }
}

export default Database.getInstance();
