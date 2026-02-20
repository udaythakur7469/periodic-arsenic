/**
 * Mongoose adapter for MongoDB query observation
 */

import { Monitor, RawQueryEvent } from '../core/types';
import { captureCallsite } from '../core/utils';

/**
 * Instrument Mongoose for query observation
 */
export function mongooseAdapter(monitor: Monitor, mongoose: any): void {
  if (!mongoose) {
    throw new Error('[Arsenic] Mongoose instance is required');
  }

  // Hook into Query.prototype.exec
  const originalExec = mongoose.Query.prototype.exec;

  mongoose.Query.prototype.exec = function (this: any, ...args: any[]) {
    const startTime = Date.now();
    const model = this.model?.modelName || 'Unknown';
    const operation = this.op || 'unknown';
    const callsite = captureCallsite();

    // Get query options to detect limit
    const options = this.options || {};
    const limit = options.limit;

    // Execute original query
    const result = originalExec.apply(this, args);

    // Handle promise-based result
    if (result && typeof result.then === 'function') {
      return result
        .then((res: any) => {
          const durationMs = Date.now() - startTime;

          // Emit event
          const event: RawQueryEvent = {
            db: 'mongodb',
            adapter: 'mongoose',
            model,
            operation,
            durationMs,
            callsite,
            metadata: {
              limit,
            },
          };

          monitor.emit(event).catch(() => {
            // Ignore emission errors
          });

          return res;
        })
        .catch((error: any) => {
          const durationMs = Date.now() - startTime;

          // Still emit event for failed queries
          const event: RawQueryEvent = {
            db: 'mongodb',
            adapter: 'mongoose',
            model,
            operation,
            durationMs,
            callsite,
            metadata: {
              limit,
              error: error.message,
            },
          };

          monitor.emit(event).catch(() => {
            // Ignore emission errors
          });

          throw error;
        });
    }

    return result;
  };

  // Also hook into aggregate if available
  if (mongoose.Model.prototype.aggregate) {
    const originalAggregate = mongoose.Model.prototype.aggregate;

    mongoose.Model.prototype.aggregate = function (this: any, ...args: any[]) {
      const startTime = Date.now();
      const model = this.modelName || 'Unknown';
      const callsite = captureCallsite();

      const result = originalAggregate.apply(this, args);

      if (result && typeof result.then === 'function') {
        return result.then((res: any) => {
          const durationMs = Date.now() - startTime;

          const event: RawQueryEvent = {
            db: 'mongodb',
            adapter: 'mongoose',
            model,
            operation: 'aggregate',
            durationMs,
            callsite,
          };

          monitor.emit(event).catch(() => {
            // Ignore emission errors
          });

          return res;
        });
      }

      return result;
    };
  }
}
