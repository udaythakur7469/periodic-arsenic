/**
 * Prisma adapter for SQL query observation
 */

import { Monitor, RawQueryEvent } from '../core/types';
import { captureCallsite } from '../core/utils';

/**
 * Instrument Prisma for query observation
 */
export function prismaAdapter(monitor: Monitor, prisma: any): void {
  if (!prisma) {
    throw new Error('[Arsenic] Prisma instance is required');
  }

  // Use Prisma middleware for newer versions (4.0+)
  if (prisma.$use) {
    prisma.$use(async (params: any, next: any) => {
      const startTime = Date.now();
      const callsite = captureCallsite();

      try {
        const result = await next(params);
        const durationMs = Date.now() - startTime;

        const event: RawQueryEvent = {
          db: inferDatabase(prisma),
          adapter: 'prisma',
          model: params.model || 'Unknown',
          operation: params.action || 'unknown',
          durationMs,
          callsite,
          metadata: {
            args: params.args,
          },
        };

        monitor.emit(event).catch(() => {
          // Ignore emission errors
        });

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;

        const event: RawQueryEvent = {
          db: inferDatabase(prisma),
          adapter: 'prisma',
          model: params.model || 'Unknown',
          operation: params.action || 'unknown',
          durationMs,
          callsite,
          metadata: {
            args: params.args,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };

        monitor.emit(event).catch(() => {
          // Ignore emission errors
        });

        throw error;
      }
    });
  }

  // Also use query events for older versions or as fallback
  if (prisma.$on) {
    prisma.$on('query', (e: any) => {
      const event: RawQueryEvent = {
        db: inferDatabase(prisma),
        adapter: 'prisma',
        model: extractModelFromQuery(e.query),
        operation: extractOperationFromQuery(e.query),
        durationMs: e.duration || 0,
        metadata: {
          query: e.query,
          params: e.params,
        },
      };

      monitor.emit(event).catch(() => {
        // Ignore emission errors
      });
    });
  }
}

/**
 * Infer database type from Prisma instance
 */
function inferDatabase(prisma: any): string {
  // Try to get from Prisma internals
  const datasources = prisma?._engineConfig?.datasources;
  if (datasources && datasources.length > 0) {
    const provider = datasources[0].provider;
    if (provider) {
      if (provider.includes('postgres')) return 'postgres';
      if (provider.includes('mysql')) return 'mysql';
      if (provider.includes('sqlite')) return 'sqlite';
      if (provider.includes('sqlserver')) return 'sqlserver';
      if (provider.includes('cockroach')) return 'cockroachdb';
    }
  }

  return 'sql';
}

/**
 * Extract model name from SQL query
 */
function extractModelFromQuery(query: string): string {
  // Try to extract table name from SQL
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
  const trimmed = query.trim().toUpperCase();

  if (trimmed.startsWith('SELECT')) return 'select';
  if (trimmed.startsWith('INSERT')) return 'insert';
  if (trimmed.startsWith('UPDATE')) return 'update';
  if (trimmed.startsWith('DELETE')) return 'delete';
  if (trimmed.startsWith('CREATE')) return 'create';
  if (trimmed.startsWith('DROP')) return 'drop';
  if (trimmed.startsWith('ALTER')) return 'alter';

  return 'unknown';
}
