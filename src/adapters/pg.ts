/**
 * PostgreSQL (pg) adapter for raw driver query observation
 */

import { Monitor, RawQueryEvent } from '../core/types';
import { captureCallsite } from '../core/utils';

/**
 * Instrument pg (node-postgres) for query observation
 */
export function pgAdapter(monitor: Monitor, pg: any): void {
  if (!pg || !pg.Client) {
    throw new Error('[Arsenic] pg Client is required');
  }

  // Hook into Client.prototype.query
  const originalQuery = pg.Client.prototype.query;

  pg.Client.prototype.query = function (this: any, ...args: any[]) {
    const startTime = Date.now();
    const callsite = captureCallsite();

    // Extract query text
    let queryText = '';
    if (typeof args[0] === 'string') {
      queryText = args[0];
    } else if (args[0] && args[0].text) {
      queryText = args[0].text;
    }

    // Call original query
    const result = originalQuery.apply(this, args);

    // Handle promise-based result
    if (result && typeof result.then === 'function') {
      return result
        .then((res: any) => {
          const durationMs = Date.now() - startTime;

          const event: RawQueryEvent = {
            db: 'postgres',
            adapter: 'pg',
            model: extractModelFromQuery(queryText),
            operation: extractOperationFromQuery(queryText),
            durationMs,
            callsite,
            metadata: {
              query: queryText,
              rowsAffected: res.rowCount,
            },
          };

          monitor.emit(event).catch(() => {
            // Ignore emission errors
          });

          return res;
        })
        .catch((error: any) => {
          const durationMs = Date.now() - startTime;

          const event: RawQueryEvent = {
            db: 'postgres',
            adapter: 'pg',
            model: extractModelFromQuery(queryText),
            operation: extractOperationFromQuery(queryText),
            durationMs,
            callsite,
            metadata: {
              query: queryText,
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
}

/**
 * Extract model/table name from SQL query
 */
function extractModelFromQuery(query: string): string {
  if (!query) return 'Unknown';

  const fromMatch = query.match(/FROM\s+["'`]?(\w+)["'`]?/i);
  if (fromMatch) {
    return fromMatch[1];
  }

  const intoMatch = query.match(/INTO\s+["'`]?(\w+)["'`]?/i);
  if (intoMatch) {
    return intoMatch[1];
  }

  const updateMatch = query.match(/UPDATE\s+["'`]?(\w+)["'`]?/i);
  if (updateMatch) {
    return updateMatch[1];
  }

  return 'Unknown';
}

/**
 * Extract operation from SQL query
 */
function extractOperationFromQuery(query: string): string {
  if (!query) return 'unknown';

  const trimmed = query.trim().toUpperCase();

  if (trimmed.startsWith('SELECT')) return 'select';
  if (trimmed.startsWith('INSERT')) return 'insert';
  if (trimmed.startsWith('UPDATE')) return 'update';
  if (trimmed.startsWith('DELETE')) return 'delete';
  if (trimmed.startsWith('CREATE')) return 'create';
  if (trimmed.startsWith('DROP')) return 'drop';
  if (trimmed.startsWith('ALTER')) return 'alter';
  if (trimmed.startsWith('BEGIN')) return 'begin';
  if (trimmed.startsWith('COMMIT')) return 'commit';
  if (trimmed.startsWith('ROLLBACK')) return 'rollback';

  return 'unknown';
}
