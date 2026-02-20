/**
 * Test suite for @periodic/arsenic
 */

import { createMonitor } from '../src/core/monitor';
import { detectSignals, updateHistory } from '../src/core/detector';
import { ForgeEvent, RawQueryEvent, QueryHistory, MonitorConfig } from '../src/core/types';

describe('@periodic/arsenic', () => {
  describe('createMonitor', () => {
    it('should create a monitor with default config', () => {
      const monitor = createMonitor({
        exporter: jest.fn(),
      });

      expect(monitor).toBeDefined();
      expect(monitor.config.slowQueryThresholdMs).toBe(200);
      expect(monitor.config.includeDocs).toBe(true);
      expect(monitor.config.emitPositiveSignals).toBe(false);
    });

    it('should create a monitor with custom config', () => {
      const monitor = createMonitor({
        slowQueryThresholdMs: 500,
        includeDocs: false,
        emitPositiveSignals: true,
        exporter: jest.fn(),
      });

      expect(monitor.config.slowQueryThresholdMs).toBe(500);
      expect(monitor.config.includeDocs).toBe(false);
      expect(monitor.config.emitPositiveSignals).toBe(true);
    });

    it('should emit events through exporter', async () => {
      const exporter = jest.fn();
      const monitor = createMonitor({ exporter });

      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 250,
      };

      await monitor.emit(event);

      // Wait for setImmediate
      await new Promise((resolve) => setImmediate(resolve));

      expect(exporter).toHaveBeenCalled();
      const emittedEvent = exporter.mock.calls[0][0] as ForgeEvent;
      expect(emittedEvent.type).toBe('db.query');
      expect(emittedEvent.slow).toBe(true);
      expect(emittedEvent.durationMs).toBe(250);
    });

    it('should not crash on exporter error', async () => {
      const exporter = jest.fn().mockRejectedValue(new Error('Export failed'));
      const monitor = createMonitor({ exporter });

      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 100,
      };

      // Should not throw
      await expect(monitor.emit(event)).resolves.not.toThrow();
    });
  });

  describe('Signal Detection', () => {
    let history: QueryHistory;
    let config: MonitorConfig;

    beforeEach(() => {
      history = {
        queries: new Map(),
        maxSize: 1000,
      };

      config = {
        slowQueryThresholdMs: 200,
        includeDocs: true,
        emitPositiveSignals: false,
        exporter: jest.fn(),
      };
    });

    it('should detect slow_query signal', () => {
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 300,
      };

      const signals = detectSignals(event, history, config);
      expect(signals.some((s) => s.type === 'slow_query')).toBe(true);
    });

    it('should not detect slow_query for fast queries', () => {
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 50,
      };

      const signals = detectSignals(event, history, config);
      expect(signals.some((s) => s.type === 'slow_query')).toBe(false);
    });

    it('should detect unbounded_query signal', () => {
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'find',
        durationMs: 100,
        metadata: {
          limit: undefined,
        },
      };

      const signals = detectSignals(event, history, config);
      expect(signals.some((s) => s.type === 'unbounded_query')).toBe(true);
    });

    it('should detect bounded_query signal when enabled', () => {
      config.emitPositiveSignals = true;

      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'find',
        durationMs: 50,
        metadata: {
          limit: 10,
        },
      };

      const signals = detectSignals(event, history, config);
      expect(signals.some((s) => s.type === 'bounded_query')).toBe(true);
    });

    it('should detect fast_query signal when enabled', () => {
      config.emitPositiveSignals = true;

      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 20,
      };

      const signals = detectSignals(event, history, config);
      expect(signals.some((s) => s.type === 'fast_query')).toBe(true);
    });

    it('should detect hot_path signal', () => {
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 300,
      };

      // Simulate history with many executions
      for (let i = 0; i < 15; i++) {
        updateHistory(history, event);
      }

      const signals = detectSignals(event, history, config);
      expect(signals.some((s) => s.type === 'hot_path')).toBe(true);
    });

    it('should detect n_plus_one signal', () => {
      const requestContext = {
        id: 'req_123',
        method: 'GET',
        route: '/users',
      };

      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 100,
      };

      // Simulate same query 5 times in same request
      for (let i = 0; i < 5; i++) {
        updateHistory(history, event, requestContext);
      }

      const signals = detectSignals(event, history, config, requestContext);
      expect(signals.some((s) => s.type === 'n_plus_one')).toBe(true);
    });
  });

  describe('Query History', () => {
    let history: QueryHistory;

    beforeEach(() => {
      history = {
        queries: new Map(),
        maxSize: 100,
      };
    });

    it('should track query executions', () => {
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 100,
      };

      updateHistory(history, event);

      expect(history.queries.size).toBe(1);
      const entry = history.queries.get('mongoose:User:findOne');
      expect(entry?.count).toBe(1);
      expect(entry?.avgDuration).toBe(100);
    });

    it('should update existing entries', () => {
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 100,
      };

      updateHistory(history, event);
      updateHistory(history, { ...event, durationMs: 200 });

      const entry = history.queries.get('mongoose:User:findOne');
      expect(entry?.count).toBe(2);
      expect(entry?.avgDuration).toBe(150);
    });

    it('should track request IDs', () => {
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 100,
      };

      const requestContext1 = { id: 'req_1', method: 'GET', route: '/users' };
      const requestContext2 = { id: 'req_2', method: 'GET', route: '/users' };

      updateHistory(history, event, requestContext1);
      updateHistory(history, event, requestContext2);

      const entry = history.queries.get('mongoose:User:findOne');
      expect(entry?.requestIds.size).toBe(2);
      expect(entry?.requestIds.has('req_1')).toBe(true);
      expect(entry?.requestIds.has('req_2')).toBe(true);
    });

    it('should cleanup old entries when maxSize exceeded', () => {
      history.maxSize = 10;

      // Add 15 different query shapes
      for (let i = 0; i < 15; i++) {
        const event: RawQueryEvent = {
          db: 'mongodb',
          adapter: 'mongoose',
          model: `Model${i}`,
          operation: 'findOne',
          durationMs: 100,
        };
        updateHistory(history, event);
      }

      // Should have cleaned up to maxSize
      expect(history.queries.size).toBeLessThanOrEqual(history.maxSize);
    });
  });

  describe('Signal Explanations', () => {
    it('should include explanations in events', async () => {
      const exporter = jest.fn();
      const monitor = createMonitor({
        slowQueryThresholdMs: 100,
        includeDocs: true,
        exporter,
      });

      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 200,
      };

      await monitor.emit(event);
      await new Promise((resolve) => setImmediate(resolve));

      const emittedEvent = exporter.mock.calls[0][0] as ForgeEvent;
      expect(emittedEvent.signals).toContain('slow_query');
      expect(emittedEvent.explanations['slow_query']).toBeDefined();
      expect(emittedEvent.explanations['slow_query'].summary).toBeDefined();
      expect(emittedEvent.explanations['slow_query'].detail).toBeDefined();
      expect(emittedEvent.explanations['slow_query'].docs).toBeDefined();
    });

    it('should exclude docs when includeDocs is false', async () => {
      const exporter = jest.fn();
      const monitor = createMonitor({
        slowQueryThresholdMs: 100,
        includeDocs: false,
        exporter,
      });

      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 200,
      };

      await monitor.emit(event);
      await new Promise((resolve) => setImmediate(resolve));

      const emittedEvent = exporter.mock.calls[0][0] as ForgeEvent;
      expect(emittedEvent.explanations['slow_query'].docs).toBeUndefined();
    });
  });
});