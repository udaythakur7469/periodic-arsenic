/**
 * @periodic/arsenic
 *
 * Forged to observe what breaks systems under pressure.
 * A semantic runtime monitoring library for database queries.
 */

// Core exports
export { createMonitor } from './core/monitor';

// Framework adapters
export { expressContext } from './frameworks/express';
export { fastifyContext } from './frameworks/fastify';

// Database adapters
export { mongooseAdapter } from './adapters/mongoose';
export { prismaAdapter } from './adapters/prisma';
export { pgAdapter } from './adapters/pg';
export {
  redisAdapter,
  SLOW_REDIS_COMMANDS,
  REDIS_COMMAND_INFO,
  getRedisCommandInfo,
} from './adapters/redis';

// Exporters
export {
  createOtelExporter,
  createCompositeExporter,
  type OtelExporterConfig,
} from './exporters/opentelemetry';

// Type exports
export type {
  Monitor,
  MonitorConfig,
  ForgeEvent,
  ForgeSignal,
  Exporter,
  RequestContext,
  CallsiteInfo,
  RawQueryEvent,
  SignalExplanation,
  ExpressContextOptions,
  FastifyContextOptions,
  QueryHistory,
  QueryHistoryEntry,
  QueryMetadata,
} from './core/types';

// Enum exports
export { SignalSeverity } from './core/types';
