/**
 * Core type definitions for @periodic/arsenic
 */

/**
 * Signal severity levels
 */
export enum SignalSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Event emitted by Arsenic when a query is observed
 */
export interface ForgeEvent {
  type: 'db.query';
  db: 'mongodb' | 'postgres' | 'mysql' | 'sqlite' | 'redis' | string;
  adapter: string;
  model: string;
  operation: string;
  durationMs: number;
  slow: boolean;
  signals: string[];
  explanations: Record<string, SignalExplanation>;
  severity: SignalSeverity;
  request?: RequestContext;
  callsite?: CallsiteInfo;
  timestamp: string;
  metadata?: QueryMetadata;
}

/**
 * Additional query metadata
 */
export interface QueryMetadata {
  cpuUsage?: number;
  memoryUsage?: number;
  cacheHit?: boolean;
  rowsAffected?: number;
  payloadSize?: number;
  retryCount?: number;
  connectionReused?: boolean;
  indexUsed?: boolean;
  joinType?: string;
}

/**
 * Explanation for a detected signal
 */
export interface SignalExplanation {
  summary: string;
  detail: string;
  severity: SignalSeverity;
  docs?: string;
}

/**
 * HTTP request context
 */
export interface RequestContext {
  id: string;
  method: string;
  route: string;
  userId?: string;
}

/**
 * Callsite information (where query originated)
 */
export interface CallsiteInfo {
  file: string;
  line: number;
}

/**
 * Signal detection result
 */
export interface ForgeSignal {
  type: string;
  summary: string;
  detail: string;
  severity: SignalSeverity;
  docs?: string;
}

/**
 * Exporter function type
 */
export type Exporter = (event: ForgeEvent) => void | Promise<void>;

/**
 * Monitor configuration
 */
export interface MonitorConfig {
  /**
   * Threshold in milliseconds for slow query detection
   * @default 200
   */
  slowQueryThresholdMs?: number;

  /**
   * Include documentation links in signal explanations
   * @default true
   */
  includeDocs?: boolean;

  /**
   * Emit positive signals (bounded_query, fast_query, etc.)
   * @default false
   */
  emitPositiveSignals?: boolean;

  /**
   * Function to export events
   */
  exporter: Exporter;
}

/**
 * Raw query event from adapter (before signal detection)
 */
export interface RawQueryEvent {
  db: string;
  adapter: string;
  model: string;
  operation: string;
  durationMs: number;
  callsite?: CallsiteInfo;
  metadata?: Record<string, any>;
}

/**
 * Query history tracker for signal detection
 */
export interface QueryHistory {
  queries: Map<string, QueryHistoryEntry>;
  maxSize: number;
}

/**
 * Single query history entry
 */
export interface QueryHistoryEntry {
  shape: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  lastSeen: number;
  requestIds: Set<string>;
  requestCounts: Map<string, number>;
}

/**
 * Signal detector function
 */
export type SignalDetector = (
  event: RawQueryEvent,
  history: QueryHistory,
  config: MonitorConfig,
  requestContext?: RequestContext
) => ForgeSignal[];

/**
 * Express context options
 */
export interface ExpressContextOptions {
  /**
   * Function to extract user ID from request
   */
  attachUser?: (req: any) => string | undefined;
}

/**
 * Fastify context options
 */
export interface FastifyContextOptions {
  /**
   * Function to extract user ID from request
   */
  attachUser?: (req: any) => string | undefined;
}

/**
 * Monitor instance interface
 */
export interface Monitor {
  readonly config: MonitorConfig;
  emit(event: RawQueryEvent): Promise<void>;
  getHistory(): QueryHistory;
}
