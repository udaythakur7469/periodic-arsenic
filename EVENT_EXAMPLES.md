# Complete ForgeEvent JSON Object Examples

## Example 1: Critical Signal - Hot Path Query (MongoDB)

```json
{
  "type": "db.query",
  "db": "mongodb",
  "adapter": "mongoose",
  "model": "User",
  "operation": "findOne",
  "durationMs": 342,
  "slow": true,
  "signals": ["slow_query", "hot_path", "unbounded_query"],
  "severity": "critical",
  "explanations": {
    "slow_query": {
      "summary": "Query exceeded configured threshold.",
      "detail": "This query took longer than expected and may impact request latency.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/slow-query"
    },
    "hot_path": {
      "summary": "This query is both slow and frequently executed.",
      "detail": "It appears on a hot execution path and contributes significantly to overall request latency. This is a high-priority optimization target.",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/hot-path"
    },
    "unbounded_query": {
      "summary": "Query missing limit, potential unbounded data fetch.",
      "detail": "This query does not include a LIMIT clause and may return an unexpectedly large dataset, causing memory and performance issues.",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/unbounded-query"
    }
  },
  "request": {
    "id": "req_8f29a3b1c",
    "method": "GET",
    "route": "/api/users/:id",
    "userId": "user_abc123"
  },
  "callsite": {
    "file": "/src/routes/users.ts",
    "line": 42
  },
  "timestamp": "2025-02-11T15:30:45.123Z",
  "metadata": {
    "limit": null
  }
}
```

---

## Example 2: N+1 Query Pattern (PostgreSQL)

```json
{
  "type": "db.query",
  "db": "postgres",
  "adapter": "pg",
  "model": "posts",
  "operation": "select",
  "durationMs": 156,
  "slow": false,
  "signals": ["n_plus_one"],
  "severity": "critical",
  "explanations": {
    "n_plus_one": {
      "summary": "Multiple queries detected where a single query should suffice.",
      "detail": "This pattern suggests an N+1 query issue, where data is fetched in a loop instead of a single batch query. This severely impacts performance at scale.",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/n-plus-one"
    }
  },
  "request": {
    "id": "req_7k3m9x2p",
    "method": "GET",
    "route": "/api/posts",
    "userId": "user_xyz789"
  },
  "callsite": {
    "file": "/src/services/postService.ts",
    "line": 78
  },
  "timestamp": "2025-02-11T15:31:12.456Z",
  "metadata": {
    "query": "SELECT * FROM posts WHERE user_id = $1",
    "rowsAffected": 1
  }
}
```

---

## Example 3: High Resource Usage (Prisma)

```json
{
  "type": "db.query",
  "db": "postgres",
  "adapter": "prisma",
  "model": "Order",
  "operation": "findMany",
  "durationMs": 523,
  "slow": true,
  "signals": ["slow_query", "high_cpu", "high_memory", "large_payload"],
  "severity": "critical",
  "explanations": {
    "slow_query": {
      "summary": "Query exceeded configured threshold.",
      "detail": "This query took longer than expected and may impact request latency.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/slow-query"
    },
    "high_cpu": {
      "summary": "Query or request caused high CPU consumption.",
      "detail": "Elevated CPU usage detected during query execution, indicating compute-intensive operations that may benefit from optimization.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/high-cpu"
    },
    "high_memory": {
      "summary": "Query or request caused high memory usage.",
      "detail": "Elevated memory consumption detected, potentially due to large result sets, inefficient data structures, or memory leaks.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/high-memory"
    },
    "large_payload": {
      "summary": "Query returned an excessively large dataset.",
      "detail": "The result set size is unusually large, suggesting potential overfetching, missing pagination, or inefficient data retrieval.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/large-payload"
    }
  },
  "request": {
    "id": "req_9n2k5v8x",
    "method": "GET",
    "route": "/api/orders/export",
    "userId": "admin_001"
  },
  "callsite": {
    "file": "/src/controllers/orderController.ts",
    "line": 134
  },
  "timestamp": "2025-02-11T15:32:08.789Z",
  "metadata": {
    "args": {
      "where": {},
      "include": {
        "items": true,
        "customer": true,
        "payments": true
      }
    },
    "cpuUsage": 85.3,
    "memoryUsage": 157286400,
    "payloadSize": 2097152,
    "rowsAffected": 15000
  }
}
```

---

## Example 4: Redis Slow Command

```json
{
  "type": "db.query",
  "db": "redis",
  "adapter": "ioredis",
  "model": "user:*",
  "operation": "keys",
  "durationMs": 1250,
  "slow": true,
  "signals": ["slow_query", "deprecated_api", "blocking_io"],
  "severity": "critical",
  "explanations": {
    "slow_query": {
      "summary": "Query exceeded configured threshold.",
      "detail": "This query took longer than expected and may impact request latency.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/slow-query"
    },
    "deprecated_api": {
      "summary": "Query used deprecated database methods.",
      "detail": "Deprecated database API detected. This may cause issues in future database versions and should be updated.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/deprecated-api"
    },
    "blocking_io": {
      "summary": "Blocking operations detected on event loop.",
      "detail": "Synchronous I/O operations are blocking the event loop, degrading overall application responsiveness. This is critical in Node.js environments.",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/blocking-io"
    }
  },
  "request": {
    "id": "req_2h7k9m3n",
    "method": "POST",
    "route": "/api/cache/clear",
    "userId": "admin_002"
  },
  "callsite": {
    "file": "/src/services/cacheService.ts",
    "line": 56
  },
  "timestamp": "2025-02-11T15:33:22.001Z",
  "metadata": {
    "command": "KEYS",
    "args": ["user:*"]
  }
}
```

---

## Example 5: Good Signals (Healthy Query)

```json
{
  "type": "db.query",
  "db": "postgres",
  "adapter": "prisma",
  "model": "Product",
  "operation": "findUnique",
  "durationMs": 8,
  "slow": false,
  "signals": ["fast_query", "bounded_query", "indexed_lookup", "stable_latency", "connection_reused", "low_cpu", "low_memory"],
  "severity": "info",
  "explanations": {
    "fast_query": {
      "summary": "Query executed well under threshold.",
      "detail": "This query completed quickly and efficiently, indicating good performance.",
      "severity": "info",
      "docs": "https://arsenicdev.online/docs/signals/fast-query"
    },
    "bounded_query": {
      "summary": "Query includes proper limits.",
      "detail": "This query is properly bounded with a LIMIT clause, preventing unbounded data access and ensuring predictable performance.",
      "severity": "info",
      "docs": "https://arsenicdev.online/docs/signals/bounded-query"
    },
    "indexed_lookup": {
      "summary": "Query likely leveraged database index.",
      "detail": "The query pattern and performance characteristics suggest efficient index usage, enabling fast data retrieval.",
      "severity": "info",
      "docs": "https://arsenicdev.online/docs/signals/indexed-lookup"
    },
    "stable_latency": {
      "summary": "Query latency is consistent across executions.",
      "detail": "Predictable, low-variance performance indicates well-optimized query execution and stable system conditions.",
      "severity": "info",
      "docs": "https://arsenicdev.online/docs/signals/stable-latency"
    },
    "connection_reused": {
      "summary": "Database connection reused, reducing overhead.",
      "detail": "Connection pooling working effectively, avoiding costly connection establishment overhead.",
      "severity": "info",
      "docs": "https://arsenicdev.online/docs/signals/connection-reused"
    },
    "low_cpu": {
      "summary": "Query executed with low CPU usage.",
      "detail": "CPU-efficient query execution, indicating well-optimized database operations.",
      "severity": "info",
      "docs": "https://arsenicdev.online/docs/signals/low-cpu"
    },
    "low_memory": {
      "summary": "Query executed with low memory footprint.",
      "detail": "Memory-efficient query execution detected, indicating good data handling practices.",
      "severity": "info",
      "docs": "https://arsenicdev.online/docs/signals/low-memory"
    }
  },
  "request": {
    "id": "req_5p8k2n9m",
    "method": "GET",
    "route": "/api/products/:id",
    "userId": "user_def456"
  },
  "callsite": {
    "file": "/src/routes/products.ts",
    "line": 23
  },
  "timestamp": "2025-02-11T15:34:15.567Z",
  "metadata": {
    "args": {
      "where": {
        "id": "prod_12345"
      }
    },
    "cpuUsage": 12.5,
    "memoryUsage": 8388608,
    "connectionReused": true,
    "indexUsed": true,
    "rowsAffected": 1
  }
}
```

---

## Example 6: Cache Hit with Write Contention

```json
{
  "type": "db.query",
  "db": "mongodb",
  "adapter": "mongoose",
  "model": "Counter",
  "operation": "updateOne",
  "durationMs": 89,
  "slow": false,
  "signals": ["write_contention"],
  "severity": "critical",
  "explanations": {
    "write_contention": {
      "summary": "Repeated writes to the same record detected.",
      "detail": "High-frequency writes to the same record may cause lock contention, serialization issues, and performance degradation.",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/write-contention"
    }
  },
  "request": {
    "id": "req_1k9m3n7p",
    "method": "POST",
    "route": "/api/stats/increment",
    "userId": "user_ghi789"
  },
  "callsite": {
    "file": "/src/services/statsService.ts",
    "line": 91
  },
  "timestamp": "2025-02-11T15:35:03.234Z",
  "metadata": {
    "cacheHit": false
  }
}
```

---

## Example 7: Fan-Out with Retry Loop

```json
{
  "type": "db.query",
  "db": "postgres",
  "adapter": "pg",
  "model": "inventory",
  "operation": "update",
  "durationMs": 678,
  "slow": true,
  "signals": ["slow_query", "fan_out", "retry_loop"],
  "severity": "critical",
  "explanations": {
    "slow_query": {
      "summary": "Query exceeded configured threshold.",
      "detail": "This query took longer than expected and may impact request latency.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/slow-query"
    },
    "fan_out": {
      "summary": "Single request triggered multiple database queries.",
      "detail": "Request fans out into many DB queries, indicating potential architectural issues or missing data aggregation.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/fan-out"
    },
    "retry_loop": {
      "summary": "Excessive retries detected on query execution.",
      "detail": "Query is being retried multiple times, indicating transient failures, deadlocks, or connectivity issues that need investigation.",
      "severity": "critical",
      "docs": "https://arsenicdev.online/docs/signals/retry-loop"
    }
  },
  "request": {
    "id": "req_4m8k3p7n",
    "method": "POST",
    "route": "/api/checkout",
    "userId": "user_jkl012"
  },
  "callsite": {
    "file": "/src/services/checkoutService.ts",
    "line": 156
  },
  "timestamp": "2025-02-11T15:36:41.890Z",
  "metadata": {
    "query": "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2",
    "rowsAffected": 1,
    "retryCount": 5
  }
}
```

---

## Example 8: Without Request Context (Background Job)

```json
{
  "type": "db.query",
  "db": "postgres",
  "adapter": "prisma",
  "model": "Report",
  "operation": "aggregate",
  "durationMs": 2340,
  "slow": true,
  "signals": ["slow_query", "large_payload"],
  "severity": "warning",
  "explanations": {
    "slow_query": {
      "summary": "Query exceeded configured threshold.",
      "detail": "This query took longer than expected and may impact request latency.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/slow-query"
    },
    "large_payload": {
      "summary": "Query returned an excessively large dataset.",
      "detail": "The result set size is unusually large, suggesting potential overfetching, missing pagination, or inefficient data retrieval.",
      "severity": "warning",
      "docs": "https://arsenicdev.online/docs/signals/large-payload"
    }
  },
  "callsite": {
    "file": "/src/jobs/reportGenerator.ts",
    "line": 203
  },
  "timestamp": "2025-02-11T15:37:29.456Z",
  "metadata": {
    "args": {
      "_sum": {
        "revenue": true,
        "orders": true
      },
      "where": {
        "createdAt": {
          "gte": "2025-01-01",
          "lte": "2025-02-01"
        }
      }
    },
    "payloadSize": 3145728,
    "rowsAffected": 50000
  }
}
```

---

## Field Reference

### Always Present Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"db.query"` | Event type identifier |
| `db` | `string` | Database type (mongodb, postgres, redis, etc.) |
| `adapter` | `string` | Adapter name (mongoose, prisma, pg, ioredis, etc.) |
| `model` | `string` | Model/table/collection name |
| `operation` | `string` | Operation type (find, select, update, etc.) |
| `durationMs` | `number` | Query duration in milliseconds |
| `slow` | `boolean` | Whether query exceeded threshold |
| `signals` | `string[]` | Array of detected signal types |
| `severity` | `"critical" \| "warning" \| "info"` | Overall event severity |
| `explanations` | `object` | Signal explanations keyed by signal type |
| `timestamp` | `string` | ISO 8601 timestamp |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `request` | `object` | HTTP request context (if available) |
| `request.id` | `string` | Unique request identifier |
| `request.method` | `string` | HTTP method (GET, POST, etc.) |
| `request.route` | `string` | Route pattern |
| `request.userId` | `string` | User ID (if provided) |
| `callsite` | `object` | Source code location |
| `callsite.file` | `string` | File path |
| `callsite.line` | `number` | Line number |
| `metadata` | `object` | Adapter-specific metadata |

### Metadata Fields (Adapter-Specific)

| Field | Type | Adapters | Description |
|-------|------|----------|-------------|
| `limit` | `number \| null` | mongoose, prisma | Query limit value |
| `query` | `string` | pg, prisma | Raw SQL query |
| `rowsAffected` | `number` | pg, prisma | Number of rows affected |
| `cpuUsage` | `number` | all | CPU usage percentage |
| `memoryUsage` | `number` | all | Memory usage in bytes |
| `cacheHit` | `boolean` | all | Whether result came from cache |
| `payloadSize` | `number` | all | Response payload size in bytes |
| `retryCount` | `number` | all | Number of retry attempts |
| `connectionReused` | `boolean` | all | Whether connection was reused |
| `indexUsed` | `boolean` | all | Whether index was used |
| `joinType` | `string` | prisma, pg | Type of join (indexed, nested, etc.) |
| `command` | `string` | redis | Redis command name |
| `args` | `any` | prisma, redis | Query arguments |
| `error` | `string` | all | Error message (if query failed) |

---

## Complete TypeScript Interface

```typescript
interface ForgeEvent {
  type: 'db.query';
  db: string;
  adapter: string;
  model: string;
  operation: string;
  durationMs: number;
  slow: boolean;
  signals: string[];
  severity: 'critical' | 'warning' | 'info';
  explanations: Record<string, {
    summary: string;
    detail: string;
    severity: 'critical' | 'warning' | 'info';
    docs?: string;
  }>;
  request?: {
    id: string;
    method: string;
    route: string;
    userId?: string;
  };
  callsite?: {
    file: string;
    line: number;
  };
  timestamp: string;
  metadata?: {
    limit?: number | null;
    query?: string;
    rowsAffected?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    cacheHit?: boolean;
    payloadSize?: number;
    retryCount?: number;
    connectionReused?: boolean;
    indexUsed?: boolean;
    joinType?: string;
    command?: string;
    args?: any;
    error?: string;
    [key: string]: any;
  };
}
```