# ⚡ Quick Start Guide

Get up and running with @periodic/arsenic in 5 minutes!

---

## 📦 Installation

```bash
npm install @periodic/arsenic
```

**Install database adapters** (choose what you need):

```bash
# For MongoDB
npm install mongoose

# For SQL via Prisma
npm install @prisma/client

# For PostgreSQL raw driver
npm install pg

# For Redis
npm install ioredis
# or
npm install redis

# For Express
npm install express

# For Fastify
npm install fastify
```

---

## 🚀 Basic Usage

### 1. Setup Express + Mongoose

```typescript
import express from 'express';
import mongoose from 'mongoose';
import { 
  createMonitor, 
  expressContext, 
  mongooseAdapter 
} from '@periodic/arsenic';

const app = express();

// Create monitor
const monitor = createMonitor({
  slowQueryThresholdMs: 200, // 200ms threshold
  exporter: (event) => {
    console.log(JSON.stringify(event, null, 2));
  }
});

// Attach Express middleware
app.use(expressContext(monitor));

// Instrument Mongoose
mongooseAdapter(monitor, mongoose);

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/myapp');
```

### 2. Your Route Automatically Gets Monitored

```typescript
app.get('/api/users/:id', async (req, res) => {
  // This query is automatically monitored!
  const user = await User.findOne({ _id: req.params.id });
  res.json(user);
});
```

### 3. See Query Events in Console

```json
{
  "type": "db.query",
  "db": "mongodb",
  "adapter": "mongoose",
  "model": "User",
  "operation": "findOne",
  "durationMs": 45,
  "slow": false,
  "signals": ["fast_query"],
  "severity": "info",
  "request": {
    "id": "req_abc123",
    "method": "GET",
    "route": "/api/users/:id"
  }
}
```

---

## 🎯 Common Patterns

### Pattern 1: SQL with Prisma

```typescript
import { PrismaClient } from '@prisma/client';
import { createMonitor, prismaAdapter } from '@periodic/arsenic';

const prisma = new PrismaClient();

const monitor = createMonitor({
  slowQueryThresholdMs: 150,
  exporter: (event) => {
    if (event.severity === 'critical') {
      console.error('🚨 CRITICAL:', event);
    }
  }
});

prismaAdapter(monitor, prisma);

// All Prisma queries are now monitored!
const users = await prisma.user.findMany();
```

### Pattern 2: PostgreSQL Raw Driver

```typescript
import { Pool } from 'pg';
import { createMonitor, pgAdapter } from '@periodic/arsenic';

const pool = new Pool({
  host: 'localhost',
  database: 'myapp',
  port: 5432,
});

const monitor = createMonitor({
  slowQueryThresholdMs: 100,
  exporter: (event) => console.log(event)
});

pgAdapter(monitor, pool);

// Raw SQL queries are monitored
const result = await pool.query('SELECT * FROM users WHERE id = $1', [123]);
```

### Pattern 3: Redis Commands

```typescript
import Redis from 'ioredis';
import { 
  createMonitor, 
  redisAdapter, 
  SLOW_REDIS_COMMANDS 
} from '@periodic/arsenic';

const redis = new Redis();

const monitor = createMonitor({
  slowQueryThresholdMs: 50,
  exporter: (event) => {
    // Alert on slow Redis commands
    if (SLOW_REDIS_COMMANDS.includes(event.operation)) {
      console.warn('⚠️ Slow Redis command:', event.operation);
    }
  }
});

redisAdapter(monitor, redis);

// Redis commands are monitored
await redis.get('user:123');
await redis.set('user:123', JSON.stringify(user));
```

### Pattern 4: User-Specific Tracking

```typescript
app.use(authMiddleware); // Adds req.user

app.use(expressContext(monitor, {
  attachUser: (req) => req.user?.id // Track per-user queries
}));

// Now all events include userId
// "request": { "userId": "user_abc123" }
```

---

## 📊 Severity-Based Alerts

```typescript
import { SignalSeverity } from '@periodic/arsenic';

const monitor = createMonitor({
  slowQueryThresholdMs: 200,
  exporter: (event) => {
    switch (event.severity) {
      case SignalSeverity.CRITICAL:
        sendToPagerDuty(event);
        break;
      case SignalSeverity.WARNING:
        sendToSlack(event);
        break;
      case SignalSeverity.INFO:
        // Just log
        console.log(event);
        break;
    }
  }
});
```

---

## 🔍 Detecting Common Issues

### N+1 Queries

```typescript
// This will trigger n_plus_one signal
app.get('/api/posts', async (req, res) => {
  const users = await User.find();
  
  // BAD: Queries in a loop
  for (const user of users) {
    user.posts = await Post.find({ userId: user._id }); // ❌ N+1!
  }
  
  res.json(users);
});

// Event will include:
// "signals": ["n_plus_one"],
// "severity": "critical"
```

### Unbounded Queries

```typescript
// This will trigger unbounded_query signal
app.get('/api/logs', async (req, res) => {
  const logs = await Log.find(); // ❌ No limit!
  res.json(logs);
});

// Event will include:
// "signals": ["unbounded_query"],
// "severity": "critical"
```

### Hot Path Detection

```typescript
// If this query is slow AND frequently called
app.get('/api/popular-data', async (req, res) => {
  const data = await HeavyModel.find({ complex: true }); // Slow + frequent
  res.json(data);
});

// After ~10 executions, you'll see:
// "signals": ["hot_path"],
// "severity": "critical"
```

---

## 🎨 Production Setup

```typescript
import { createMonitor, expressContext, prismaAdapter } from '@periodic/arsenic';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const monitor = createMonitor({
  slowQueryThresholdMs: process.env.NODE_ENV === 'production' ? 300 : 100,
  includeDocs: process.env.NODE_ENV !== 'production',
  exporter: async (event) => {
    // Production: Send to observability platform
    if (event.severity === 'critical') {
      await sendToDatadog(event);
    }
    
    // Development: Pretty print
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(event, null, 2));
    }
  }
});

app.use(expressContext(monitor));
prismaAdapter(monitor, prisma);
```

---

## 📈 Enable Good Signals (Optional)

```typescript
const monitor = createMonitor({
  emitPositiveSignals: true, // Show healthy queries too
  exporter: (event) => {
    if (event.signals.includes('cache_candidate')) {
      console.log('💡 This query could be cached:', event.model);
    }
  }
});
```

---

## 🔗 OpenTelemetry Integration

```bash
npm install @opentelemetry/api
```

```typescript
import { createOtelExporter } from '@periodic/arsenic';

const monitor = createMonitor({
  exporter: createOtelExporter({
    serviceName: 'my-service',
    exportAsSpans: true,
    exportAsMetrics: true,
  })
});
```

---

## 📚 Next Steps

- Read the full [README](README.md) for all features
- Check [SIGNALS.md](SIGNALS.md) for complete signal reference
- See [EVENT_EXAMPLES.md](EVENT_EXAMPLES.md) for real event structures
- View [examples/usage.ts](examples/usage.ts) for more patterns
- Read [SETUP.md](SETUP.md) for development setup

---

## 🆘 Common Issues

### "Module not found: @periodic/arsenic"

Make sure you've installed the package:
```bash
npm install @periodic/arsenic
```

### No events being emitted

Check that you've:
1. Created a monitor with `createMonitor()`
2. Attached an adapter (e.g., `mongooseAdapter(monitor, mongoose)`)
3. Your database queries are actually executing

### Events missing request context

Make sure you've added the framework middleware:
```typescript
app.use(expressContext(monitor)); // Before your routes
```

---

**Happy monitoring! 🎉**

Need help? Open an [issue](https://github.com/udaythakur7469/periodic-arsenic/issues) or [discussion](https://github.com/udaythakur7469/periodic-arsenic/discussions).