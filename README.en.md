# Qwen Forge

**v0.1.3-beta** — Automated account registration for Qwen (chat.qwen.ai) using disposable email via CatchMail.

---

## Features

- Single or batch account registration (up to 50)
- Email confirmation via CatchMail API
- Automatic account activation from email link
- Full cycle: register → activate → logout → state cleanup
- HTTP API for external script integration
- System diagnostics (network, DNS, browser, configuration)
- Session and historical statistics
- Russian and English interface

---

## Requirements

| Dependency | Version |
|------------|---------|
| Bun        | ≥ 1.3   |
| Git        | any     |
| Chromium / Google Chrome | system package |

**OS**: Linux (Windows via WSL)

---

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The script checks dependencies, clones the repository to `~/.qwen-forge`, and creates a `qf` symlink in `~/.local/bin/`.

After installation, restart your shell or run:

```bash
source ~/.bashrc
```

Full installation docs: [docs/installation.en.md](./docs/installation.en.md)

---

## Quick Start

```bash
qf
```

This launches the interactive menu:

```
1  Create account
2  Batch
3  Session
4  Statistics
5  Diagnostics
6  Configuration
0  Exit
```

---

## CLI

| Command | Description |
|---------|-------------|
| `qf` | Interactive menu |
| `qf --debug` | Debug mode (TRACE, console output) |
| `qf --help`, `-h` | Show help |
| `qf --version`, `-v` | Show version |

---

## HTTP API

The server starts automatically when the application launches.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ping` | Health check |
| POST | `/api/register` | Register an account |
| POST | `/api/logout` | Logout and session cleanup |

Default port: `3030`. Configurable in `config.json`.

```bash
curl http://localhost:3030/api/ping
```

---

## Diagnostics

Built-in diagnostics (menu item 5) checks:

- Internet connection and DNS
- chat.qwen.ai and CatchMail API availability
- Configuration validity
- Storage directory and browser profile
- HTTP server and browser status
- Disk space and memory
- System Chromium (binary, shared libraries, distro)

Extended logging: `qf --debug`

---

## Configuration

`config.json` is created automatically on first run.

| Option | Default | Description |
|--------|---------|-------------|
| `server.port` | `3030` | HTTP API port |
| `browser.profileDir` | `.browser-profile` | Browser profile directory |
| `browser.timeout` | `30000` | Browser operation timeout (ms) |
| `mail.apiUrl` | `https://api.catchmail.io/api/v1` | Mail service API URL |
| `mail.domain` | `catchmail.io` | Domain for email generation |
| `mail.timeout` | `180` | Email wait timeout (s) |
| `qwen.baseUrl` | `https://chat.qwen.ai` | Qwen base URL |
| `storage.dir` | `data` | Account storage directory |
| `logger.file` | `logs/app.log` | Log file path |
| `cli.language` | `ru` | Interface language (`ru` / `en`) |

---

## Updating

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The script updates the existing installation via `git pull`.

---

## Project Structure

```
qwen-forge/
├── bin/qf                  # Entry point (bash wrapper)
├── install.sh              # Installer
├── config.json             # Configuration (auto-generated)
├── src/
│   ├── index.ts            # Entry point, bootstrap
│   ├── context.ts          # AppContext (circular dependency break)
│   ├── types.ts            # All types and interfaces
│   ├── i18n.ts             # EN/RU translations
│   ├── theme.ts            # UI: colors, Spinner, Screen
│   ├── version.ts          # Version constant
│   ├── browser/manager.ts  # Sole browser lifecycle owner
│   ├── cli/                # Input, menu, helpers
│   ├── config/manager.ts   # Config load/save
│   ├── diagnostics/        # Chromium diagnostics, doctor
│   ├── mail/service.ts     # CatchMail: email, password, activation
│   ├── server/http.ts      # HTTP API (Bun.serve)
│   ├── services/           # Business logic (registration, batch, logout)
│   ├── storage/json.ts     # JSON storage with atomic writes
│   └── utils/              # Logger, Lock, EventBus, Network, Crash, Sanitizer
├── data/                   # Account storage (accounts.json)
├── logs/                   # Application logs
└── docs/                   # Documentation
```

---

## Supported Operating Systems

| Distribution | Status |
|--------------|--------|
| Debian 12 | Tested |
| Debian 13 | Tested |
| Arch Linux | Tested |
| Ubuntu | Expected to work, not officially tested |
| Fedora | Expected to work, not officially tested |
| openSUSE | Expected to work, not officially tested |
| Alpine | Expected to work, not officially tested |
| Void Linux | Expected to work, not officially tested |
| Gentoo | Expected to work, not officially tested |
| Linux Mint | Expected to work, not officially tested |
| Pop!_OS | Expected to work, not officially tested |
| Rocky Linux | Expected to work, not officially tested |
| AlmaLinux | Expected to work, not officially tested |

Testing was performed inside Docker containers.

---

## Documentation

- [Installation](./docs/installation.en.md)
- [CLI and HTTP API](./docs/cli.en.md)
- [Configuration](./docs/configuration.en.md)
- [Troubleshooting](./docs/troubleshooting.en.md)
- [Development](./docs/development.en.md)
- [Contributing](./docs/contributing.en.md)

---

## Contributing

Report bugs via [Issues](https://github.com/alay-arch/qwen-forge/issues). Submit improvements via Pull Requests. See [docs/contributing.en.md](./docs/contributing.en.md).

---

## License

MIT
