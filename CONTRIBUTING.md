# Contributing to @periodic/arsenic

First off, thank you for considering contributing to Arsenic! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Signal Contribution Guide](#signal-contribution-guide)
- [Adapter Contribution Guide](#adapter-contribution-guide)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment details** (Node version, database versions, OS, etc.)
- **Arsenic version** you're using
- **Code samples** if applicable
- **Logs or error messages** (sanitize sensitive data!)

**Example bug report:**

```markdown
**Bug**: Mongoose adapter doesn't detect unbounded queries

**Environment**:
- Node.js: 18.16.0
- Arsenic: 1.0.0
- Mongoose: 7.0.3
- MongoDB: 6.0

**Steps to Reproduce**:
1. Setup mongooseAdapter with default config
2. Execute `User.find()` without limit
3. Check emitted event

**Expected**: Should emit `unbounded_query` signal
**Actual**: No signal emitted

**Code Sample**:
\`\`\`typescript
const users = await User.find(); // No limit
\`\`\`
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why is this enhancement needed?
- **Proposed solution** (optional)
- **Alternative solutions** considered (optional)
- **Breaking changes** (if any)

**Example feature request:**

```markdown
**Feature**: SQLite adapter

**Use Case**: 
Many developers use SQLite for local development and testing. 
Having native support would improve DX.

**Proposed Solution**:
Create `sqliteAdapter` that works with better-sqlite3

**Alternatives**:
- Use Prisma adapter (works but adds overhead)

**Breaking Changes**: None
```

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Add tests if applicable
4. Ensure tests pass
5. Update documentation
6. Submit a pull request

---

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git
- MongoDB (optional, for Mongoose adapter testing)
- PostgreSQL (optional, for pg adapter testing)
- Redis (optional, for Redis adapter testing)

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/periodic-arsenic.git
cd periodic-arsenic

# Add upstream remote
git remote add upstream https://github.com/yourusername/periodic-arsenic.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Running Databases for Development

```bash
# MongoDB (using Docker)
docker run -d -p 27017:27017 mongo:latest

# PostgreSQL (using Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:latest

# Redis (using Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally
# macOS: brew install mongodb-community postgresql redis
# Ubuntu: sudo apt-get install mongodb postgresql redis-server
```

---

## 🔄 Pull Request Process

1. **Update documentation** - If you change APIs, update README.md
2. **Add tests** - For new features or bug fixes
3. **Follow coding standards** - Run `npm run lint` and `npm run format`
4. **Update CHANGELOG.md** - Add your changes under `[Unreleased]`
5. **Ensure CI passes** - All tests and linting must pass
6. **Request review** - Tag maintainers for review

### PR Title Format

Use conventional commits format:

- `feat: add Redis adapter`
- `fix: resolve memory leak in history cleanup`
- `docs: update signal reference`
- `test: add tests for n_plus_one detection`
- `refactor: improve signal detection logic`
- `chore: update dependencies`

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Types are exported (if adding public APIs)
- [ ] Examples updated (if needed)

---

## 💻 Coding Standards

### TypeScript

We use TypeScript for all code with strict mode enabled:

- Use TypeScript for all code
- Maintain strict type checking
- Export all public types
- Document complex types with JSDoc
- No implicit `any` types

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### File Organization

```
src/
├── core/           # Framework-agnostic logic
│   ├── types.ts
│   ├── signals.ts
│   ├── detector.ts
│   └── monitor.ts
├── adapters/       # Database adapters
│   ├── mongoose.ts
│   ├── prisma.ts
│   ├── pg.ts
│   └── redis.ts
├── frameworks/     # Framework integrations
│   ├── express.ts
│   └── fastify.ts
├── exporters/      # Event exporters
│   └── opentelemetry.ts
└── index.ts        # Public API exports
```

### Naming Conventions

- **Files**: kebab-case (`signal-detector.ts`)
- **Classes**: PascalCase (`Monitor`)
- **Functions**: camelCase (`detectSignals`)
- **Constants**: UPPER_SNAKE_CASE (`SLOW_REDIS_COMMANDS`)
- **Interfaces**: PascalCase (`ForgeEvent`)
- **Enums**: PascalCase (`SignalSeverity`)

### Comments

```typescript
// Good: Explain WHY, not WHAT
// Use Set for O(1) lookup performance with large request counts
const requestIds = new Set();

// Bad: Obvious comment
// Create a new Set
const requestIds = new Set();
```

**Public API Documentation:**

```typescript
/**
 * Create a monitor instance
 * 
 * @param config - Monitor configuration
 * @returns Monitor instance
 * 
 * @example
 * ```typescript
 * const monitor = createMonitor({
 *   slowQueryThresholdMs: 200,
 *   exporter: (event) => console.log(event)
 * });
 * ```
 */
export function createMonitor(config: MonitorConfig): Monitor { }
```

---

## 🧪 Testing Guidelines

### Writing Tests

- Place tests in `tests/` directory
- Name test files: `*.test.ts`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Structure

```typescript
describe('Signal Detection', () => {
  describe('slow_query signal', () => {
    it('should detect slow_query when duration exceeds threshold', () => {
      // Arrange
      const event: RawQueryEvent = {
        db: 'mongodb',
        adapter: 'mongoose',
        model: 'User',
        operation: 'findOne',
        durationMs: 300,
      };
      
      const config: MonitorConfig = {
        slowQueryThresholdMs: 200,
        exporter: jest.fn(),
      };
      
      // Act
      const signals = detectSignals(event, history, config);
      
      // Assert
      expect(signals.some(s => s.type === 'slow_query')).toBe(true);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **Minimum**: 70% overall coverage
- **Target**: 85% overall coverage
- **Critical paths**: 100% coverage (detector, monitor, signals)

### What to Test

✅ **DO test:**
- Signal detection logic
- Edge cases and error conditions
- Public API contracts
- Async behavior
- Error handling

❌ **DON'T test:**
- External library internals
- TypeScript type checking
- Trivial getters/setters

---

## 🎯 Signal Contribution Guide

### Adding a New Signal

Adding a new signal involves 5 steps:

#### 1. Define the Signal

In `src/core/signals.ts`:

```typescript
export const BAD_SIGNALS = {
  // ... existing signals
  
  my_new_signal: (includeDocs: boolean): ForgeSignal => ({
    type: 'my_new_signal',
    summary: 'One-line summary of what this means.',
    detail: 'Detailed explanation of the issue, impact, and why it matters.',
    severity: SignalSeverity.WARNING, // CRITICAL, WARNING, or INFO
    docs: includeDocs ? `${DOCS_BASE}/my-new-signal` : undefined,
  }),
};
```

#### 2. Add Detection Logic

In `src/core/detector.ts`:

```typescript
// In detectSignals function
if (shouldTriggerMySignal(event, metadata)) {
  signals.push(BAD_SIGNALS.my_new_signal(includeDocs));
}

// Add helper function
function shouldTriggerMySignal(event: RawQueryEvent, metadata: any): boolean {
  // Detection logic here
  return /* condition */;
}
```

#### 3. Write Tests

In `tests/arsenic.test.ts`:

```typescript
it('should detect my_new_signal', () => {
  const event: RawQueryEvent = {
    db: 'mongodb',
    adapter: 'mongoose',
    model: 'User',
    operation: 'findOne',
    durationMs: 100,
    metadata: {
      // Setup to trigger signal
    },
  };

  const signals = detectSignals(event, history, config);
  expect(signals.some(s => s.type === 'my_new_signal')).toBe(true);
});
```

#### 4. Document the Signal

In `SIGNALS.md`:

```markdown
#### `my_new_signal` ⚠️
**Summary:** One-line summary of what this means.

**Detail:** Detailed explanation of the issue and impact.

**Common Causes:**
- Cause 1
- Cause 2

**How to Fix:**
1. Fix step 1
2. Fix step 2

**Example:**
\`\`\`typescript
// Code example
\`\`\`
```

#### 5. Update Documentation

- Update README signal count
- Add to CHANGELOG.md
- Update EVENT_EXAMPLES.md if needed

### Signal Design Guidelines

- **Be specific**: "Unbounded query" not "Bad query"
- **Be actionable**: Explain what to do, not just what's wrong
- **Be accurate**: False positives hurt trust
- **Be performant**: Detection should be O(1) or O(log n)
- **Be clear**: Non-technical users should understand the summary

---

## 🔌 Adapter Contribution Guide

### Adding a New Database Adapter

#### 1. Create Adapter File

In `src/adapters/mydb.ts`:

```typescript
import { Monitor, RawQueryEvent } from '../core/types';
import { captureCallsite } from '../core/utils';

/**
 * Instrument MyDB for query observation
 */
export function mydbAdapter(monitor: Monitor, client: any): void {
  if (!client) {
    throw new Error('[Arsenic] MyDB client is required');
  }

  // Hook into query execution
  const originalQuery = client.query;
  
  client.query = function(this: any, ...args: any[]) {
    const startTime = Date.now();
    const callsite = captureCallsite();
    
    const result = originalQuery.apply(this, args);
    
    if (result && typeof result.then === 'function') {
      return result
        .then((res: any) => {
          const durationMs = Date.now() - startTime;
          
          const event: RawQueryEvent = {
            db: 'mydb',
            adapter: 'mydb',
            model: extractModel(args),
            operation: extractOperation(args),
            durationMs,
            callsite,
            metadata: {
              // adapter-specific metadata
              rowsAffected: res.rowCount,
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
            db: 'mydb',
            adapter: 'mydb',
            model: 'Unknown',
            operation: 'unknown',
            durationMs,
            callsite,
            metadata: {
              error: error.message,
            },
          };
          
          monitor.emit(event).catch(() => {});
          
          throw error;
        });
    }
    
    return result;
  };
}

function extractModel(args: any[]): string {
  // Extract table/collection name
  return 'Unknown';
}

function extractOperation(args: any[]): string {
  // Extract operation type
  return 'unknown';
}
```

#### 2. Export Adapter

In `src/index.ts`:

```typescript
export { mydbAdapter } from './adapters/mydb';
```

#### 3. Add Types

In `package.json` peer dependencies:

```json
{
  "peerDependencies": {
    "mydb": ">=1.0.0"
  },
  "peerDependenciesMeta": {
    "mydb": {
      "optional": true
    }
  }
}
```

#### 4. Write Tests

#### 5. Add Example

In `examples/mydb-example.ts`

#### 6. Document

Update README with adapter documentation

### Adapter Guidelines

- **Non-invasive**: Only hook, don't modify behavior
- **Error-safe**: Adapter errors never crash app
- **Metadata-rich**: Capture as much context as possible
- **Type-safe**: Full TypeScript support
- **Tested**: Cover success and error cases
- **Documented**: Clear usage examples

---

## 📊 Exporter Contribution Guide

### Adding a New Exporter

Create exporter in `src/exporters/myexporter.ts`:

```typescript
import { ForgeEvent, Exporter } from '../core/types';

export interface MyExporterConfig {
  apiKey: string;
  endpoint?: string;
}

export function createMyExporter(config: MyExporterConfig): Exporter {
  return async (event: ForgeEvent) => {
    try {
      await fetch(config.endpoint || 'https://api.example.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silently fail - exporters should never crash the app
      if (process.env.NODE_ENV === 'development') {
        console.error('[Arsenic] Export error:', error);
      }
    }
  };
}
```

---

## 📝 Documentation Contribution

### README Updates

- Keep examples up-to-date
- Update feature lists
- Add new use cases
- Fix typos and improve clarity

### API Documentation

- Use JSDoc for all public APIs
- Include TypeScript types
- Provide code examples
- Document edge cases

---

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/periodic-arsenic/discussions)
- Email: your.email@example.com

---

## 🙏 Thank You!

Your contributions make Arsenic better for everyone!

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to GitHub contributors page

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Happy coding! 🎉**