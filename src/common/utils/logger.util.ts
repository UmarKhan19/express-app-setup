import winston from 'winston';
import LokiTransport from 'winston-loki';
import config from '@/config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = config.env || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Format for Loki (without colorization)
const lokiFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Add Loki transport if enabled
if (process.env.LOKI_ENABLED !== 'false') {
  const lokiHost = process.env.LOKI_HOST || 'http://localhost:3100';
  transports.push(
    new LokiTransport({
      host: lokiHost,
      labels: {
        app: 'backend-app',
        environment: config.env || 'development',
      },
      json: true,
      format: lokiFormat,
      replaceTimestamp: true,
      onConnectionError: (err) => {
        // eslint-disable-next-line no-console
        console.error('Loki connection error:', err);
      },
    })
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;
