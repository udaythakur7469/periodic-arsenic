/**
 * Redis adapter for command observation
 */

import { Monitor, RawQueryEvent } from '../core/types';
import { captureCallsite } from '../core/utils';

const DOCS_BASE = 'https://arsenicdev.online/docs/signals/redis-';

/**
 * Redis command information with docs links
 */
interface RedisCommandInfo {
  command: string;
  category: 'slow' | 'blocking' | 'dangerous' | 'normal';
  docs?: string;
}

/**
 * Slow/dangerous Redis commands with documentation
 */
export const REDIS_COMMAND_INFO: Record<string, RedisCommandInfo> = {
  // Dangerous commands - block entire server
  KEYS: {
    command: 'KEYS',
    category: 'dangerous',
    docs: `${DOCS_BASE}keys`,
  },
  FLUSHALL: {
    command: 'FLUSHALL',
    category: 'dangerous',
    docs: `${DOCS_BASE}flushall`,
  },
  FLUSHDB: {
    command: 'FLUSHDB',
    category: 'dangerous',
    docs: `${DOCS_BASE}flushdb`,
  },

  // Blocking commands
  BLPOP: {
    command: 'BLPOP',
    category: 'blocking',
    docs: `${DOCS_BASE}blpop`,
  },
  BRPOP: {
    command: 'BRPOP',
    category: 'blocking',
    docs: `${DOCS_BASE}brpop`,
  },
  BRPOPLPUSH: {
    command: 'BRPOPLPUSH',
    category: 'blocking',
    docs: `${DOCS_BASE}brpoplpush`,
  },
  BLMOVE: {
    command: 'BLMOVE',
    category: 'blocking',
    docs: `${DOCS_BASE}blmove`,
  },

  // Slow commands - expensive operations
  SORT: {
    command: 'SORT',
    category: 'slow',
    docs: `${DOCS_BASE}sort`,
  },
  SUNION: {
    command: 'SUNION',
    category: 'slow',
    docs: `${DOCS_BASE}sunion`,
  },
  SINTER: {
    command: 'SINTER',
    category: 'slow',
    docs: `${DOCS_BASE}sinter`,
  },
  SDIFF: {
    command: 'SDIFF',
    category: 'slow',
    docs: `${DOCS_BASE}sdiff`,
  },
  SUNIONSTORE: {
    command: 'SUNIONSTORE',
    category: 'slow',
    docs: `${DOCS_BASE}sunionstore`,
  },
  SINTERSTORE: {
    command: 'SINTERSTORE',
    category: 'slow',
    docs: `${DOCS_BASE}sinterstore`,
  },
  SDIFFSTORE: {
    command: 'SDIFFSTORE',
    category: 'slow',
    docs: `${DOCS_BASE}sdiffstore`,
  },
  ZINTERSTORE: {
    command: 'ZINTERSTORE',
    category: 'slow',
    docs: `${DOCS_BASE}zinterstore`,
  },
  ZUNIONSTORE: {
    command: 'ZUNIONSTORE',
    category: 'slow',
    docs: `${DOCS_BASE}zunionstore`,
  },
  ZRANGEBYSCORE: {
    command: 'ZRANGEBYSCORE',
    category: 'slow',
    docs: `${DOCS_BASE}zrangebyscore`,
  },
  ZREVRANGEBYSCORE: {
    command: 'ZREVRANGEBYSCORE',
    category: 'slow',
    docs: `${DOCS_BASE}zrevrangebyscore`,
  },

  // Scan operations (better than KEYS but still monitored)
  SCAN: {
    command: 'SCAN',
    category: 'slow',
    docs: `${DOCS_BASE}scan`,
  },
  SSCAN: {
    command: 'SSCAN',
    category: 'slow',
    docs: `${DOCS_BASE}sscan`,
  },
  HSCAN: {
    command: 'HSCAN',
    category: 'slow',
    docs: `${DOCS_BASE}hscan`,
  },
  ZSCAN: {
    command: 'ZSCAN',
    category: 'slow',
    docs: `${DOCS_BASE}zscan`,
  },

  // Large data operations
  HGETALL: {
    command: 'HGETALL',
    category: 'slow',
    docs: `${DOCS_BASE}hgetall`,
  },
  SMEMBERS: {
    command: 'SMEMBERS',
    category: 'slow',
    docs: `${DOCS_BASE}smembers`,
  },
  LRANGE: {
    command: 'LRANGE',
    category: 'slow',
    docs: `${DOCS_BASE}lrange`,
  },
  ZRANGE: {
    command: 'ZRANGE',
    category: 'slow',
    docs: `${DOCS_BASE}zrange`,
  },
  ZREVRANGE: {
    command: 'ZREVRANGE',
    category: 'slow',
    docs: `${DOCS_BASE}zrevrange`,
  },
  ZRANGEBYLEX: {
    command: 'ZRANGEBYLEX',
    category: 'slow',
    docs: `${DOCS_BASE}zrangebylex`,
  },
  OBJECT: {
    command: 'OBJECT',
    category: 'slow',
    docs: `${DOCS_BASE}object`,
  },
  WAIT: {
    command: 'WAIT',
    category: 'slow',
    docs: `${DOCS_BASE}wait`,
  },

  // Multi/Exec
  MULTI: {
    command: 'MULTI',
    category: 'normal',
    docs: `${DOCS_BASE}multi`,
  },
  EXEC: {
    command: 'EXEC',
    category: 'normal',
    docs: `${DOCS_BASE}exec`,
  },
};

/**
 * Get command info with docs link
 */
export function getRedisCommandInfo(command: string): RedisCommandInfo {
  const upperCommand = command.toUpperCase();
  return (
    REDIS_COMMAND_INFO[upperCommand] || {
      command: upperCommand,
      category: 'normal',
      docs: `${DOCS_BASE}commands`,
    }
  );
}

/**
 * Legacy array of slow commands (for backward compatibility)
 */
export const SLOW_REDIS_COMMANDS = Object.keys(REDIS_COMMAND_INFO).filter(
  (cmd) =>
    ['slow', 'dangerous', 'blocking'].includes(REDIS_COMMAND_INFO[cmd].category)
);

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
    const commandInfo = getRedisCommandInfo(commandName);

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
              commandCategory: commandInfo.category,
              commandDocs: commandInfo.docs,
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
              commandCategory: commandInfo.category,
              commandDocs: commandInfo.docs,
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
      const commandInfo = getRedisCommandInfo(commandName);

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
            commandCategory: commandInfo.category,
            commandDocs: commandInfo.docs,
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
            commandCategory: commandInfo.category,
            commandDocs: commandInfo.docs,
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
