# Changelog

All notable changes to @periodic/arsenic will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-11

### 🎉 Initial Release

Production-ready semantic runtime monitoring library for database queries.

### Added

#### Core Features
- **Signal System**: 62 production-grade signals across 3 severity levels (30 semantic + 32 Redis command signals)
  - 7 CRITICAL signals (hot_path, n_plus_one, unbounded_query, blocking_io, retry_loop, write_contention, connection_pool_exhaustion)
  - 9 WARNING signals (slow_query, fan_out, high_variance_latency, high_cpu, high_memory, large_payload, deprecated_api, overfetching, read_heavy_hotspot)
  - 14 INFO signals (fast_query, bounded_query, indexed_lookup, stable_latency, cached_query, index_hit, single_query, optimized_join, connection_reused, low_memory, low_cpu, stable_response, cache_candidate, healthy_hot_path)
  - 32 Redis command signals (KEYS, FLUSHALL, FLUSHDB, BLPOP, BRPOP, BRPOPLPUSH, BLMOVE, SORT, SUNION, SINTER, SDIFF, SUNIONSTORE, SINTERSTORE, SDIFFSTORE, ZINTERSTORE, ZUNIONSTORE, ZRANGEBYSCORE, ZREVRANGEBYSCORE, SCAN, SSCAN, HSCAN, ZSCAN, HGETALL, SMEMBERS, LRANGE, ZRANGE, ZREVRANGE, ZRANGEBYLEX, OBJECT, WAIT, MULTI, EXEC)

- **Severity Levels**: `SignalSeverity` enum with CRITICAL, WARNING, INFO
- **Request Correlation**: AsyncLocalStorage-based request context tracking
- **Callsite Attribution**: Automatic capture of file and line number
- **Query History**: Intelligent tracking for pattern detection

#### Database Adapters
- **Mongoose** (`mongooseAdapter`) - Full MongoDB support via Mongoose
- **Prisma** (`prismaAdapter`) - SQL databases (PostgreSQL, MySQL, SQLite, CockroachDB)
- **PostgreSQL** (`pgAdapter`) - Raw pg driver support
- **Redis** (`redisAdapter`) - Both ioredis and redis v4+ support

#### Framework Support
- **Express** (`expressContext`) - Middleware with user tracking
- **Fastify** (`fastifyContext`) - Plugin-based integration

#### Exporters
- **Console Exporter** - Built-in development logging
- **OpenTelemetry Exporter** (`createOtelExporter`) - Full OTEL integration
  - Span export
  - Metrics export
  - Logs export
- **Composite Exporter** (`createCompositeExporter`) - Multi-destination support

#### Metadata Tracking
- CPU usage monitoring
- Memory usage monitoring
- Cache hit detection
- Payload size tracking
- Row count tracking
- Retry count monitoring
- Connection pool metrics
- Index usage detection

#### Developer Experience
- Full TypeScript support with complete type definitions
- Comprehensive documentation
- 10+ usage examples
- Zero breaking changes policy
- Production-safe error handling

### Documentation
- Complete README with quick start guide
- SIGNALS.md - Full signal reference with fixes
- EVENT_EXAMPLES.md - 8 real-world JSON examples
- QUICKSTART.md - Step-by-step setup guide
- SETUP.md - Detailed installation and configuration
- CONTRIBUTING.md - Contribution guidelines
- API documentation with TypeScript types

### Performance
- Zero blocking operations
- AsyncLocalStorage for context (minimal overhead)
- No monkey-patching
- Automatic history cleanup (prevents memory leaks)
- Exporter errors never crash the app

### Security
- Automatic parameter sanitization
- No sensitive data in callsites
- User ID tracking (opt-in)

---

## [Unreleased]

### Planned for v1.1

#### Features
- Query execution plan analysis (opt-in)
- Advanced connection pool metrics
- Automatic slow query logging to file
- Query fingerprinting for better deduplication
- Percentile-based latency tracking (P50, P95, P99)

#### Adapters
- TypeORM adapter
- Sequelize adapter
- Knex adapter

#### Exporters
- Datadog exporter
- New Relic exporter
- Kafka exporter
- File exporter with rotation

#### Improvements
- Configurable history size
- Custom signal thresholds per model
- Signal suppression rules
- Query sampling for high-traffic apps

---

## [Planned for v2.0]

### Major Features
- **GraphQL Resolver Adapter** - Monitor GraphQL query execution
- **ML-Based Anomaly Detection** - Smart baseline learning
- **Automatic Index Recommendations** - AI-powered query optimization
- **Query Replay** - Reproduce production issues locally
- **Dashboard** - Built-in visualization (optional)

### Advanced Signal Detection
- Query complexity scoring
- Data skew detection
- Lock contention prediction
- Cache efficiency analysis
- Transaction isolation issues

### Enterprise Features
- Multi-tenant signal isolation
- Role-based signal routing
- Custom signal definitions
- Signal correlation engine
- Automated incident creation

---

## Version Support

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 4.5.0

### Peer Dependencies

| Package | Version | Optional |
|---------|---------|----------|
| @prisma/client | >= 4.0.0 | Yes |
| mongoose | >= 6.0.0 | Yes |
| pg | >= 8.0.0 | Yes |
| redis | >= 4.0.0 | Yes |
| ioredis | >= 4.0.0 | Yes |
| express | >= 4.0.0 | Yes |
| fastify | >= 4.0.0 | Yes |
| @opentelemetry/api | >= 1.0.0 | Yes |

---

## Migration Guides

### From Pre-Release to v1.0

Since this is the first stable release, no migration is needed.

---

## Breaking Changes Policy

@periodic/arsenic follows semantic versioning strictly:

- **Major versions** (2.0.0): Breaking changes
- **Minor versions** (1.1.0): New features, backward compatible
- **Patch versions** (1.0.1): Bug fixes, backward compatible

We commit to:
- Clear migration guides for breaking changes
- Deprecation warnings one major version in advance
- Long-term support for major versions

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:
- Reporting bugs
- Suggesting features
- Submitting pull requests
- Development setup

---

## License

MIT - See [LICENSE](./LICENSE) file

---

## Acknowledgments

Special thanks to:
- The Anthropic team for Claude's assistance in development
- The Node.js community for excellent database drivers
- OpenTelemetry for standardized observability
- All contributors and early adopters

---

## Links

- [GitHub Repository](https://github.com/udaythakur7469/periodic-arsenic)
- [npm Package](https://www.npmjs.com/package/@periodic/arsenic)
- [Documentation](https://arsenicdev.online)
- [Issue Tracker](https://github.com/udaythakur7469/periodic-arsenic/issues)
- [Discussions](https://github.com/udaythakur7469/periodic-arsenic/discussions)

---

**Note**: This changelog is maintained manually. For a complete list of commits, see the [Git history](https://github.com/udaythakur7469/periodic-arsenic/commits/main).