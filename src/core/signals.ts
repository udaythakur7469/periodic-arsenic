/**
 * Signal definitions with explanations and severity levels
 */

import { ForgeSignal, SignalSeverity } from './types';

const DOCS_BASE = 'https://periodic.dev/signals';

/**
 * Bad signals (problems/warnings) - CRITICAL & WARNING
 */
export const BAD_SIGNALS = {
  // CRITICAL SIGNALS - Immediate performance issues
  slow_query: (includeDocs: boolean): ForgeSignal => ({
    type: 'slow_query',
    summary: 'Query exceeded configured threshold.',
    detail:
      'This query took longer than expected and may impact request latency.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/slow-query` : undefined,
  }),

  hot_path: (includeDocs: boolean): ForgeSignal => ({
    type: 'hot_path',
    summary: 'This query is both slow and frequently executed.',
    detail:
      'It appears on a hot execution path and contributes significantly to overall request latency. This is a high-priority optimization target.',
    severity: SignalSeverity.CRITICAL,
    docs: includeDocs ? `${DOCS_BASE}/hot-path` : undefined,
  }),

  n_plus_one: (includeDocs: boolean): ForgeSignal => ({
    type: 'n_plus_one',
    summary: 'Multiple queries detected where a single query should suffice.',
    detail:
      'This pattern suggests an N+1 query issue, where data is fetched in a loop instead of a single batch query. This severely impacts performance at scale.',
    severity: SignalSeverity.CRITICAL,
    docs: includeDocs ? `${DOCS_BASE}/n-plus-one` : undefined,
  }),

  unbounded_query: (includeDocs: boolean): ForgeSignal => ({
    type: 'unbounded_query',
    summary: 'Query missing limit, potential unbounded data fetch.',
    detail:
      'This query does not include a LIMIT clause and may return an unexpectedly large dataset, causing memory and performance issues.',
    severity: SignalSeverity.CRITICAL,
    docs: includeDocs ? `${DOCS_BASE}/unbounded-query` : undefined,
  }),

  fan_out: (includeDocs: boolean): ForgeSignal => ({
    type: 'fan_out',
    summary: 'Single request triggered multiple database queries.',
    detail:
      'Request fans out into many DB queries, indicating potential architectural issues or missing data aggregation.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/fan-out` : undefined,
  }),

  high_variance_latency: (includeDocs: boolean): ForgeSignal => ({
    type: 'high_variance_latency',
    summary: 'Query latency is inconsistent across executions.',
    detail:
      'High variance in execution time suggests unpredictable performance, possibly due to cache misses, index issues, or data distribution problems.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/high-variance-latency` : undefined,
  }),

  high_cpu: (includeDocs: boolean): ForgeSignal => ({
    type: 'high_cpu',
    summary: 'Query or request caused high CPU consumption.',
    detail:
      'Elevated CPU usage detected during query execution, indicating compute-intensive operations that may benefit from optimization.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/high-cpu` : undefined,
  }),

  high_memory: (includeDocs: boolean): ForgeSignal => ({
    type: 'high_memory',
    summary: 'Query or request caused high memory usage.',
    detail:
      'Elevated memory consumption detected, potentially due to large result sets, inefficient data structures, or memory leaks.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/high-memory` : undefined,
  }),

  blocking_io: (includeDocs: boolean): ForgeSignal => ({
    type: 'blocking_io',
    summary: 'Blocking operations detected on event loop.',
    detail:
      'Synchronous I/O operations are blocking the event loop, degrading overall application responsiveness. This is critical in Node.js environments.',
    severity: SignalSeverity.CRITICAL,
    docs: includeDocs ? `${DOCS_BASE}/blocking-io` : undefined,
  }),

  large_payload: (includeDocs: boolean): ForgeSignal => ({
    type: 'large_payload',
    summary: 'Query returned an excessively large dataset.',
    detail:
      'The result set size is unusually large, suggesting potential overfetching, missing pagination, or inefficient data retrieval.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/large-payload` : undefined,
  }),

  retry_loop: (includeDocs: boolean): ForgeSignal => ({
    type: 'retry_loop',
    summary: 'Excessive retries detected on query execution.',
    detail:
      'Query is being retried multiple times, indicating transient failures, deadlocks, or connectivity issues that need investigation.',
    severity: SignalSeverity.CRITICAL,
    docs: includeDocs ? `${DOCS_BASE}/retry-loop` : undefined,
  }),

  deprecated_api: (includeDocs: boolean): ForgeSignal => ({
    type: 'deprecated_api',
    summary: 'Query used deprecated database methods.',
    detail:
      'Deprecated database API detected. This may cause issues in future database versions and should be updated.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/deprecated-api` : undefined,
  }),

  overfetching: (includeDocs: boolean): ForgeSignal => ({
    type: 'overfetching',
    summary: 'Query selects more fields than necessary.',
    detail:
      'Query retrieves more data than needed. Consider using selective field projection to reduce payload size and improve performance.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/overfetching` : undefined,
  }),

  read_heavy_hotspot: (includeDocs: boolean): ForgeSignal => ({
    type: 'read_heavy_hotspot',
    summary: 'High-frequency read operations on specific records.',
    detail:
      'Concentrated read activity detected on specific data points. Consider implementing caching or read replicas.',
    severity: SignalSeverity.WARNING,
    docs: includeDocs ? `${DOCS_BASE}/read-heavy-hotspot` : undefined,
  }),

  write_contention: (includeDocs: boolean): ForgeSignal => ({
    type: 'write_contention',
    summary: 'Repeated writes to the same record detected.',
    detail:
      'High-frequency writes to the same record may cause lock contention, serialization issues, and performance degradation.',
    severity: SignalSeverity.CRITICAL,
    docs: includeDocs ? `${DOCS_BASE}/write-contention` : undefined,
  }),

  connection_pool_exhaustion: (includeDocs: boolean): ForgeSignal => ({
    type: 'connection_pool_exhaustion',
    summary: 'Database connection pool nearing or at capacity.',
    detail:
      'Connection pool is under pressure. This may lead to connection timeouts and failed requests. Consider increasing pool size or investigating connection leaks.',
    severity: SignalSeverity.CRITICAL,
    docs: includeDocs ? `${DOCS_BASE}/connection-pool-exhaustion` : undefined,
  }),
};

/**
 * Good signals (healthy behavior) - INFO level
 */
export const GOOD_SIGNALS = {
  fast_query: (includeDocs: boolean): ForgeSignal => ({
    type: 'fast_query',
    summary: 'Query executed well under threshold.',
    detail:
      'This query completed quickly and efficiently, indicating good performance.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/fast-query` : undefined,
  }),

  bounded_query: (includeDocs: boolean): ForgeSignal => ({
    type: 'bounded_query',
    summary: 'Query includes proper limits.',
    detail:
      'This query is properly bounded with a LIMIT clause, preventing unbounded data access and ensuring predictable performance.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/bounded-query` : undefined,
  }),

  indexed_lookup: (includeDocs: boolean): ForgeSignal => ({
    type: 'indexed_lookup',
    summary: 'Query likely leveraged database index.',
    detail:
      'The query pattern and performance characteristics suggest efficient index usage, enabling fast data retrieval.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/indexed-lookup` : undefined,
  }),

  stable_latency: (includeDocs: boolean): ForgeSignal => ({
    type: 'stable_latency',
    summary: 'Query latency is consistent across executions.',
    detail:
      'Predictable, low-variance performance indicates well-optimized query execution and stable system conditions.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/stable-latency` : undefined,
  }),

  cached_query: (includeDocs: boolean): ForgeSignal => ({
    type: 'cached_query',
    summary: 'Query result was served from cache.',
    detail:
      'Cache hit detected, significantly reducing database load and improving response time.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/cached-query` : undefined,
  }),

  index_hit: (includeDocs: boolean): ForgeSignal => ({
    type: 'index_hit',
    summary: 'Query leveraged database index effectively.',
    detail:
      'Confirmed index usage detected, enabling efficient data access without full table scans.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/index-hit` : undefined,
  }),

  single_query: (includeDocs: boolean): ForgeSignal => ({
    type: 'single_query',
    summary: 'Query executed as intended without N+1 patterns.',
    detail:
      'Efficient single-query pattern detected, avoiding common N+1 pitfalls and minimizing database round-trips.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/single-query` : undefined,
  }),

  optimized_join: (includeDocs: boolean): ForgeSignal => ({
    type: 'optimized_join',
    summary: 'Joins executed efficiently without full table scans.',
    detail:
      'Join operation completed efficiently using indexes, avoiding expensive full table scans.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/optimized-join` : undefined,
  }),

  connection_reused: (includeDocs: boolean): ForgeSignal => ({
    type: 'connection_reused',
    summary: 'Database connection reused, reducing overhead.',
    detail:
      'Connection pooling working effectively, avoiding costly connection establishment overhead.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/connection-reused` : undefined,
  }),

  low_memory: (includeDocs: boolean): ForgeSignal => ({
    type: 'low_memory',
    summary: 'Query executed with low memory footprint.',
    detail:
      'Memory-efficient query execution detected, indicating good data handling practices.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/low-memory` : undefined,
  }),

  low_cpu: (includeDocs: boolean): ForgeSignal => ({
    type: 'low_cpu',
    summary: 'Query executed with low CPU usage.',
    detail:
      'CPU-efficient query execution, indicating well-optimized database operations.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/low-cpu` : undefined,
  }),

  stable_response: (includeDocs: boolean): ForgeSignal => ({
    type: 'stable_response',
    summary: 'Response time consistent with historical benchmarks.',
    detail:
      'Performance matches expected baselines, indicating stable and predictable system behavior.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/stable-response` : undefined,
  }),

  cache_candidate: (includeDocs: boolean): ForgeSignal => ({
    type: 'cache_candidate',
    summary: 'Query pattern is stable and cacheable.',
    detail:
      'This query has consistent parameters and execution patterns, making it an excellent candidate for caching.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/cache-candidate` : undefined,
  }),

  healthy_hot_path: (includeDocs: boolean): ForgeSignal => ({
    type: 'healthy_hot_path',
    summary: 'Frequently executed query performing optimally.',
    detail:
      'High-frequency query is fast and stable, indicating well-optimized hot path execution.',
    severity: SignalSeverity.INFO,
    docs: includeDocs ? `${DOCS_BASE}/healthy-hot-path` : undefined,
  }),
};
