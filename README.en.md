# Qwen Forge

**v0.1.0-beta** — Automated account registration utility for Qwen (chat.qwen.ai) using disposable email via CatchMail.

---

## Features

- Automated single or batch account registration
- Email confirmation via CatchMail API
- Automatic account activation from email link
- Batch creation (up to 50 accounts at once)
- Full cycle: register → activate → logout → state cleanup
- HTTP API for external script integration
- System diagnostics (network, DNS, browser, configuration)
- Session and historical statistics
- Russian and English interface
- Graceful shutdown — clean resource cleanup

---

Full documentation: [docs/](./docs/)

## Installation

### Requirements

- **Bun** ≥ 1.1 (https://bun.sh)
- **Git** (for installation from the repository)
- **OS**: Linux (Windows via WSL)

```bash
curl -fsSL https://bun.sh/install | bash
```

### Install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The install script:
- Checks for Bun, Git, curl
- Clones the repository to `~/.qwen-forge`
- Installs dependencies
- Registers the `qf` command globally in `~/.local/bin/qf`
- On re-run, updates the existing installation

After installation, open a new terminal and run:

```bash
qf
```

### Manual installation (alternative)

```bash
git clone https://github.com/alay-arch/qwen-forge.git
cd qwen-forge
bun install
bun run src/index.ts --help
```

The `qf` command is not registered in this case. Use:

```bash
bun run src/index.ts
./bin/qf
```

To register globally:

```bash
bun link
```

After `bun link`, the `qf` command is available in the terminal.

---

## Quick Start

```bash
# Launch interactive menu
qf

# Create a single account — select option 1
# Batch creation — select option 2, enter the count
```

On first launch, you will be prompted to select a language. Configuration is saved to `config.json`.

---

## Usage

### qf

Starts the interactive menu:

```
1  Create account
2  Batch
3  Session
4  Statistics
5  Diagnostics
6  Configuration
0  Exit
```

**Create account (1):**
1. An email and password are generated
2. Browser opens and fills the Qwen registration form
3. After form submission, user confirmation is requested
4. System polls CatchMail for the confirmation email and extracts the activation link
5. Account is activated
6. Logout and browser state cleanup are performed
7. After successful registration, the application exits cleanly

**Batch (2):**
- Enter the number of accounts (1–50)
- A 3-second pause between accounts with ESC to cancel
- A summary is shown after completion

### qf --debug

Run with extended logging.

`TRACE` mode enables:
- All HTTP request logs
- Mail polling results
- Operation timings
- Form submission details
- Real-time console output

Use for troubleshooting.

```bash
qf --debug
```

Log file: `logs/app.log`

---

## How It Works

1. **Browser** is launched once on first use (lazy init)
2. A shared page is used for all registrations — no browser restart between accounts
3. After registration, the system waits for an email via CatchMail
4. The activation link is extracted from the email
5. After activation, logout is performed via `GET /api/v2/auths/signout`
6. Cookies, localStorage, and sessionStorage are cleared
7. The browser returns to `/auth?mode=register`
8. After a successful registration, the application shuts down gracefully

---

## Project Structure

```
qwen-forge/
├── bin/qf                  # CLI entry point
├── src/
│   ├── index.ts            # Entry point, CLI loop, bootstrap
│   ├── types.ts            # TypeScript types
│   ├── i18n.ts             # Translations (RU/EN)
│   ├── theme.ts            # Terminal colors
│   ├── browser/
│   │   └── manager.ts      # Browser lifecycle management
│   ├── cli/
│   │   ├── input.ts        # Keyboard input, menus
│   │   └── helpers.ts      # sleep, ESC handling
│   ├── config/
│   │   └── manager.ts      # Config load/save/validate
│   ├── diagnostics/
│   │   └── doctor.ts       # System diagnostics
│   ├── mail/
│   │   └── service.ts      # Email (generation, polling, activation)
│   ├── server/
│   │   └── http.ts         # HTTP API server
│   ├── services/
│   │   ├── account.ts      # Account CRUD
│   │   ├── batch.ts        # Batch creation
│   │   ├── create.ts       # Single account creation
│   │   ├── logout.ts       # Logout + cleanup
│   │   ├── registration.ts # Registration form filling
│   │   ├── session.ts      # Session manager
│   │   └── stats.ts        # Statistics
│   ├── storage/
│   │   └── json.ts         # JSON file storage
│   └── utils/
│       ├── crash.ts        # Crash reports
│       ├── eventbus.ts     # Event bus
│       ├── lock.ts         # Process lock
│       ├── logger.ts       # Logging
│       ├── network.ts      # Network checks
│       ├── runtime.ts      # CLI flags
│       └── sanitizer.ts    # Log sanitizer
├── data/
│   └── accounts.json       # Account database
├── config.json             # Configuration
├── package.json
└── tsconfig.json
```

---

## Configuration

The `config.json` file is created automatically on first launch.

```json
{
  "version": "0.1.0-beta",
  "server": { "port": 3030 },
  "browser": {
    "profileDir": ".browser-profile",
    "timeout": 30000
  },
  "mail": {
    "apiUrl": "https://api.catchmail.io/api/v1",
    "domain": "catchmail.io",
    "timeout": 180
  },
  "qwen": { "baseUrl": "https://chat.qwen.ai" },
  "storage": { "dir": "data" },
  "logger": { "file": "logs/app.log" },
  "cli": { "language": "en", "firstRun": false }
}
```

**server.port** — HTTP API port (default 3030)
**browser.profileDir** — Chromium profile directory
**browser.timeout** — Browser operation timeout (ms)
**mail.apiUrl** — Disposable email API URL
**mail.domain** — Domain for email generation
**mail.timeout** — Email polling timeout (s)
**qwen.baseUrl** — Qwen base URL
**storage.dir** — Data storage directory
**logger.file** — Log file path
**cli.language** — Interface language (`ru` | `en`)

---

## Logging

Logs are written to the file specified in `logger.file` (default: `logs/app.log`).

- **INFO** — Major events (startup, account creation, errors)
- **DEBUG** — Detailed operation logs
- **TRACE** — Only in `--debug` mode

In `--debug` mode, logs are also printed to the console with color formatting.

Rotation: at 10MB, the file is rotated to `app.log.1`; older files are removed.

---

## Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Application already running` | Previous process did not exit | Wait or remove the lock file |
| `No internet connection` | Network unavailable | Check internet connection |
| `Failed to submit form` | Form submission failed (Qwen may have changed) | Verify manually in a browser |
| `Email not received` | Email not delivered within timeout | Check CatchMail, increase mail.timeout |
| `Activation failed` | Could not activate account | Check the activation link manually |
| `Logout failed` | Session cleanup failed | Run again — logout will be retried |
| `Form not visible` | Registration form is not displayed | Check if Qwen access is blocked |

---

## FAQ

**Q: Can I use a different email service?**
A: Yes. Change `mail.apiUrl` and `mail.domain` in `config.json`.

**Q: Does the browser open on every run?**
A: No. The browser starts once (lazy init) on the first operation.

**Q: How many accounts can I create?**
A: Unlimited. Batch mode processes up to 50 at a time.

**Q: How do I stop the process?**
A: Press ESC during wait operations, or Ctrl+C to force stop.

---

## For Developers

### HTTP API

```
GET  /api/ping          — Health check
POST /api/register      — Register an account
POST /api/logout        — Logout and session cleanup
```

Example:

```bash
curl -X POST http://localhost:9412/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@catchmail.io","password":"MyPass123!"}'
```

### Build & Check

```bash
bun install
bun run typecheck   # TypeScript checks
bun run lint        # Linting
bun run dev         # Development mode with hot reload
```

---

## Architecture

The application is built on three principles:

1. **Single source of truth for the browser** — `BrowserManager` is the sole owner of the browser, context, and page. No other module calls `close()`, `newPage()`, or `clearCookies()`. All operations go through `getSharedPage()` or `createPage()`.

2. **Guaranteed cleanup** — After ANY registration outcome (success, failure, cancel, timeout), logout and state cleanup are performed. The next cycle always starts from a clean `/auth?mode=register` page.

3. **Graceful shutdown** — On successful registration or menu exit, all resources are released: HTTP server, browser, storage, process lock. `process.exit()` is never used in normal operation.

### Lifecycle

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

### Why `waitUntil: 'domcontentloaded'`

All navigations use `domcontentloaded` instead of `networkidle`. Qwen maintains a persistent WebSocket connection. `networkidle` would never resolve and would time out. `domcontentloaded` + `waitForSelector` is the only reliable pattern for this site.

---

## License

MIT
