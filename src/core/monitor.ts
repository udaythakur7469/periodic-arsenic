/**
 * Core Monitor implementation
 */

import {
  Monitor,
  MonitorConfig,
  RawQueryEvent,
  QueryHistory,
  ForgeEvent,
  ForgeSignal,
} from './types';
import { getContext } from './context';
import { detectSignals, updateHistory, calculateSeverity } from './detector';

/**
 * Default monitor configuration
 */
const DEFAULT_CONFIG: Partial<MonitorConfig> = {
  slowQueryThresholdMs: 200,
  includeDocs: true,
  emitPositiveSignals: false,
};

/**
 * Create a new monitor instance
 */
export function createMonitor(config: MonitorConfig): Monitor {
  const fullConfig: MonitorConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Query history for signal detection
  const history: QueryHistory = {
    queries: new Map(),
    maxSize: 1000, // Keep last 1000 unique query shapes
  };

  /**
   * Emit a query event
   */
  async function emit(event: RawQueryEvent): Promise<void> {
    try {
      // Get current request context if available
      const requestContext = getContext();

      // Update history
      updateHistory(history, event, requestContext);

      // Detect signals
      const signals = detectSignals(event, history, fullConfig, requestContext);

      // Determine if slow
      const slow = event.durationMs > (fullConfig.slowQueryThresholdMs ?? 200);

      // Build explanations
      const explanations: Record<string, any> = {};
      signals.forEach((signal: ForgeSignal) => {
        explanations[signal.type] = {
          summary: signal.summary,
          detail: signal.detail,
          severity: signal.severity,
          docs: signal.docs,
        };
      });

      // Calculate overall severity
      const severity = calculateSeverity(signals);

      // Build final event
      const forgeEvent: ForgeEvent = {
        type: 'db.query',
        db: event.db,
        adapter: event.adapter,
        model: event.model,
        operation: event.operation,
        durationMs: event.durationMs,
        slow,
        signals: signals.map((s) => s.type),
        explanations,
        severity,
        request: requestContext,
        callsite: event.callsite,
        timestamp: new Date().toISOString(),
        metadata: event.metadata,
      };

      // Export event (non-blocking)
      setImmediate(async () => {
        try {
          await fullConfig.exporter(forgeEvent);
        } catch (error) {
          // Silently catch exporter errors to avoid crashing app
          if (process.env.NODE_ENV === 'development') {
            console.error('[Arsenic] Exporter error:', error);
          }
        }
      });
    } catch (error) {
      // Never crash the app due to monitoring
      if (process.env.NODE_ENV === 'development') {
        console.error('[Arsenic] Monitor error:', error);
      }
    }
  }

  /**
   * Get query history (for debugging/testing)
   */
  function getHistory(): QueryHistory {
    return history;
  }

  return {
    config: fullConfig,
    emit,
    getHistory,
  };
}
