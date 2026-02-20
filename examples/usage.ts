/**
 * Comprehensive usage examples for @periodic/arsenic
 */

import express from "express";
import mongoose from "mongoose";
import { PrismaClient } from "@prisma/client";
import {
  createMonitor,
  expressContext,
  mongooseAdapter,
  prismaAdapter,
} from "../src";

// ============================================================================
// Example 1: Basic Express + Mongoose Setup
// ============================================================================
function example1_BasicMongoose() {
  const app = express();

  const monitor = createMonitor({
    slowQueryThresholdMs: 200,
    exporter: (event) => {
      console.log("[Example 1]", JSON.stringify(event, null, 2));
    },
  });

  app.use(expressContext(monitor));
  mongooseAdapter(monitor, mongoose);

  app.get("/users/:id", async (req, res) => {
    // Your normal Mongoose code
    const user = await mongoose.model("User").findOne({ _id: req.params.id });
    res.json(user);
  });

  app.listen(3001);
}

// ============================================================================
// Example 2: Express + Prisma with User Tracking
// ============================================================================
function example2_PrismaWithUser() {
  const app = express();
  const prisma = new PrismaClient();

  const monitor = createMonitor({
    slowQueryThresholdMs: 150,
    exporter: (event) => {
      console.log("[Example 2]", event);
    },
  });

  // Attach user context
  app.use(
    expressContext(monitor, {
      attachUser: (req) => req.user?.id,
    }),
  );

  prismaAdapter(monitor, prisma);

  app.get("/posts", async (req, res) => {
    const posts = await prisma.post.findMany({ take: 10 });
    res.json(posts);
  });

  app.listen(3002);
}

// ============================================================================
// Example 3: Multiple Exporters (Console + Kafka)
// ============================================================================
function example3_MultipleExporters() {
  const app = express();

  const exporters = [
    // Console exporter
    (event: any) => {
      if (event.slow) {
        console.warn("[SLOW QUERY]", event);
      }
    },

    // Mock Kafka exporter
    async (event: any) => {
      // await kafkaProducer.send({ topic: 'arsenic-events', messages: [event] });
    },

    // Mock Database exporter
    async (event: any) => {
      // await db.events.insert(event);
    },
  ];

  const monitor = createMonitor({
    exporter: async (event) => {
      await Promise.allSettled(exporters.map((ex) => ex(event)));
    },
  });

  app.use(expressContext(monitor));
  // Add your DB adapter here

  app.listen(3003);
}

// ============================================================================
// Example 4: Conditional Export (Only Slow Queries)
// ============================================================================
function example4_ConditionalExport() {
  const monitor = createMonitor({
    slowQueryThresholdMs: 100,
    exporter: (event) => {
      // Only log slow queries or those with signals
      if (event.slow || event.signals.length > 0) {
        console.log("[ALERT]", event);
      }
    },
  });

  // Setup your app...
}

// ============================================================================
// Example 5: Structured Logging with Pino
// ============================================================================
function example5_StructuredLogging() {
  const pino = require("pino");
  const logger = pino();

  const monitor = createMonitor({
    exporter: (event) => {
      logger.info(
        {
          ...event,
          component: "arsenic",
        },
        "db.query",
      );
    },
  });

  // Setup your app...
}

// ============================================================================
// Example 6: Development vs Production Exporters
// ============================================================================
function example6_EnvironmentSpecific() {
  const isDev = process.env.NODE_ENV === "development";

  const monitor = createMonitor({
    slowQueryThresholdMs: isDev ? 100 : 300,
    includeDocs: isDev, // Include docs links only in dev
    exporter: isDev
      ? // Development: pretty console
        (event) => console.log(JSON.stringify(event, null, 2))
      : // Production: structured logs
        (event) => console.log(JSON.stringify(event)),
  });

  // Setup your app...
}

// ============================================================================
// Example 7: Positive Signals Enabled
// ============================================================================
function example7_PositiveSignals() {
  const monitor = createMonitor({
    emitPositiveSignals: true, // Enable good signals
    exporter: (event) => {
      console.log("[Signals]", event.signals);
    },
  });

  // Setup your app...
}

// ============================================================================
// Example 8: Custom Signal Filtering
// ============================================================================
function example8_SignalFiltering() {
  const monitor = createMonitor({
    exporter: (event) => {
      // Only alert on hot_path and n_plus_one
      const criticalSignals = ["hot_path", "n_plus_one"];
      const hasCritical = event.signals.some((s) =>
        criticalSignals.includes(s),
      );

      if (hasCritical) {
        console.error("[CRITICAL]", event);
        // Send to Slack, PagerDuty, etc.
      }
    },
  });

  // Setup your app...
}

// ============================================================================
// Example 9: Datadog Integration
// ============================================================================
function example9_DatadogIntegration() {
  // const dogstatsd = require('hot-shots');
  // const client = new dogstatsd.StatsD();

  const monitor = createMonitor({
    exporter: (event) => {
      // Send metrics to Datadog
      // client.gauge('db.query.duration', event.durationMs, {
      //   model: event.model,
      //   operation: event.operation,
      //   slow: event.slow.toString(),
      // });

      // Send events for slow queries
      if (event.slow) {
        // client.event({
        //   title: 'Slow Query Detected',
        //   text: `${event.model}.${event.operation} took ${event.durationMs}ms`,
        // });
      }
    },
  });

  // Setup your app...
}

// ============================================================================
// Example 10: Database Persistence
// ============================================================================
function example10_DatabasePersistence() {
  const prisma = new PrismaClient();

  const monitor = createMonitor({
    exporter: async (event) => {
      // Save events to database for analysis
      // await prisma.arsenicEvent.create({
      //   data: {
      //     type: event.type,
      //     db: event.db,
      //     model: event.model,
      //     operation: event.operation,
      //     durationMs: event.durationMs,
      //     slow: event.slow,
      //     signals: JSON.stringify(event.signals),
      //     explanations: JSON.stringify(event.explanations),
      //     requestId: event.request?.id,
      //     timestamp: new Date(event.timestamp),
      //   },
      // });
    },
  });

  // Setup your app...
}

// Export examples for reference
export {
  example1_BasicMongoose,
  example2_PrismaWithUser,
  example3_MultipleExporters,
  example4_ConditionalExport,
  example5_StructuredLogging,
  example6_EnvironmentSpecific,
  example7_PositiveSignals,
  example8_SignalFiltering,
  example9_DatadogIntegration,
  example10_DatabasePersistence,
};
