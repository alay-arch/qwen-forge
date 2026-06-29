# CLI

## Commands

### `qf`

Starts the interactive menu.

```
1  Create account
2  Batch
3  Session
4  Statistics
5  Diagnostics
6  Configuration
0  Exit
```

### `qf --debug`

Run with extended logging (TRACE level).

Logs are printed to console and written to `logs/app.log`.

### `qf --help`

Show help.

### `qf --version`

Show version.

## Flags

| Flag | Description |
|------|-------------|
| `--debug` | Debug mode (TRACE level, console output) |
| `--help`, `-h` | Show help |
| `--version`, `-v` | Show version |

## HTTP API

The server starts automatically when the application launches.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ping` | Health check |
| POST | `/api/register` | Register an account |
| POST | `/api/logout` | Logout and session cleanup |

Example:

```bash
curl -X POST http://localhost:9412/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@catchmail.io","password":"MyPass123!"}'
```

Default port: `9412`. Configurable in `config.json`.
