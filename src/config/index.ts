import dotenv from 'dotenv';
import path from 'path';
import { Environment } from '@/common/enums';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      minPoolSize: number;
      socketTimeoutMS: number;
      serverSelectionTimeoutMS: number;
      family: number;
    };
  };
  redis: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    db: number;
    tls: boolean;
    maxRetries: number;
    connectTimeout: number;
    commandTimeout: number;
  };
  cache: {
    defaultTTL: number;
    prefix: string;
    ttlStrategies: {
      user: number;
      query: number;
    };
    enableMetrics: boolean;
  };
  queue: {
    enabled: boolean;
    db: number;
    defaultJobOptions: {
      attempts: number;
      backoff: {
        type: string;
        delay: number;
      };
      removeOnComplete: boolean | number;
      removeOnFail: boolean | number;
    };
    workerConcurrency: number;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
  };
  email: {
    provider: string;
    from: {
      name: string;
      email: string;
    };
    maildev: {
      host: string;
      port: number;
      secure: boolean;
    };
    resend: {
      apiKey: string;
    };
  };
  kafka: {
    enabled: boolean;
    clientId: string;
    brokers: string[];
    connectionTimeout: number;
    requestTimeout: number;
    retry: {
      maxRetryTime: number;
      initialRetryTime: number;
      factor: number;
      multiplier: number;
      retries: number;
    };
    producer: {
      allowAutoTopicCreation: boolean;
      transactionTimeout: number;
      idempotent: boolean;
      maxInFlightRequests: number;
    };
    consumer: {
      groupId: string;
      sessionTimeout: number;
      rebalanceTimeout: number;
      heartbeatInterval: number;
      allowAutoTopicCreation: boolean;
      maxBytesPerPartition: number;
      maxWaitTimeInMs: number;
    };
    topics: {
      userEvents: string;
      emailEvents: string;
      auditLogs: string;
    };
  };
  observability: {
    enabled: boolean;
    serviceName: string;
    serviceVersion: string;
    metricsPrefix: string;
    metricsExportInterval: number;
    tracingEnabled: boolean;
    tracingSampleRate: number;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || Environment.DEVELOPMENT,
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  mongodb: {
    uri:
      process.env.NODE_ENV === Environment.TEST
        ? process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test'
        : process.env.MONGODB_URI || 'mongodb://localhost:27017/backend',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // Use IPv4, skip trying IPv6
    },
  },
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: process.env.REDIS_TLS === 'true',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
  },
  cache: {
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10),
    prefix: process.env.CACHE_PREFIX || 'app',
    ttlStrategies: {
      user: parseInt(process.env.CACHE_USER_TTL || '1800', 10),
      query: parseInt(process.env.CACHE_QUERY_TTL || '300', 10),
    },
    enableMetrics: process.env.CACHE_ENABLE_METRICS === 'true',
  },
  queue: {
    enabled: process.env.QUEUE_ENABLED === 'true',
    db: parseInt(process.env.QUEUE_REDIS_DB || '1', 10),
    defaultJobOptions: {
      attempts: parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10),
      backoff: {
        type: process.env.QUEUE_BACKOFF_TYPE || 'exponential',
        delay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '2000', 10),
      },
      removeOnComplete:
        process.env.QUEUE_REMOVE_ON_COMPLETE === 'false'
          ? false
          : parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '100', 10),
      removeOnFail:
        process.env.QUEUE_REMOVE_ON_FAIL === 'false'
          ? false
          : parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '50', 10),
    },
    workerConcurrency: parseInt(
      process.env.QUEUE_WORKER_CONCURRENCY || '5',
      10
    ),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'maildev',
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Application',
      email: process.env.EMAIL_FROM_EMAIL || 'noreply@example.com',
    },
    maildev: {
      host: process.env.MAILDEV_HOST || 'localhost',
      port: parseInt(process.env.MAILDEV_PORT || '1025', 10),
      secure: false,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY || '',
    },
  },
  kafka: {
    enabled: process.env.KAFKA_ENABLED === 'true',
    clientId: process.env.KAFKA_CLIENT_ID || 'backend-app',
    brokers: process.env.KAFKA_BROKERS
      ? process.env.KAFKA_BROKERS.split(',')
      : ['localhost:9092'],
    connectionTimeout: parseInt(
      process.env.KAFKA_CONNECTION_TIMEOUT || '10000',
      10
    ),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000', 10),
    retry: {
      maxRetryTime: parseInt(
        process.env.KAFKA_RETRY_MAX_RETRY_TIME || '30000',
        10
      ),
      initialRetryTime: parseInt(
        process.env.KAFKA_RETRY_INITIAL_RETRY_TIME || '300',
        10
      ),
      factor: parseFloat(process.env.KAFKA_RETRY_FACTOR || '0.2'),
      multiplier: parseFloat(process.env.KAFKA_RETRY_MULTIPLIER || '2'),
      retries: parseInt(process.env.KAFKA_RETRY_RETRIES || '5', 10),
    },
    producer: {
      allowAutoTopicCreation:
        process.env.KAFKA_PRODUCER_ALLOW_AUTO_TOPIC_CREATION !== 'false',
      transactionTimeout: parseInt(
        process.env.KAFKA_PRODUCER_TRANSACTION_TIMEOUT || '60000',
        10
      ),
      idempotent: process.env.KAFKA_PRODUCER_IDEMPOTENT === 'true',
      maxInFlightRequests: parseInt(
        process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS || '5',
        10
      ),
    },
    consumer: {
      groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'backend-app-group',
      sessionTimeout: parseInt(
        process.env.KAFKA_CONSUMER_SESSION_TIMEOUT || '30000',
        10
      ),
      rebalanceTimeout: parseInt(
        process.env.KAFKA_CONSUMER_REBALANCE_TIMEOUT || '60000',
        10
      ),
      heartbeatInterval: parseInt(
        process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL || '3000',
        10
      ),
      allowAutoTopicCreation:
        process.env.KAFKA_CONSUMER_ALLOW_AUTO_TOPIC_CREATION !== 'false',
      maxBytesPerPartition: parseInt(
        process.env.KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION || '1048576',
        10
      ),
      maxWaitTimeInMs: parseInt(
        process.env.KAFKA_CONSUMER_MAX_WAIT_TIME_IN_MS || '5000',
        10
      ),
    },
    topics: {
      userEvents: process.env.KAFKA_TOPIC_USER_EVENTS || 'user.events',
      emailEvents: process.env.KAFKA_TOPIC_EMAIL_EVENTS || 'email.events',
      auditLogs: process.env.KAFKA_TOPIC_AUDIT_LOGS || 'audit.logs',
    },
  },
  observability: {
    enabled: process.env.OBSERVABILITY_ENABLED !== 'false',
    serviceName: process.env.OBSERVABILITY_SERVICE_NAME || 'backend-app',
    serviceVersion: process.env.OBSERVABILITY_SERVICE_VERSION || '1.0.0',
    metricsPrefix: process.env.OBSERVABILITY_METRICS_PREFIX || 'backend_app_',
    metricsExportInterval: parseInt(
      process.env.OBSERVABILITY_METRICS_EXPORT_INTERVAL || '60000',
      10
    ),
    tracingEnabled: process.env.OBSERVABILITY_TRACING_ENABLED !== 'false',
    tracingSampleRate: parseFloat(
      process.env.OBSERVABILITY_TRACING_SAMPLE_RATE || '1.0'
    ),
  },
};

export default config;
