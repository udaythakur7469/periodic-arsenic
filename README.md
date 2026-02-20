# 🔬 Periodic Arsenic

[![npm version](https://img.shields.io/npm/v/@periodic/arsenic.svg)](https://www.npmjs.com/package/@periodic/arsenic)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

**Production-grade, framework-agnostic semantic runtime monitoring library for Node.js with TypeScript support**

Part of the **Periodic** series of Node.js packages by Uday Thakur.

---

## 💡 Why Arsenic?

**Arsenic** gets its name from the chemical element known for its dual nature — both toxic and medicinal depending on concentration. Just like how arsenic in the right hands reveals what's harmful, this library **reveals what's breaking your system** — turning invisible performance problems into clear, actionable signals.

In chemistry, arsenic is a metalloid renowned for its sensitivity in trace detection, historically used to uncover hidden threats. Similarly, **@periodic/arsenic** was forged through real-world production experience to surface the hidden signals your backend is already emitting — before they become incidents.

The name represents:
- **Detection**: Surfaces signals invisible to traditional monitoring
- **Precision**: Semantic judgments, not raw numbers
- **Awareness**: Request-aware context for every database query
- **Clarity**: Explains *why* a system is slow, not just *that* it is slow

Just as arsenic is a powerful diagnostic tool in the right hands, **@periodic/arsenic** serves as the foundational observability layer for production-grade Node.js applications.

---

## 🎯 Why Choose Arsenic?

Building robust backends requires understanding performance *in context*, but most observability solutions fall short:

- **Metrics tools** tell you *that* something is slow, not *why*
- **APM vendors** lock you into proprietary dashboards and formats
- **Manual logging** is inconsistent and misses cross-cutting patterns
- **Query analyzers** work in isolation without request context
- **Tracing tools** require heavy instrumentation and steep learning curves

**Periodic Arsenic** provides the perfect solution:

✅ **Zero dependencies** — Pure TypeScript monitoring core  
✅ **Framework-agnostic** — Safe for use in both libraries and applications  
✅ **30+ Production Signals** — Critical, Warning, and Info classifications  
✅ **Request Correlation** — Every query linked to the HTTP request that triggered it  
✅ **Multi-Database** — Prisma, Mongoose, PostgreSQL, and Redis support  
✅ **Multi-Framework** — Express and Fastify ready  
✅ **OpenTelemetry** — Built-in OTEL exporter  
✅ **Callsite Attribution** — Know exactly which file and line triggered a query  
✅ **Semantic Explanations** — Human-readable descriptions of every signal  
✅ **Type-safe** — Strict TypeScript from the ground up  
✅ **No global state** — No side effects on import  
✅ **Production-ready** — Non-blocking, never crashes your app

---

## 📦 Installation

```bash
npm install @periodic/arsenic
```

Or with yarn:

```bash
yarn add @periodic/arsenic
```

**Optional peer dependencies** (install only what you need):

```bash
# Database adapters
npm install mongoose          # For MongoDB
npm install @prisma/client    # For SQL via Prisma
npm install pg                # For PostgreSQL
npm install redis ioredis     # For Redis

# Framework support
npm install express           # For Express
npm install fastify           # For Fastify

# Exporters
npm install @opentelemetry/api  # For OpenTelemetry
```

---

## 🚀 Quick Start

```typescript
import express from 'express';
import mongoose from 'mongoose';
import {
  createMonitor,
  expressContext,
  mongooseAdapter,
} from '@periodic/arsenic';

const app = express();

// 1. Create monitor
const monitor = createMonitor({
  slowQueryThresholdMs: 200,
  exporter: (event) => {
    console.log(JSON.stringify(event, null, 2));
  },
});

// 2. Attach Express context
app.use(expressContext(monitor));

// 3. Instrument Mongoose
mongooseAdapter(monitor, mongoose);

// 4. Write normal app code — Arsenic observes automatically
app.get('/users/:id', async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  res.json(user);
});

app.listen(3000);
```

**Example Event Output:**

```json
{
  "type": "db.query",
  "db": "mongodb",
  "adapter": "mongoose",
  "model": "User",
  "operation": "findOne",
  "durationMs": 312,
  "slow": true,
  "signals": ["hot_path", "unbounded_query"],
  "severity": "critical",
  "explanations": {
    "hot_path": {
      "summary": "This query is both slow and frequently executed.",
      "detail": "It appears on a hot execution path and has outsized impact on overall latency.",
      "severity": "critical"
    }
  },
  "request": {
    "id": "req_8f29",
    "method": "GET",
    "route": "/users/:id"
  },
  "callsite": {
    "file": "src/routes/users.ts",
    "line": 14
  },
  "timestamp": "2024-02-13T10:30:00.000Z"
}
```

---

## 🧠 Core Concepts

### The `createMonitor` Function

- **`createMonitor` is the primary factory function**
- Returns a configured `Monitor` instance
- Accepts flexible configuration options
- **This is the main entry point for all applications**
- No global state, safe for multi-tenant apps

**Typical usage:**
- Application code creates monitors with `createMonitor()`
- Database adapters attach to the monitor for instrumentation
- Framework middleware attaches request context automatically
- Exporters receive structured events for routing to your stack

```typescript
const monitor = createMonitor({
  slowQueryThresholdMs: 200,
  emitPositiveSignals: false,
  includeDocs: true,
  exporter: (event) => console.log(event),
});
```

### The `Monitor` Class

- **`Monitor` is the core observation engine**
- Correlates database queries to active HTTP requests
- Detects 30+ semantic signals across three severity levels
- **Never blocks** — all exports are asynchronous and safe
- Callsite attribution pinpoints the exact source of every query

**Design principle:**
> Applications create monitors, adapters observe queries, exporters decide where data goes.

```typescript
// Signal-based routing
exporter: (event) => {
  if (event.severity === 'critical') sendToPagerDuty(event);
  else if (event.severity === 'warning') sendToSlack(event);
  else logger.info(event);
},
```

---

## ✨ Features

### 🔴 Critical Signals (16)

High-impact issues that require immediate attention:

```
hot_path              — Slow query on a frequently hit execution path
n_plus_one            — Multiple queries where one should suffice
unbounded_query       — Missing LIMIT clause on large collections
blocking_io           — Event loop blocking operations detected
retry_loop            — Excessive query retries
write_contention      — High-frequency writes to the same record
connection_pool_exhaustion — Pool at capacity
```

### ⚠️ Warning Signals (9)

Issues worth tracking before they escalate:

```
slow_query            — Exceeded configured threshold
fan_out               — Too many queries per request
high_variance_latency — Inconsistent performance across requests
high_cpu              — Elevated CPU usage during query
high_memory           — Elevated memory usage
large_payload         — Excessive data returned from query
deprecated_api        — Using deprecated database methods
overfetching          — Selecting unnecessary fields
read_heavy_hotspot    — Concentrated read activity on a single record
```

### ℹ️ Info Signals (14 — opt-in)

Positive signals confirming healthy patterns:

```
fast_query            — Well under the configured threshold
bounded_query         — Proper LIMIT usage detected
indexed_lookup        — Efficient index usage confirmed
stable_latency        — Consistent performance across requests
cached_query          — Cache hit detected
index_hit             — Confirmed index usage
single_query          — No N+1 patterns detected
optimized_join        — Efficient joins in use
connection_reused     — Connection pool working well
low_memory            — Memory efficient query
low_cpu               — CPU efficient operation
stable_response       — Matches performance benchmarks
cache_candidate       — Query would benefit from caching
healthy_hot_path      — Optimized hot path performing well
```

Enable info signals:

```typescript
const monitor = createMonitor({
  emitPositiveSignals: true,
  exporter: (event) => {
    if (event.signals.includes('cache_candidate')) {
      console.log('Consider caching:', event.model);
    }
  },
});
```

### 🔗 Request Correlation

Every database query is automatically linked to the HTTP request that triggered it:

```typescript
// Express middleware attaches context automatically
app.use(expressContext(monitor));

// Now every query inside a request handler is correlated
app.get('/api/orders', async (req, res) => {
  const orders = await Order.find({ userId: req.user.id });
  // Event will include request.method, request.route, request.id
  res.json(orders);
});
```

**Event output:**

```json
{
  "request": {
    "id": "req_8f29",
    "method": "GET",
    "route": "/api/orders",
    "userId": "user_123"
  }
}
```

### 📍 Callsite Attribution

Know exactly which file and line triggered a slow query:

```json
{
  "callsite": {
    "file": "src/services/OrderService.ts",
    "line": 47
  }
}
```

### 🔌 Adapters

#### Mongoose

```typescript
import mongoose from 'mongoose';
import { mongooseAdapter } from '@periodic/arsenic';

mongooseAdapter(monitor, mongoose);
```

#### Prisma

```typescript
import { PrismaClient } from '@prisma/client';
import { prismaAdapter } from '@periodic/arsenic';

const prisma = new PrismaClient();
prismaAdapter(monitor, prisma);
```

#### PostgreSQL (pg)

```typescript
import { Pool } from 'pg';
import { pgAdapter } from '@periodic/arsenic';

const pool = new Pool();
pgAdapter(monitor, pool);
```

#### Redis (ioredis / redis)

```typescript
import Redis from 'ioredis';
import { redisAdapter, SLOW_REDIS_COMMANDS } from '@periodic/arsenic';

const redis = new Redis();

const monitor = createMonitor({
  slowQueryThresholdMs: 50,
  exporter: (event) => {
    if (SLOW_REDIS_COMMANDS.includes(event.operation)) {
      console.warn('[SLOW REDIS COMMAND]', event);
    }
  },
});

redisAdapter(monitor, redis);
```

### 📊 Multiple Exporters

Send events to multiple destinations:

```typescript
const exporters = [
  (event) => console.log(event),
  async (event) => await sendToDatadog(event),
  async (event) => await saveToDB(event),
];

const monitor = createMonitor({
  exporter: async (event) => {
    await Promise.allSettled(exporters.map((ex) => ex(event)));
  },
});
```

---

## 📚 Common Patterns

### 1. Express + MongoDB

```typescript
import express from 'express';
import mongoose from 'mongoose';
import { createMonitor, expressContext, mongooseAdapter } from '@periodic/arsenic';

const app = express();

const monitor = createMonitor({
  slowQueryThresholdMs: 200,
  exporter: (event) => {
    if (event.severity === 'critical') sendToPagerDuty(event);
  },
});

app.use(expressContext(monitor));
mongooseAdapter(monitor, mongoose);

app.listen(3000);
```

### 2. Express + PostgreSQL

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createMonitor, expressContext, pgAdapter } from '@periodic/arsenic';

const app = express();
const pool = new Pool();

const monitor = createMonitor({
  slowQueryThresholdMs: 150,
  exporter: (event) => {
    if (event.severity === 'critical') sendToSlack(event);
  },
});

app.use(expressContext(monitor));
pgAdapter(monitor, pool);

app.listen(3000);
```

### 3. Fastify Integration

```typescript
import Fastify from 'fastify';
import { createMonitor, fastifyContext, prismaAdapter } from '@periodic/arsenic';

const app = Fastify();

const monitor = createMonitor({
  slowQueryThresholdMs: 200,
  exporter: (event) => logger.info(event),
});

app.register(fastifyContext(monitor, {
  attachUser: (req) => req.user?.id,
}));

prismaAdapter(monitor, prisma);

app.listen({ port: 3000 });
```

### 4. OpenTelemetry Exporter

```typescript
import { createMonitor, createOtelExporter } from '@periodic/arsenic';

const monitor = createMonitor({
  exporter: createOtelExporter({
    serviceName: 'my-service',
    exportAsSpans: true,
    exportAsMetrics: true,
  }),
});
```

### 5. Severity-Based Alerting

```typescript
import { SignalSeverity } from '@periodic/arsenic';

const monitor = createMonitor({
  exporter: (event) => {
    switch (event.severity) {
      case SignalSeverity.CRITICAL:
        sendToPagerDuty(event);
        break;
      case SignalSeverity.WARNING:
        sendToSlack(event);
        break;
      case SignalSeverity.INFO:
        logger.info(event);
        break;
    }
  },
});
```

### 6. Custom Thresholds per Database

```typescript
const pgMonitor = createMonitor({
  slowQueryThresholdMs: 100,  // Stricter for SQL
  exporter: pgExporter,
});

const mongoMonitor = createMonitor({
  slowQueryThresholdMs: 300,  // Looser for MongoDB
  exporter: mongoExporter,
});

pgAdapter(pgMonitor, pool);
mongooseAdapter(mongoMonitor, mongoose);
```

### 7. Structured Logging Integration

```typescript
import { createLogger, ConsoleTransport, JsonFormatter } from '@periodic/iridium';

const logger = createLogger({
  transports: [new ConsoleTransport({ formatter: new JsonFormatter() })],
});

const monitor = createMonitor({
  exporter: (event) => logger.info('arsenic.query', event),
});
```

### 8. Production Configuration

```typescript
import { createMonitor, createOtelExporter, SignalSeverity } from '@periodic/arsenic';

const isDevelopment = process.env.NODE_ENV === 'development';

const monitor = createMonitor({
  slowQueryThresholdMs: isDevelopment ? 500 : 200,
  emitPositiveSignals: false,
  includeDocs: true,

  exporter: async (event) => {
    // Always log everything structured
    logger.info('db.event', event);

    // Alert on critical in production
    if (!isDevelopment && event.severity === SignalSeverity.CRITICAL) {
      await sendToPagerDuty(event);
    }

    // Warn on warning in all environments
    if (event.severity === SignalSeverity.WARNING) {
      await sendToSlack(event);
    }
  },
});

export default monitor;
```

---

## 🎛️ Configuration Options

### Monitor Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `slowQueryThresholdMs` | `number` | `200` | Threshold in ms for slow query detection |
| `exporter` | `Exporter` | — | Required. Receives all emitted events |
| `emitPositiveSignals` | `boolean` | `false` | Enable INFO-level signals |
| `includeDocs` | `boolean` | `true` | Include explanations in events |

```typescript
const monitor = createMonitor({
  slowQueryThresholdMs: 200,
  emitPositiveSignals: false,
  includeDocs: true,
  exporter: (event) => console.log(event),
});
```

### Framework Adapter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `attachUser` | `(req) => string \| undefined` | — | Extract user ID from request |

```typescript
app.use(expressContext(monitor, {
  attachUser: (req) => req.user?.id,
}));
```

---

## 📋 API Reference

### `createMonitor(config)`

Create a new monitor instance.

```typescript
function createMonitor(config: MonitorConfig): Monitor
```

### Framework Adapters

```typescript
expressContext(monitor: Monitor, options?: { attachUser?: (req) => string | undefined }): RequestHandler
fastifyContext(monitor: Monitor, options?: { attachUser?: (req) => string | undefined }): FastifyPlugin
```

### Database Adapters

```typescript
mongooseAdapter(monitor: Monitor, mongoose: Mongoose): void
prismaAdapter(monitor: Monitor, prisma: PrismaClient): void
pgAdapter(monitor: Monitor, pool: Pool): void
redisAdapter(monitor: Monitor, client: Redis | RedisClient): void
```

### Exporters

```typescript
createOtelExporter(options: {
  serviceName: string;
  exportAsSpans?: boolean;
  exportAsMetrics?: boolean;
}): Exporter
```

### Event Structure

```typescript
interface ForgeEvent {
  type: string;
  db: string;
  adapter: string;
  model: string;
  operation: string;
  durationMs: number;
  slow: boolean;
  signals: ForgeSignal[];
  severity: SignalSeverity;
  explanations: Record<string, SignalExplanation>;
  request?: RequestContext;
  callsite?: Callsite;
  metadata?: QueryMetadata;
  timestamp: string;
}
```

### Supported Databases

| Database | Adapter | Status |
|----------|---------|--------|
| MongoDB | `mongooseAdapter` | ✅ Full support |
| PostgreSQL | `prismaAdapter` or `pgAdapter` | ✅ Full support |
| MySQL | `prismaAdapter` | ✅ Full support |
| SQLite | `prismaAdapter` | ✅ Full support |
| CockroachDB | `prismaAdapter` | ✅ Full support |
| Redis | `redisAdapter` | ✅ Full support |

---

## 🧩 Architecture

```
@periodic/arsenic/
├── src/
│   ├── core/                  # Framework-agnostic core
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── monitor.ts        # Main Monitor class
│   │   ├── signals.ts        # Signal detection engine
│   │   ├── severity.ts       # Severity classification
│   │   └── context.ts        # Request correlation
│   ├── adapters/              # Database adapter implementations
│   │   ├── mongoose.ts       # Mongoose adapter
│   │   ├── prisma.ts         # Prisma adapter
│   │   ├── pg.ts             # PostgreSQL (pg) adapter
│   │   └── redis.ts          # Redis adapter
│   ├── frameworks/            # Framework middleware
│   │   ├── express.ts        # Express context middleware
│   │   └── fastify.ts        # Fastify context plugin
│   ├── exporters/             # Exporter implementations
│   │   └── otel.ts           # OpenTelemetry exporter
│   └── index.ts               # Public API
```

**Design Philosophy:**
- **Core** is pure TypeScript with no dependencies
- **Adapters** hook into database drivers cleanly without monkey-patching
- **Frameworks** attach request context via AsyncLocalStorage
- **Exporters** are just functions — bring your own destination
- Easy to extend with custom adapters and exporters

---

## 📈 Performance

Arsenic is optimized for production workloads:

- **Zero blocking** — Exporters run asynchronously, never delay responses
- **AsyncLocalStorage** — Lightweight, native request context propagation
- **No monkey-patching** — Clean hooks only, no prototype mutation
- **Memory efficient** — History cleanup prevents unbounded growth
- **Exporter isolation** — Exporter errors never crash your application

---

## 🚫 Explicit Non-Goals

This package **intentionally does not** include:

❌ Built-in dashboards (use Grafana, Datadog, etc.)  
❌ Automatic query rewriting or fixing  
❌ Vendor-specific lock-in of any kind  
❌ Blocking behavior in production  
❌ Magic or implicit behavior on import  
❌ File or database transports (bring your own exporter)  
❌ Metrics collection (use Prometheus, StatsD, etc.)  
❌ Configuration files (configure in code)

Focus on doing one thing well: **semantic runtime observability**.

---

## 🎨 TypeScript Support

Full TypeScript support with complete type safety:

```typescript
import type {
  ForgeEvent,
  ForgeSignal,
  SignalSeverity,
  Exporter,
  MonitorConfig,
  QueryMetadata,
  RequestContext,
} from '@periodic/arsenic';

const monitor = createMonitor({
  slowQueryThresholdMs: 200,
  exporter: (event: ForgeEvent) => {
    const severity: SignalSeverity = event.severity;
    const signals: ForgeSignal[] = event.signals;
    console.log({ severity, signals });
  },
});
```

---

## 🤝 Related Packages

Part of the **Periodic** series by Uday Thakur:

- [**@periodic/iridium**](https://www.npmjs.com/package/@periodic/iridium) - Structured logging
- [**@periodic/obsidian**](https://www.npmjs.com/package/@periodic/obsidian) - HTTP error handling
- [**@periodic/titanium**](https://www.npmjs.com/package/@periodic/titanium) - Rate limiting
- [**@periodic/osmium**](https://www.npmjs.com/package/@periodic/osmium) - Redis caching

Build complete, production-ready APIs with the Periodic series!

---

## 📖 Documentation

- [Quick Start Guide](QUICKSTART.md)
- [Signal Reference](SIGNALS.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

**Note:** All tests achieve >80% code coverage.

---

## 🛠️ Production Recommendations

### Environment Variables

```bash
SLOW_QUERY_THRESHOLD_MS=200
NODE_ENV=production
APP_VERSION=1.0.0
```

### Log Aggregation

Pair with `@periodic/iridium` for structured JSON output:

```typescript
import { createLogger, ConsoleTransport, JsonFormatter } from '@periodic/iridium';
import { createMonitor } from '@periodic/arsenic';

const logger = createLogger({
  transports: [new ConsoleTransport({ formatter: new JsonFormatter() })],
});

const monitor = createMonitor({
  exporter: (event) => logger.info('db.event', event),
});

// Pipe to Elasticsearch, Datadog, CloudWatch, etc.
```

### Error Monitoring

Integrate with error tracking:

```typescript
const monitor = createMonitor({
  exporter: (event) => {
    if (event.severity === 'critical') {
      Sentry.captureEvent({ message: event.signals.join(', '), extra: event });
    }
  },
});
```

---

## 📝 License

MIT © [Uday Thakur](LICENSE)

---

## 🙏 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Pull request process
- Coding standards
- Architecture principles

---

## 📞 Support

- 📧 **Email:** udaythakurwork@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/udaythakur7469/periodic-arsenic/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/udaythakur7469/periodic-arsenic/discussions)

---

## 🌟 Show Your Support

Give a ⭐️ if this project helped you build better applications!

---

**Built with ❤️ by Uday Thakur for production-grade Node.js applications**