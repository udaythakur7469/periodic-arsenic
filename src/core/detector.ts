/**
 * Signal detection logic - Enhanced with all production signals
 */

import {
  RawQueryEvent,
  QueryHistory,
  MonitorConfig,
  RequestContext,
  ForgeSignal,
  QueryHistoryEntry,
  SignalSeverity,
} from './types';
import { BAD_SIGNALS, GOOD_SIGNALS } from './signals';

/**
 * Detect all signals for a given query event
 */
export function detectSignals(
  event: RawQueryEvent,
  history: QueryHistory,
  config: MonitorConfig,
  requestContext?: RequestContext
): ForgeSignal[] {
  const signals: ForgeSignal[] = [];
  const includeDocs = config.includeDocs ?? true;
  const emitPositive = config.emitPositiveSignals ?? false;
  const threshold = config.slowQueryThresholdMs ?? 200;

  // Get query shape for history lookup
  const queryShape = getQueryShape(event);
  const historyEntry = history.queries.get(queryShape);
  const metadata = event.metadata || {};

  // ========== BAD SIGNALS ==========

  // 1. slow_query
  if (event.durationMs > threshold) {
    signals.push(BAD_SIGNALS.slow_query(includeDocs));
  }

  // 2. hot_path (slow + frequent)
  if (event.durationMs > threshold && historyEntry && historyEntry.count > 10) {
    signals.push(BAD_SIGNALS.hot_path(includeDocs));
  }

  // 3. n_plus_one (same query repeated in same request)
  // 3. n_plus_one (same query repeated in same request)
  if (requestContext && historyEntry && historyEntry.requestCounts) {
    const countInThisRequest =
      historyEntry.requestCounts.get(requestContext.id) || 0;
    if (countInThisRequest >= 3) {
      signals.push(BAD_SIGNALS.n_plus_one(includeDocs));
    }
  }

  // 4. unbounded_query
  if (isUnboundedQuery(event)) {
    signals.push(BAD_SIGNALS.unbounded_query(includeDocs));
  }

  // 5. fan_out (many queries in single request)
  if (requestContext && historyEntry) {
    const totalQueriesInRequest = Array.from(history.queries.values()).reduce(
      (sum, entry) => sum + (entry.requestIds.has(requestContext.id) ? 1 : 0),
      0
    );

    if (totalQueriesInRequest > 20) {
      signals.push(BAD_SIGNALS.fan_out(includeDocs));
    }
  }

  // 6. high_variance_latency
  if (historyEntry && hasHighVariance(historyEntry, event.durationMs)) {
    signals.push(BAD_SIGNALS.high_variance_latency(includeDocs));
  }

  // 7. high_cpu
  if (metadata.cpuUsage && metadata.cpuUsage > 80) {
    signals.push(BAD_SIGNALS.high_cpu(includeDocs));
  }

  // 8. high_memory
  if (metadata.memoryUsage && metadata.memoryUsage > 100 * 1024 * 1024) {
    // > 100MB
    signals.push(BAD_SIGNALS.high_memory(includeDocs));
  }

  // 9. blocking_io (Node.js specific - heuristic based on very long sync operations)
  if (event.durationMs > 1000 && !event.operation.includes('aggregate')) {
    // Very long operations might be blocking
    signals.push(BAD_SIGNALS.blocking_io(includeDocs));
  }

  // 10. large_payload
  if (metadata.payloadSize && metadata.payloadSize > 1024 * 1024) {
    // > 1MB
    signals.push(BAD_SIGNALS.large_payload(includeDocs));
  }

  if (metadata.rowsAffected && metadata.rowsAffected > 10000) {
    signals.push(BAD_SIGNALS.large_payload(includeDocs));
  }

  // 11. retry_loop
  if (metadata.retryCount && metadata.retryCount > 3) {
    signals.push(BAD_SIGNALS.retry_loop(includeDocs));
  }

  // 12. deprecated_api (check for known deprecated operations)
  if (isDeprecatedApi(event)) {
    signals.push(BAD_SIGNALS.deprecated_api(includeDocs));
  }

  // 13. overfetching (selecting all fields when not needed)
  if (isOverfetching(event, metadata)) {
    signals.push(BAD_SIGNALS.overfetching(includeDocs));
  }

  // 14. read_heavy_hotspot
  if (
    historyEntry &&
    historyEntry.count > 100 &&
    event.operation.includes('find')
  ) {
    signals.push(BAD_SIGNALS.read_heavy_hotspot(includeDocs));
  }

  // 15. write_contention
  if (
    historyEntry &&
    historyEntry.count > 50 &&
    isWriteOperation(event.operation)
  ) {
    signals.push(BAD_SIGNALS.write_contention(includeDocs));
  }

  // 16. connection_pool_exhaustion (if metadata provided)
  if (metadata.connectionPoolUsage && metadata.connectionPoolUsage > 0.9) {
    signals.push(BAD_SIGNALS.connection_pool_exhaustion(includeDocs));
  }

  // ========== GOOD SIGNALS (opt-in) ==========

  if (emitPositive) {
    // 1. fast_query
    if (event.durationMs < threshold * 0.25) {
      signals.push(GOOD_SIGNALS.fast_query(includeDocs));
    }

    // 2. bounded_query
    if (isBoundedQuery(event)) {
      signals.push(GOOD_SIGNALS.bounded_query(includeDocs));
    }

    // 3. stable_latency
    if (historyEntry && hasLowVariance(historyEntry, event.durationMs)) {
      signals.push(GOOD_SIGNALS.stable_latency(includeDocs));
    }

    // 4. indexed_lookup (heuristic: very fast + single record lookup)
    if (
      event.durationMs < 10 &&
      (event.operation.includes('findUnique') ||
        event.operation.includes('findOne'))
    ) {
      signals.push(GOOD_SIGNALS.indexed_lookup(includeDocs));
    }

    // 5. cached_query
    if (metadata.cacheHit === true) {
      signals.push(GOOD_SIGNALS.cached_query(includeDocs));
    }

    // 6. index_hit (explicit from metadata)
    if (metadata.indexUsed === true) {
      signals.push(GOOD_SIGNALS.index_hit(includeDocs));
    }

    // 7. single_query (no N+1 in this request)
    if (requestContext && historyEntry) {
      const queriesInThisRequest = Array.from(historyEntry.requestIds).filter(
        (id) => id === requestContext.id
      ).length;

      if (queriesInThisRequest === 1) {
        signals.push(GOOD_SIGNALS.single_query(includeDocs));
      }
    }

    // 8. optimized_join
    if (
      metadata.joinType === 'indexed' ||
      (event.operation.includes('join') && event.durationMs < threshold * 0.5)
    ) {
      signals.push(GOOD_SIGNALS.optimized_join(includeDocs));
    }

    // 9. connection_reused
    if (metadata.connectionReused === true) {
      signals.push(GOOD_SIGNALS.connection_reused(includeDocs));
    }

    // 10. low_memory
    if (metadata.memoryUsage && metadata.memoryUsage < 10 * 1024 * 1024) {
      // < 10MB
      signals.push(GOOD_SIGNALS.low_memory(includeDocs));
    }

    // 11. low_cpu
    if (metadata.cpuUsage && metadata.cpuUsage < 20) {
      signals.push(GOOD_SIGNALS.low_cpu(includeDocs));
    }

    // 12. stable_response (already covered by stable_latency, but kept for completeness)
    if (historyEntry && hasLowVariance(historyEntry, event.durationMs)) {
      signals.push(GOOD_SIGNALS.stable_response(includeDocs));
    }

    // 13. cache_candidate (stable query pattern with consistent params)
    if (
      historyEntry &&
      historyEntry.count > 10 &&
      hasLowVariance(historyEntry, event.durationMs)
    ) {
      signals.push(GOOD_SIGNALS.cache_candidate(includeDocs));
    }

    // 14. healthy_hot_path (frequently executed but fast and stable)
    if (
      historyEntry &&
      historyEntry.count > 50 &&
      event.durationMs < threshold * 0.5 &&
      hasLowVariance(historyEntry, event.durationMs)
    ) {
      signals.push(GOOD_SIGNALS.healthy_hot_path(includeDocs));
    }
  }

  return signals;
}

/**
 * Calculate overall severity from signals
 */
export function calculateSeverity(signals: ForgeSignal[]): SignalSeverity {
  if (signals.some((s) => s.severity === SignalSeverity.CRITICAL)) {
    return SignalSeverity.CRITICAL;
  }
  if (signals.some((s) => s.severity === SignalSeverity.WARNING)) {
    return SignalSeverity.WARNING;
  }
  return SignalSeverity.INFO;
}

/**
 * Generate a query shape identifier (normalized, without specific values)
 */
function getQueryShape(event: RawQueryEvent): string {
  return `${event.adapter}:${event.model}:${event.operation}`;
}

/**
 * Check if query is unbounded (no limit)
 */
function isUnboundedQuery(event: RawQueryEvent): boolean {
  const metadata = event.metadata || {};

  // Check for limit in metadata
  if ('limit' in metadata) {
    return metadata.limit === undefined || metadata.limit === null;
  }

  // Heuristic: find/findMany operations without limit
  if (
    event.operation.includes('find') &&
    !event.operation.includes('findOne') &&
    !event.operation.includes('findUnique')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if query is bounded (has limit)
 */
function isBoundedQuery(event: RawQueryEvent): boolean {
  const metadata = event.metadata || {};

  // Check for limit in metadata
  if ('limit' in metadata && metadata.limit !== undefined) {
    return true;
  }

  // Single-record lookups are inherently bounded
  if (
    event.operation.includes('findOne') ||
    event.operation.includes('findUnique')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if operation is a write operation
 */
function isWriteOperation(operation: string): boolean {
  const writeOps = ['insert', 'update', 'delete', 'create', 'upsert', 'save'];
  return writeOps.some((op) => operation.toLowerCase().includes(op));
}

/**
 * Check if using deprecated API
 */
function isDeprecatedApi(event: RawQueryEvent): boolean {
  // MongoDB deprecated operations
  if (event.db === 'mongodb') {
    const deprecated = ['count', 'ensureIndex'];
    return deprecated.some((op) => event.operation.includes(op));
  }

  // Add other DB-specific deprecated operations as needed
  return false;
}

/**
 * Check if query is overfetching (selecting unnecessary fields)
 */
function isOverfetching(_event: RawQueryEvent, metadata: any): boolean {
  // If selecting all fields (*) and payload is large
  if (metadata.selectAll === true && metadata.payloadSize > 100 * 1024) {
    return true;
  }

  // If field count is very high
  if (metadata.fieldCount && metadata.fieldCount > 50) {
    return true;
  }

  return false;
}

/**
 * Check if query has high variance in latency
 */
function hasHighVariance(
  historyEntry: QueryHistoryEntry,
  currentDuration: number
): boolean {
  if (historyEntry.count < 5) return false; // Need enough samples

  const avgDuration = historyEntry.avgDuration;
  const variance = Math.abs(currentDuration - avgDuration) / avgDuration;

  // High variance if > 50% deviation from average
  return variance > 0.5;
}

/**
 * Check if query has low variance in latency (stable)
 */
function hasLowVariance(
  historyEntry: QueryHistoryEntry,
  currentDuration: number
): boolean {
  if (historyEntry.count < 5) return false; // Need enough samples

  const avgDuration = historyEntry.avgDuration;
  const variance = Math.abs(currentDuration - avgDuration) / avgDuration;

  // Low variance if < 20% deviation from average
  return variance < 0.2;
}

/**
 * Update query history with new event
 */
export function updateHistory(
  history: QueryHistory,
  event: RawQueryEvent,
  requestContext?: RequestContext
): void {
  const queryShape = getQueryShape(event);
  const existing = history.queries.get(queryShape);

  if (existing) {
    existing.count++;
    existing.totalDuration += event.durationMs;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.lastSeen = Date.now();

    if (requestContext) {
      existing.requestIds.add(requestContext.id);
      // Track count per request ID
      const currentCount = existing.requestCounts.get(requestContext.id) || 0;
      existing.requestCounts.set(requestContext.id, currentCount + 1);
    }
  } else {
    const requestCounts = new Map<string, number>();
    if (requestContext) {
      requestCounts.set(requestContext.id, 1);
    }

    const newEntry: QueryHistoryEntry = {
      shape: queryShape,
      count: 1,
      totalDuration: event.durationMs,
      avgDuration: event.durationMs,
      lastSeen: Date.now(),
      requestIds: requestContext ? new Set([requestContext.id]) : new Set(),
      requestCounts: requestCounts, // ADD THIS
    };
    history.queries.set(queryShape, newEntry);
  }

  // Cleanup old entries if history is too large
  if (history.queries.size > history.maxSize) {
    cleanupHistory(history);
  }
}

/**
 * Remove oldest entries from history
 */
function cleanupHistory(history: QueryHistory): void {
  const entries = Array.from(history.queries.entries());
  entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen);

  // Remove oldest 20%
  const removeCount = Math.floor(history.maxSize * 0.2);
  for (let i = 0; i < removeCount; i++) {
    history.queries.delete(entries[i][0]);
  }
}
