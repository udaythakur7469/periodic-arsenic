# Arsenic Signals Reference

Complete reference for all signals detected by @periodic/arsenic.

## Signal Severity Levels

All signals are categorized by severity:

- **CRITICAL** 🔴 - Immediate performance or correctness issues requiring urgent attention
- **WARNING** ⚠️ - Performance degradation or potential issues that should be addressed  
- **INFO** ℹ️ - Healthy behavior and optimization opportunities

---

## Bad Signals (Problems/Warnings)

### CRITICAL Signals

#### `hot_path` 🔴
**Summary:** This query is both slow and frequently executed.

**Detail:** It appears on a hot execution path and contributes significantly to overall request latency. This is a high-priority optimization target.

**Common Causes:**
- Missing indexes on frequently queried fields
- Inefficient query structure
- Large dataset without pagination
- Complex joins on unindexed columns

**How to Fix:**
1. Add appropriate indexes
2. Implement caching
3. Optimize query structure
4. Add pagination/limits

---

#### `n_plus_one` 🔴
**Summary:** Multiple queries detected where a single query should suffice.

**Detail:** This pattern suggests an N+1 query issue, where data is fetched in a loop instead of a single batch query.

**Example Problem:**
```javascript
// BAD - N+1 query
const users = await User.find();
for (const user of users) {
  const posts = await Post.find({ userId: user.id }); // Executes N queries
}

// GOOD - Single batch query
const users = await User.find().populate('posts');
```

**How to Fix:**
1. Use batch queries or joins
2. Use ORM populate/include features
3. Implement DataLoader pattern
4. Cache frequently accessed data

---

#### `unbounded_query` 🔴
**Summary:** Query missing limit, potential unbounded data fetch.

**Detail:** This query does not include a LIMIT clause and may return an unexpectedly large dataset, causing memory and performance issues.

**How to Fix:**
1. Always add LIMIT clauses to find queries
2. Implement cursor-based pagination
3. Add default limits at ORM level

---

#### `blocking_io` 🔴
**Summary:** Blocking operations detected on event loop.

**Detail:** Synchronous I/O operations are blocking the event loop, degrading overall application responsiveness.

**How to Fix:**
1. Use async/await for all I/O
2. Avoid synchronous file operations
3. Use worker threads for CPU-intensive tasks
4. Profile event loop lag

---

#### `retry_loop` 🔴
**Summary:** Excessive retries detected on query execution.

**Detail:** Query is being retried multiple times, indicating transient failures, deadlocks, or connectivity issues.

**How to Fix:**
1. Investigate database connectivity
2. Check for deadlocks
3. Implement exponential backoff
4. Add circuit breakers

---

#### `write_contention` 🔴
**Summary:** Repeated writes to the same record detected.

**Detail:** High-frequency writes to the same record may cause lock contention, serialization issues, and performance degradation.

**How to Fix:**
1. Batch updates
2. Use optimistic locking
3. Implement write buffering
4. Consider event sourcing

---

#### `connection_pool_exhaustion` 🔴
**Summary:** Database connection pool nearing or at capacity.

**Detail:** Connection pool is under pressure. This may lead to connection timeouts and failed requests.

**How to Fix:**
1. Increase pool size
2. Investigate connection leaks
3. Implement connection timeout
4. Use connection pooling middleware

---

### WARNING Signals

#### `slow_query` ⚠️
**Summary:** Query exceeded configured threshold.

**Detail:** This query took longer than expected and may impact request latency.

**How to Fix:**
1. Analyze query execution plan
2. Add indexes where needed
3. Optimize query structure
4. Consider caching

---

#### `fan_out` ⚠️
**Summary:** Single request triggered multiple database queries.

**Detail:** Request fans out into many DB queries, indicating potential architectural issues or missing data aggregation.

**How to Fix:**
1. Use batch queries
2. Implement GraphQL DataLoader
3. Add response caching
4. Redesign data model

---

#### `high_variance_latency` ⚠️
**Summary:** Query latency is inconsistent across executions.

**Detail:** High variance in execution time suggests unpredictable performance.

**How to Fix:**
1. Check for cache misses
2. Investigate index selectivity
3. Analyze data distribution
4. Look for resource contention

---

#### `high_cpu` ⚠️
**Summary:** Query or request caused high CPU consumption.

**Detail:** Elevated CPU usage detected during query execution.

**How to Fix:**
1. Optimize complex calculations
2. Push computation to database
3. Add indexes for sorting/filtering
4. Profile query execution

---

#### `high_memory` ⚠️
**Summary:** Query or request caused high memory usage.

**Detail:** Elevated memory consumption detected, potentially due to large result sets.

**How to Fix:**
1. Implement pagination
2. Use streaming for large datasets
3. Select only required fields
4. Add memory limits

---

#### `large_payload` ⚠️
**Summary:** Query returned an excessively large dataset.

**Detail:** The result set size is unusually large, suggesting potential overfetching.

**How to Fix:**
1. Add pagination
2. Use field projection
3. Implement lazy loading
4. Add result size limits

---

#### `deprecated_api` ⚠️
**Summary:** Query used deprecated database methods.

**Detail:** Deprecated database API detected. This may cause issues in future versions.

**How to Fix:**
1. Update to current API
2. Check migration guides
3. Test thoroughly

---

#### `overfetching` ⚠️
**Summary:** Query selects more fields than necessary.

**Detail:** Query retrieves more data than needed.

**How to Fix:**
1. Use SELECT field1, field2 instead of SELECT *
2. Implement GraphQL field selection
3. Use ORM projection features

---

#### `read_heavy_hotspot` ⚠️
**Summary:** High-frequency read operations on specific records.

**Detail:** Concentrated read activity detected on specific data points.

**How to Fix:**
1. Implement caching (Redis, Memcached)
2. Add read replicas
3. Use CDN for static data
4. Denormalize hot data

---

## Good Signals (Healthy Behavior)

All good signals have severity level **INFO** ℹ️

### `fast_query`
Query executed well under threshold, indicating good performance.

### `bounded_query`
Query includes proper LIMIT clause, preventing unbounded data access.

### `indexed_lookup`
Query likely leveraged database index based on performance characteristics.

### `stable_latency`
Query latency is consistent across executions, indicating predictable performance.

### `cached_query`
Query result was served from cache, significantly reducing database load.

### `index_hit`
Confirmed index usage detected, enabling efficient data access.

### `single_query`
Query executed as intended without N+1 patterns.

### `optimized_join`
Join operation completed efficiently using indexes.

### `connection_reused`
Database connection pooling working effectively.

### `low_memory`
Memory-efficient query execution detected.

### `low_cpu`
CPU-efficient query execution.

### `stable_response`
Performance matches expected baselines.

### `cache_candidate`
Query pattern is stable and would benefit from caching.

### `healthy_hot_path`
High-frequency query is fast and stable, indicating well-optimized execution.

---

## Redis Command Monitoring

Arsenic provides special monitoring for Redis commands with automatic categorization and documentation links. Every Redis command is classified into one of four categories — `dangerous`, `blocking`, `slow`, or `normal` — so you can route alerts with precision rather than treating all Redis activity the same.

32 commands are explicitly documented. Any command not in the list defaults to the `normal` category.

### Redis Command Categories

#### Dangerous Commands 🔴

These commands should **never run in production**. They either block the entire Redis server while executing or irreversibly destroy data. Arsenic always flags these regardless of duration.

---

**`KEYS`**
- **Category:** `dangerous`
- **Issue:** Performs a full keyspace scan, blocking all other operations while it runs. On a large dataset this can stall Redis for seconds.
- **Fix:** Use `SCAN` with a cursor for iterative, non-blocking key enumeration.
- **Docs:** https://arsenicdev.online/docs/signals/redis-keys

---

**`FLUSHALL`**
- **Category:** `dangerous`
- **Issue:** Deletes every key in every database on the Redis instance. There is no confirmation prompt and no undo.
- **Fix:** Restrict this command via Redis ACLs. Use targeted `DEL` or `UNLINK` for key removal.
- **Docs:** https://arsenicdev.online/docs/signals/redis-flushall

---

**`FLUSHDB`**
- **Category:** `dangerous`
- **Issue:** Deletes all keys in the currently selected database. Equally destructive within its scope.
- **Fix:** Restrict via ACLs. Use selective key deletion instead.
- **Docs:** https://arsenicdev.online/docs/signals/redis-flushdb

---

#### Blocking Commands ⚠️

These commands block the calling client until data becomes available or a timeout expires. They are valid for specific use cases like task queues, but require deliberate configuration to avoid holding connections indefinitely.

---

**`BLPOP`**
- **Category:** `blocking`
- **Issue:** Blocks the connection until an element is available in one of the specified lists.
- **Use case:** Background job queues, event streams.
- **Caution:** Always set a timeout. Unbounded blocking connections exhaust your connection pool.
- **Docs:** https://arsenicdev.online/docs/signals/redis-blpop

---

**`BRPOP`**
- **Category:** `blocking`
- **Issue:** Blocking right-side pop from a list. Same behavior as `BLPOP` from the tail.
- **Use case:** LIFO task queues.
- **Caution:** Use with a timeout and dedicated connection pool.
- **Docs:** https://arsenicdev.online/docs/signals/redis-brpop

---

**`BRPOPLPUSH`**
- **Category:** `blocking`
- **Issue:** Atomically pops from one list and pushes to another — but blocks until the source list has an element.
- **Use case:** Reliable queue patterns with a processing list.
- **Caution:** Deprecated in Redis 6.2. Prefer `BLMOVE`.
- **Docs:** https://arsenicdev.online/docs/signals/redis-brpoplpush

---

**`BLMOVE`**
- **Category:** `blocking`
- **Issue:** Blocking atomic move between lists. Replaces `BRPOPLPUSH`.
- **Use case:** Reliable queue with acknowledgment.
- **Caution:** Always specify a timeout to prevent indefinite blocking.
- **Docs:** https://arsenicdev.online/docs/signals/redis-blmove

---

#### Slow Commands ⏱️

These commands have O(N) or worse time complexity. They are safe in small datasets but can degrade significantly under load. Arsenic monitors these so you can catch regressions before they become incidents.

---

**`HGETALL`**
- **Issue:** Returns every field and value in a hash. Performance degrades linearly with hash size.
- **Fix:** Use `HMGET` with explicit field names, or `HSCAN` to iterate large hashes.
- **Docs:** https://arsenicdev.online/docs/signals/redis-hgetall

---

**`SMEMBERS`**
- **Issue:** Returns all members of a set — unbounded on large sets.
- **Fix:** Use `SSCAN` to iterate, or `SRANDMEMBER` for sampling.
- **Docs:** https://arsenicdev.online/docs/signals/redis-smembers

---

**`LRANGE`**
- **Issue:** Scans a range of list elements. Wide ranges on large lists are expensive.
- **Fix:** Use narrow ranges or cursor-based pagination.
- **Docs:** https://arsenicdev.online/docs/signals/redis-lrange

---

**`SORT`**
- **Issue:** Sorts list, set, or sorted set elements. Can be memory- and CPU-intensive on large collections, especially with `BY` and `GET` patterns.
- **Fix:** Pre-sort data at write time using a sorted set. Avoid `SORT` in hot paths.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sort

---

**`SCAN`**
- **Issue:** Iterative cursor-based keyspace scan. Non-blocking per call, but still O(N) total work when iterated to completion.
- **Fix:** Use with `COUNT` hints. Move full scans to background jobs; never iterate to completion on a hot request path.
- **Docs:** https://arsenicdev.online/docs/signals/redis-scan

---

**`SSCAN`**
- **Issue:** Cursor-based iteration over a set. O(N) across all set members when iterated to completion.
- **Fix:** Use `COUNT` hints. Prefer `SISMEMBER` or `SMEMBERS` on small sets; move full iterations to background jobs.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sscan

---

**`HSCAN`**
- **Issue:** Cursor-based iteration over a hash. O(N) across all hash fields when iterated to completion.
- **Fix:** Use `COUNT` hints. For targeted access use `HGET`/`HMGET` instead of scanning the full hash.
- **Docs:** https://arsenicdev.online/docs/signals/redis-hscan

---

**`ZSCAN`**
- **Issue:** Cursor-based iteration over a sorted set. O(N) across all members when iterated to completion.
- **Fix:** Use `COUNT` hints. For range access prefer `ZRANGE` with bounds or `ZSCORE`/`ZRANK` for point lookups.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zscan

---

**`SUNION`**
- **Issue:** Computes the union of multiple sets, returning all unique members. O(N) where N is the total number of members across all input sets.
- **Fix:** Cache results with `SUNIONSTORE` + `EXPIRE`. Move to background workers for large or frequently-combined sets.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sunion

---

**`SINTER`**
- **Issue:** Computes the intersection of multiple sets. O(N × M) where N is the smallest set size and M is the number of sets.
- **Fix:** Cache results with `SINTERSTORE`. Place the smallest set first — Redis short-circuits on the smallest input.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sinter

---

**`SDIFF`**
- **Issue:** Computes the difference between sets. O(N) where N is the total number of members in all sets combined.
- **Fix:** Cache results with `SDIFFSTORE`. Denormalise at write time if the diff is queried frequently.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sdiff

---

**`SUNIONSTORE`**
- **Issue:** Computes the union of multiple sets and writes the result to a destination key. Adds a write operation on top of the O(N) union computation.
- **Fix:** Run as a background job with a TTL on the destination key. Reads on the hot path then hit the pre-computed key.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sunionstore

---

**`SINTERSTORE`**
- **Issue:** Computes the intersection of multiple sets and stores it. Same complexity as `SINTER` with an added write.
- **Fix:** Schedule refreshes as a background job. TTL the result key to avoid stale data.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sinterstore

---

**`SDIFFSTORE`**
- **Issue:** Computes the set difference and stores it. O(N) computation plus a write; avoid on the hot request path.
- **Fix:** Run in background workers. Cache the result with an appropriate TTL.
- **Docs:** https://arsenicdev.online/docs/signals/redis-sdiffstore

---

**`ZRANGE`**
- **Issue:** Returns elements from a sorted set between two rank positions. O(log N + M) where M is the number of elements returned. `ZRANGE 0 -1` returns the entire set.
- **Fix:** Always pass explicit rank or score bounds. Paginate with `LIMIT offset count`. Never return the full sorted set unless necessary.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zrange

---

**`ZRANGEBYSCORE`**
- **Issue:** Returns elements within a score range. Linear in the number of elements returned. An open-ended range returns the entire set.
- **Fix:** Narrow the score range. Use `LIMIT offset count` to paginate. Prefer `ZSCORE` for point lookups.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zrangebyscore

---

**`ZRANGEBYLEX`**
- **Issue:** Returns elements within a lexicographic range on a sorted set where all scores are equal. O(log N + M) where M is the number of matched elements.
- **Fix:** Use tight lex bounds. Avoid open-ended `[- [+` ranges on large sets. Paginate with `LIMIT`.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zrangebylex

---

**`ZREVRANGE`**
- **Issue:** Returns elements from a sorted set in reverse rank order. Same complexity as `ZRANGE`; `ZREVRANGE 0 -1` returns the entire set reversed.
- **Fix:** Specify tight rank bounds. Paginate. In Redis 6.2+ prefer `ZRANGE ... REV` with `LIMIT`.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zrevrange

---

**`ZREVRANGEBYSCORE`**
- **Issue:** Returns elements within a score range in descending order. Linear in elements returned; open score ranges are unbounded.
- **Fix:** Always bound the score range. Paginate with `LIMIT offset count`. In Redis 6.2+ migrate to `ZRANGE ... BYSCORE REV LIMIT`.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zrevrangebyscore

---

**`ZINTERSTORE`**
- **Issue:** Computes the intersection of multiple sorted sets and stores the result. O(N × K log K) where N is the smallest set and K is the number of input sets. Expensive with large inputs.
- **Fix:** Cache results. Run in background workers rather than on the request path. TTL the destination key.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zinterstore

---

**`ZUNIONSTORE`**
- **Issue:** Computes the union of multiple sorted sets and stores the result. O(N) + O(M log M) where N is total member count and M is the result set size.
- **Fix:** Cache results with a TTL. Run as a scheduled background job. For small stable inputs, consider application-side aggregation.
- **Docs:** https://arsenicdev.online/docs/signals/redis-zunionstore

---

**`OBJECT`**
- **Issue:** Inspects internal Redis object metadata (encoding, idle time, frequency). Rarely expensive but adds overhead in tight loops.
- **Fix:** Use only for diagnostics, not in hot paths.
- **Docs:** https://arsenicdev.online/docs/signals/redis-object

---

**`WAIT`**
- **Issue:** Blocks the client until a specified number of replicas acknowledge the write, or until the timeout expires. Adds latency proportional to replication lag.
- **Fix:** Use only when strong consistency is required. Set a reasonable timeout.
- **Docs:** https://arsenicdev.online/docs/signals/redis-wait

---

#### Normal Commands 🟢

These commands are tracked by the adapter but emit no warning or critical signals under normal usage. They are included so you can observe them in event output and build custom alerting if needed.

---

**`MULTI`**
- **Category:** `normal`
- **Issue:** Opens a Redis transaction block. On its own it is O(1) and has negligible overhead. However, a `MULTI` block that queues a large number of commands or wraps slow commands inherits the cost of everything it contains.
- **Caution:** Transactions do not provide rollback — if a queued command errors, the rest of the pipeline still executes. Monitor the duration of the full `MULTI`/`EXEC` block, not individual commands.
- **Docs:** https://arsenicdev.online/docs/signals/redis-multi

---

**`EXEC`**
- **Category:** `normal`
- **Issue:** Executes all commands queued since the preceding `MULTI`. Duration reflects the cumulative cost of every queued command. An `EXEC` that is consistently slow means the transaction contains expensive operations.
- **Caution:** `EXEC` returns `null` if a `WATCH`-ed key was modified — always handle the `null` case to avoid silent data loss.
- **Docs:** https://arsenicdev.online/docs/signals/redis-exec

---

### Using Redis Command Info

```typescript
import { getRedisCommandInfo } from '@periodic/arsenic';

const info = getRedisCommandInfo('KEYS');
console.log(info);
// Output: { command: 'KEYS', category: 'dangerous', docs: 'https://arsenicdev.online/docs/signals/redis-keys' }

// Commands not in the explicit list default to 'normal' — no signal page, fallback URL
const info2 = getRedisCommandInfo('GET');
// { command: 'GET', category: 'normal', docs: 'https://arsenicdev.online/docs/adapters/redis' }
// 'normal' category commands emit no warning/critical signals under standard usage
```

---

### Event Structure with Redis

Redis events include `commandCategory` and `commandDocs` in the `metadata` field, giving your exporter everything it needs to make routing decisions without additional lookups:

```json
{
  "type": "db.query",
  "db": "redis",
  "adapter": "ioredis",
  "operation": "HGETALL",
  "durationMs": 84,
  "slow": true,
  "signals": ["slow_query"],
  "severity": "warning",
  "metadata": {
    "command": "HGETALL",
    "commandCategory": "slow",
    "commandDocs": "https://arsenicdev.online/docs/signals/redis-hgetall",
    "args": ["user:123"]
  },
  "request": {
    "id": "req_4a91",
    "method": "GET",
    "route": "/api/users/:id"
  },
  "callsite": {
    "file": "src/services/UserService.ts",
    "line": 62
  },
  "timestamp": "2024-02-13T10:30:00.000Z"
}
```

---

### Monitoring Redis in Production

**Alert on dangerous commands:**

```typescript
import { createMonitor, redisAdapter } from '@periodic/arsenic';

const monitor = createMonitor({
  exporter: (event) => {
    if (event.metadata?.commandCategory === 'dangerous') {
      // Page immediately — KEYS, FLUSHALL, FLUSHDB in production is never acceptable
      sendToPagerDuty({
        severity: 'critical',
        message: `Dangerous Redis command: ${event.operation}`,
        event,
      });
    }
  },
});

redisAdapter(monitor, redis);
```

**Track slow commands:**

```typescript
const monitor = createMonitor({
  slowQueryThresholdMs: 50,
  exporter: (event) => {
    if (event.metadata?.commandCategory === 'slow' && event.slow) {
      logger.warn('Slow Redis command exceeded threshold', {
        command: event.operation,
        durationMs: event.durationMs,
        args: event.metadata.args,
        docs: event.metadata.commandDocs,
      });
    }
  },
});
```

**Category-based routing:**

```typescript
import { SignalSeverity } from '@periodic/arsenic';

const monitor = createMonitor({
  exporter: (event) => {
    const category = event.metadata?.commandCategory;

    switch (category) {
      case 'dangerous':
        // Immediate alert — these should never fire in production
        sendToPagerDuty(event);
        break;

      case 'blocking':
        // Warn if blocking commands are taking longer than expected
        if (event.slow) sendToSlack(event);
        break;

      case 'slow':
        // Log for trend analysis; alert if crossing severity threshold
        logger.warn('redis.slow_command', event);
        if (event.severity === SignalSeverity.CRITICAL) sendToSlack(event);
        break;

      default:
        // Normal commands — log at info level
        logger.info('redis.query', event);
    }
  },
});
```

---

## Using Signals in Production

### Filtering by Severity

```typescript
const monitor = createMonitor({
  exporter: (event) => {
    // Only alert on critical signals
    if (event.severity === SignalSeverity.CRITICAL) {
      sendToSlack(event);
    }
    
    // Log all warnings
    if (event.severity === SignalSeverity.WARNING) {
      logger.warn(event);
    }
  }
});
```

### Signal-Based Alerting

```typescript
const monitor = createMonitor({
  exporter: (event) => {
    const criticalSignals = ['hot_path', 'n_plus_one', 'unbounded_query'];
    
    if (event.signals.some(s => criticalSignals.includes(s))) {
      triggerPagerDuty(event);
    }
  }
});
```

### Tracking Signal Trends

```typescript
const signalCounts = new Map();

const monitor = createMonitor({
  exporter: (event) => {
    event.signals.forEach(signal => {
      signalCounts.set(signal, (signalCounts.get(signal) || 0) + 1);
    });
    
    // Report metrics every 60 seconds
    if (Date.now() % 60000 < 1000) {
      sendMetrics(signalCounts);
    }
  }
});
```

---

## Signal Explanations in Events

Every signal includes detailed explanations:

```json
{
  "signals": ["hot_path", "unbounded_query"],
  "explanations": {
    "hot_path": {
      "summary": "This query is both slow and frequently executed.",
      "detail": "It appears on a hot execution path...",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/hot-path"
    },
    "unbounded_query": {
      "summary": "Query missing limit, potential unbounded data fetch.",
      "detail": "This query does not include a LIMIT clause...",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/unbounded-query"
    }
  }
}
```