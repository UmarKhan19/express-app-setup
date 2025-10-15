/**
 * OpenTelemetry Instrumentation Bootstrap
 * This file MUST be imported before any other application code
 * to ensure automatic instrumentation works correctly
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Set up diagnostic logging for troubleshooting - only in debug mode
if (process.env.OBSERVABILITY_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Create trace exporter - default to Tempo if no custom endpoint is configured
const traceExporterUrl =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
  (process.env.OBSERVABILITY_ENABLED !== 'false'
    ? 'http://localhost:4318/v1/traces'
    : undefined);

const traceExporter = traceExporterUrl
  ? new OTLPTraceExporter({
      url: traceExporterUrl,
    })
  : undefined;

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]:
      process.env.OBSERVABILITY_SERVICE_NAME || 'backend-app',
    [SEMRESATTRS_SERVICE_VERSION]:
      process.env.OBSERVABILITY_SERVICE_VERSION || '1.0.0',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  spanProcessors: traceExporter ? [new BatchSpanProcessor(traceExporter)] : [],
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
    exportIntervalMillis: parseInt(
      process.env.OBSERVABILITY_METRICS_EXPORT_INTERVAL || '60000',
      10
    ),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongodb': {
        enabled: true,
        enhancedDatabaseReporting: true,
      },
      '@opentelemetry/instrumentation-ioredis': {
        enabled: process.env.REDIS_ENABLED === 'true',
      },
      '@opentelemetry/instrumentation-kafkajs': {
        enabled: process.env.KAFKA_ENABLED === 'true',
      },
    }),
  ],
});

// Start SDK
if (process.env.OBSERVABILITY_ENABLED !== 'false') {
  sdk.start();
  // eslint-disable-next-line no-console
  console.log('OpenTelemetry SDK started successfully');
}

// Handle shutdown
process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    // eslint-disable-next-line no-console
    console.log('OpenTelemetry SDK shut down successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error shutting down OpenTelemetry SDK:', error);
  }
});

export default sdk;
