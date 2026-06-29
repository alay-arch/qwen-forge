# Development

## Stack

The project uses **Bun** as the sole runtime and package manager.

- TypeScript 5.9
- Bun 1.1+
- cloakbrowser 0.4.5 (browser engine)

## Commands

```bash
bun install          # Install dependencies
bun run typecheck    # TypeScript type checking
bun run lint         # Linting (typecheck)
bun run dev          # Development mode with hot reload
bun run src/index.ts # Run
./bin/qf             # Run via entry point
```

## Structure

```
src/
├── context.ts          # AppContext (breaks circular dependency)
├── types.ts            # All types and interfaces
├── i18n.ts             # Translations (EN/RU) in one file
├── theme.ts            # UI: colors, Spinner, Screen
├── browser/manager.ts  # Single browser owner
├── cli/                # Keyboard input, menus
├── config/manager.ts   # Config load/save
├── diagnostics/        # System diagnostics
├── mail/               # CatchMail email service
├── server/             # HTTP API (Bun.serve)
├── services/           # Business logic
├── storage/            # JSON storage
└── utils/              # Utilities (logger, lock, network check)
```

## Logging

```typescript
// Levels: TRACE, DEBUG, INFO, SUCCESS, WARN, ERROR, FATAL
Logger.error('Something failed', { error: err.message });
Logger.info('Account created');
Logger.debug('Navigating to registration page');
```

In `--debug` mode, logs are written to console and `logs/app.log`.

## Adding a new service

1. Create a file in `src/services/`
2. Add a class with `init()`, `shutdown()`, `isReady()` methods
3. Register in `src/index.ts` — constructor, init, shutdown

## Pre-commit check

```bash
bun run typecheck
# Ensure no TypeScript errors
```
