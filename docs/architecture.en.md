# Architecture

## Principles

### 1. Single browser owner

`BrowserManager` is the sole owner of browser/context/page.

Restricted:
- calling `browser.close()`, `context.close()`, `page.close()` from other modules
- calling `context.newPage()`, `context.clearCookies()`, `context.cookies()`
- accessing `context.pages()` directly

All operations go through `BrowserManager` methods.

### 2. Guaranteed cleanup

After ANY registration outcome (success, failure, cancel, timeout), logout and browser state cleanup are performed.

The next cycle always starts from a clean `/auth?mode=register` page.

### 3. Graceful shutdown

On successful registration or menu exit, all resources are released:
- HTTP server (Bun.serve)
- Browser (launchPersistentContext → close)
- File storage (Storage)
- Process lock (Lock)

`process.exit()` is only used in signal handlers (SIGINT/SIGTERM).

## Application lifecycle

```
bootstrap → cliLoop → createAccount
                         ├── ensureCleanState
                         ├── register
                         ├── confirm
                         ├── waitForMail
                         ├── activate
                         └── [finally] cleanup logout
                      → shutdown (on success)
```

## Module structure

```
src/
├── index.ts              # Entry point, bootstrap, shutdown
├── context.ts            # AppContext (breaks circular dependency)
├── types.ts              # Types
├── i18n.ts               # Translations
├── theme.ts              # UI theme
├── browser/manager.ts    # Browser management
├── cli/                   # Input/output
├── config/manager.ts     # Configuration
├── diagnostics/doctor.ts # Diagnostics
├── mail/service.ts       # Email
├── server/http.ts        # HTTP API
├── services/              # Business logic
│   ├── account.ts        # Account CRUD
│   ├── batch.ts          # Batch creation
│   ├── create.ts         # Single account creation
│   ├── logout.ts         # Logout
│   ├── registration.ts   # Registration
│   ├── session.ts        # Session
│   └── stats.ts          # Statistics
├── storage/json.ts       # Storage
└── utils/                # Utilities
```

## Why `waitUntil: 'domcontentloaded'`

All navigations use `domcontentloaded` instead of `networkidle`.

Reason: Qwen maintains a persistent WebSocket connection. `networkidle` would never resolve and would time out.

`domcontentloaded` + `waitForSelector` is the only reliable pattern.
