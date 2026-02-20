/**
 * Redis adapter for command observation
 */

import { Monitor, RawQueryEvent } from '../core/types';
import { captureCallsite } from '../core/utils';

/**
 * Instrument Redis client for command observation
 * Supports both redis and ioredis clients
 */
export function redisAdapter(monitor: Monitor, redis: any): void {
  if (!redis) {
    throw new Error('[Arsenic] Redis client is required');
  }

  // Detect client type
  const isIoRedis =
    redis.constructor.name === 'Redis' || redis.constructor.name === 'Cluster';

  if (isIoRedis) {
    instrumentIoRedis(monitor, redis);
  } else {
    instrumentNodeRedis(monitor, redis);
  }
}

/**
 * Instrument ioredis client
 */
function instrumentIoRedis(monitor: Monitor, redis: any): void {
  const originalSendCommand = redis.sendCommand;

  redis.sendCommand = function (this: any, command: any, ...args: any[]) {
    const startTime = Date.now();
    const callsite = captureCallsite();
    const commandName = command.name || 'unknown';

    const result = originalSendCommand.call(this, command, ...args);

    if (result && typeof result.then === 'function') {
      return result
        .then((res: any) => {
          const durationMs = Date.now() - startTime;

          const event: RawQueryEvent = {
            db: 'redis',
            adapter: 'ioredis',
            model: extractKeyFromCommand(command),
            operation: commandName.toLowerCase(),
            durationMs,
            callsite,
            metadata: {
              command: commandName,
              args: command.args,
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
            db: 'redis',
            adapter: 'ioredis',
            model: extractKeyFromCommand(command),
            operation: commandName.toLowerCase(),
            durationMs,
            callsite,
            metadata: {
              command: commandName,
              args: command.args,
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
 * Instrument node-redis (v4+) client
 */
function instrumentNodeRedis(monitor: Monitor, redis: any): void {
  // node-redis v4+ uses different internal structure
  // We'll wrap the sendCommand method if available
  if (redis.sendCommand) {
    const originalSendCommand = redis.sendCommand;

    redis.sendCommand = async function (this: any, args: any[], options?: any) {
      const startTime = Date.now();
      const callsite = captureCallsite();
      const commandName = args[0] || 'unknown';

      try {
        const result = await originalSendCommand.call(this, args, options);
        const durationMs = Date.now() - startTime;

        const event: RawQueryEvent = {
          db: 'redis',
          adapter: 'redis',
          model: args[1] || 'unknown', // Key is usually the second argument
          operation: commandName.toLowerCase(),
          durationMs,
          callsite,
          metadata: {
            command: commandName,
            args: args.slice(1),
          },
        };

        monitor.emit(event).catch(() => {
          // Ignore emission errors
        });

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;

        const event: RawQueryEvent = {
          db: 'redis',
          adapter: 'redis',
          model: args[1] || 'unknown',
          operation: commandName.toLowerCase(),
          durationMs,
          callsite,
          metadata: {
            command: commandName,
            args: args.slice(1),
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };

        monitor.emit(event).catch(() => {
          // Ignore emission errors
        });

        throw error;
      }
    };
  }
}

/**
 * Extract key from Redis command (ioredis)
 */
function extractKeyFromCommand(command: any): string {
  if (command.args && command.args.length > 0) {
    return String(command.args[0]);
  }
  return 'unknown';
}

/**
 * Detect slow Redis commands
 * Some Redis commands are known to be slow and should be monitored
 */
export const SLOW_REDIS_COMMANDS = [
  'keys', // Should use SCAN instead
  'flushall', // Blocks the entire server
  'flushdb', // Blocks the entire database
  'sort', // Can be slow with large datasets
  'sunion', // Set union can be expensive
  'sinter', // Set intersection can be expensive
  'sdiff', // Set difference can be expensive
  'zinterstore', // Sorted set operations can be slow
  'zunionstore',
];
