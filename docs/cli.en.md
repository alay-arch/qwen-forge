# CLI

## Commands

| Command | Description |
|---------|-------------|
| `qf` | Interactive menu |
| `qf --debug` | Run with TRACE logs to console |
| `qf --help`, `-h` | Show help |
| `qf --version`, `-v` | Show version |

## Interactive Menu

Running `qf` without arguments opens the menu:

```
1  Create account
2  Batch create
3  Session
4  Statistics
5  Diagnostics
6  Configuration
0  Exit
```

### 1 — Create Account

Creates one Qwen account:
- Generates a disposable email via CatchMail
- Fills the registration form in the browser
- Confirms email via the link in the email
- Saves credentials to `data/accounts.json`

### 2 — Batch Create

Registers up to 50 accounts in one run. Enter the count — everything else is automatic.

Progress is displayed in real time. Cancel (Esc) at any point.

### 3 — Session

Shows accounts created in the current session:
- Email and password
- Status (success / error)
- Creation time

Session list can be cleared.

### 4 — Statistics

Lifetime statistics:
- Total created
- Successful / failed
- Success rate
- Average registration time

### 5 — Diagnostics

Checks the system:
- Internet connection and DNS
- Chromium availability and launch test
- Missing shared libraries
- CatchMail API reachability
- Disk space and memory
- HTTP server and browser status

### 6 — Configuration

Switch interface language (Russian / English).

## HTTP API

Server starts automatically when `qf` launches.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ping` | Health check |
| POST | `/api/register` | Create account |
| POST | `/api/logout` | Logout from current account |

### Examples

```bash
curl http://localhost:3030/api/ping
```

```bash
curl -X POST http://localhost:3030/api/register
```

```bash
curl -X POST http://localhost:3030/api/logout
```

Default port: `3030`. Configurable in `config.json` → `server.port`.