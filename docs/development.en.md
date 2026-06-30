# Development

## Stack

- **Runtime**: Bun ≥ 1.3
- **Language**: TypeScript 5.9
- **Browser**: cloakbrowser ^0.4.5 (Chromium with anti-detect settings)
- **Browser engine**: playwright-core ^1.61.1

## Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | Linting (typecheck) |
| `bun run dev` | Development mode with auto-reload |
| `bun run src/index.ts` | Run directly |
| `./bin/qf` | Run via entry point |
| `bun test` | Run tests |

## Repository Structure

```
qwen-forge/
├── bin/qf                      # Bash wrapper, entry point
├── install.sh                  # Installer
├── config.json                 # Configuration (auto-generated)
├── package.json                # Dependencies, scripts
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── index.ts                # Entry point, bootstrap, signal handlers
│   ├── context.ts              # AppContext (circular dependency break)
│   ├── types.ts                # All types and interfaces
│   ├── i18n.ts                 # EN/RU translations in one file
│   ├── theme.ts                # UI: colors, Spinner, Screen, layout
│   ├── version.ts              # Version constant (single source)
│   ├── browser/
│   │   └── manager.ts          # Sole browser lifecycle owner
│   ├── cli/
│   │   ├── input.ts            # Readline, menu, pipe support
│   │   └── helpers.ts          # sleep, ESC detection, formatting
│   ├── config/
│   │   └── manager.ts          # Load/save/migrate config.json
│   ├── diagnostics/
│   │   ├── chromium.ts         # Chromium: binary, .so, distro
│   │   ├── chromium.test.ts    # Chromium diagnostics tests
│   │   └── doctor.ts           # Full system diagnostics
│   ├── mail/
│   │   └── service.ts          # CatchMail: email, password, polling, activation
│   ├── server/
│   │   └── http.ts             # HTTP API (Bun.serve)
│   ├── services/
│   │   ├── account.ts          # Account CRUD
│   │   ├── batch.ts            # Batch creation
│   │   ├── create.ts           # Single registration orchestrator
│   │   ├── logout.ts           # Logout + session cleanup
│   │   ├── registration.ts     # Registration form filling
│   │   ├── session.ts          # Session account tracking
│   │   └── stats.ts            # Statistics screen
│   ├── storage/
│   │   └── json.ts             # JSON storage with atomic writes
│   └── utils/
│       ├── crash.ts            # Crash reporter
│       ├── eventbus.ts         # Event bus
│       ├── lock.ts             # Lock file (singleton)
│       ├── logger.ts           # Logger with rotation
│       ├── network.ts          # Connectivity checking
│       ├── runtime.ts          # CLI flags, debug, timer
│       └── sanitizer.ts        # Log sanitization (secrets removal)
├── data/                       # accounts.json (runtime)
├── logs/                       # app.log, crash-*.log (runtime)
└── docs/                       # Documentation
```

## Architecture

### Principles

1. **Single browser owner** — `BrowserManager` is the only module that manages browser/context/page. No other module calls `close()`, `newPage()`, `clearCookies()`.

2. **Guaranteed cleanup** — after every outcome (success, error, cancel, timeout), logout and state cleanup are performed. The next cycle starts from a clean `/auth?mode=register` page.

3. **Graceful shutdown** — on exit: HTTP server, browser, storage, and lock are released. `process.exit()` is used only in signal handlers.

### Lifecycle

```
bootstrap → cliLoop → createAccount
├── ensureCleanState
├── register
├── confirm
├── waitForMail
├── activate
└── [finally] cleanup logout
→ shutdown (if successful)
```

### AppContext

`context.ts` defines the `AppContext` interface imported by all services. This breaks the circular dependency: `index.ts` creates all services and passes the context; services import only the type.

### Navigation

Uses `waitUntil: 'domcontentloaded'` instead of `networkidle`. Qwen maintains a persistent WebSocket connection — `networkidle` would never resolve.

## Testing

```bash
bun test
```

Tests use `bun:test`. Current tests cover Chromium diagnostics (`src/diagnostics/chromium.test.ts`).

## Logging

Levels: `TRACE`, `DEBUG`, `INFO`, `SUCCESS`, `WARN`, `ERROR`, `FATAL`

```typescript
const logger = new Logger({ file: 'logs/app.log', name: 'App' });
logger.info('Server started');
logger.debug('Request details', { url, status });
const child = logger.child('Module');
```

In `--debug` mode, logs are output to the console (TRACE level). The sanitizer automatically removes passwords, tokens, and cookies from output.

## Release Process

See `docs/release-checklist.md`.

Version is updated in:
- `package.json`
- `src/version.ts` (single runtime source)
- `README.md` / `README.en.md`

## Internal Files

| File | Purpose |
|------|---------|
| `docs/release-checklist.md` | Release checklist |
| `docs/github-labels.md` | GitHub label scheme |
| `.github/SECURITY.md` | Security policy |
| `.github/CODEOWNERS` | Code owners |
| `.github/pull_request_template.md` | PR template |
| `.github/ISSUE_TEMPLATE/` | Issue templates |