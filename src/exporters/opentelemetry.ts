/**
 * OpenTelemetry exporter for Arsenic events
 */

import { ForgeEvent, Exporter } from '../core/types';

/**
 * Configuration for OpenTelemetry exporter
 */
export interface OtelExporterConfig {
  /**
   * Service name for traces
   */
  serviceName?: string;

  /**
   * Whether to export as spans
   * @default true
   */
  exportAsSpans?: boolean;

  /**
   * Whether to export as metrics
   * @default true
   */
  exportAsMetrics?: boolean;

  /**
   * Whether to export as logs
   * @default false
   */
  exportAsLogs?: boolean;

  /**
   * Custom attributes to add to all exports
   */
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Create an OpenTelemetry exporter
 *
 * @example
 * ```typescript
 * import { trace, metrics } from '@opentelemetry/api';
 *
 * const monitor = createMonitor({
 *   exporter: createOtelExporter({
 *     serviceName: 'my-service',
 *     exportAsSpans: true,
 *     exportAsMetrics: true,
 *   })
 * });
 * ```
 */
export function createOtelExporter(config: OtelExporterConfig = {}): Exporter {
  const {
    serviceName = 'arsenic',
    exportAsSpans = true,
    exportAsMetrics = true,
    exportAsLogs = false,
    attributes = {},
  } = config;

  return async (event: ForgeEvent) => {
    try {
      // Dynamically import OpenTelemetry (peer dependency)
      let otelApi: any;

      try {
        otelApi = await import('@opentelemetry/api' as any);
      } catch (importError) {
        // OpenTelemetry not installed - silently skip
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[Arsenic] OpenTelemetry API not installed. Install @opentelemetry/api to enable OTel export.'
          );
        }
        return;
      }

      const { trace, metrics } = otelApi;

      // Export as span
      if (exportAsSpans) {
        const tracer = trace.getTracer(serviceName);
        const span = tracer.startSpan(`db.${event.operation}`, {
          startTime: new Date(event.timestamp).getTime(),
          attributes: {
            'db.system': event.db,
            'db.operation': event.operation,
            'db.model': event.model,
            'db.adapter': event.adapter,
            'db.duration_ms': event.durationMs,
            'db.slow': event.slow,
            'arsenic.signals': event.signals.join(','),
            'arsenic.severity': event.severity,
            ...attributes,
            ...(event.request && {
              'http.method': event.request.method,
              'http.route': event.request.route,
              'http.request_id': event.request.id,
            }),
            ...(event.callsite && {
              'code.filepath': event.callsite.file,
              'code.lineno': event.callsite.line,
            }),
          },
        });

        // Add signal events
        event.signals.forEach((signal) => {
          span.addEvent(`signal.${signal}`, {
            'signal.summary': event.explanations[signal]?.summary,
            'signal.severity': event.explanations[signal]?.severity,
          });
        });

        span.end(new Date(event.timestamp).getTime() + event.durationMs);
      }

      // Export as metrics
      if (exportAsMetrics) {
        const meter = metrics.getMeter(serviceName);

        // Duration histogram
        const durationHistogram = meter.createHistogram('db.query.duration', {
          description: 'Database query duration in milliseconds',
          unit: 'ms',
        });

        durationHistogram.record(event.durationMs, {
          'db.system': event.db,
          'db.operation': event.operation,
          'db.model': event.model,
          'db.adapter': event.adapter,
          'db.slow': String(event.slow),
          'arsenic.severity': event.severity,
          ...attributes,
        });

        // Signal counters
        const signalCounter = meter.createCounter('db.query.signals', {
          description: 'Database query signals detected',
        });

        event.signals.forEach((signal) => {
          signalCounter.add(1, {
            'signal.type': signal,
            'signal.severity': event.explanations[signal]?.severity,
            'db.system': event.db,
            'db.operation': event.operation,
            ...attributes,
          });
        });

        // Slow query counter
        if (event.slow) {
          const slowQueryCounter = meter.createCounter('db.query.slow', {
            description: 'Slow database queries',
          });

          slowQueryCounter.add(1, {
            'db.system': event.db,
            'db.operation': event.operation,
            'db.model': event.model,
            ...attributes,
          });
        }
      }

      // Export as logs (if enabled)
      if (exportAsLogs) {
        // OpenTelemetry Logs API is still experimental
        // For now, we can use console.log in structured format
        console.log(
          JSON.stringify({
            timestamp: event.timestamp,
            severity: event.severity,
            body: `Database query: ${event.model}.${event.operation}`,
            attributes: {
              'db.system': event.db,
              'db.operation': event.operation,
              'db.model': event.model,
              'db.duration_ms': event.durationMs,
              'db.slow': event.slow,
              'arsenic.signals': event.signals,
              ...attributes,
            },
          })
        );
      }
    } catch (error) {
      // Silently fail if OpenTelemetry is not available
      if (process.env.NODE_ENV === 'development') {
        console.error('[Arsenic] OpenTelemetry export error:', error);
      }
    }
  };
}

/**
 * Helper to create a composite exporter that sends to both OpenTelemetry and another exporter
 */
export function createCompositeExporter(
  otelConfig: OtelExporterConfig,
  additionalExporter: Exporter
): Exporter {
  const otelExporter = createOtelExporter(otelConfig);

  return async (event: ForgeEvent) => {
    await Promise.allSettled([otelExporter(event), additionalExporter(event)]);
  };
}
