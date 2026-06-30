# CLI

## Commands

| Command | Description |
|---------|-------------|
| `qf` | Launch interactive menu |
| `qf --debug` | Debug mode (TRACE logs to console) |
| `qf --help`, `-h` | Show help |
| `qf --version`, `-v` | Show version |

## Interactive Menu

Running `qf` without arguments opens the main menu:

```
1  Create account
2  Batch
3  Session
4  Statistics
5  Diagnostics
6  Configuration
0  Exit
```

### 1 — Create Account

Single account registration:
1. Generates email on CatchMail
2. Opens Chromium, fills registration form
3. Waits for confirmation email
4. Follows activation link
5. Automatic logout and state cleanup

Press ESC to cancel during wait phases.

### 2 — Batch

Serial registration of multiple accounts (up to 50 per run).
After each account — a 3–7 second pause to reduce detection.

Press ESC to cancel the entire batch.

### 3 — Session Accounts

View accounts created in the current session:
- Email, password, status, creation time
- Clear session list

### 4 — Statistics

Summary:
- Total accounts in storage
- Successful / failed registrations
- Average registration duration
- Session start time

### 5 — Diagnostics

Full system check (see Diagnostics section below).

### 6 — Configuration

View and edit `config.json` via interactive menu.

### 0 — Exit

Graceful shutdown: stops HTTP server, closes browser, releases lock.

## HTTP API

The server starts automatically on the port from `config.json` (default `3030`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ping` | Health check — returns `{"status":"ok"}` |
| POST | `/api/register` | Register account (JSON body: `{"email":"...","password":"..."}`) |
| POST | `/api/logout` | Logout and browser session cleanup |

Example:

```bash
curl http://localhost:3030/api/ping

curl -X POST http://localhost:3030/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@catchmail.io","password":"MyPass123!"}'
```

## Supported Operating Systems

Testing was performed inside Docker containers.

| Distribution | Status |
|--------------|--------|
| Debian 12 | ✅ Tested |
| Debian 13 | ✅ Tested |
| Arch Linux | ✅ Tested |
| Ubuntu | Expected to work, not tested |
| Fedora | Expected to work, not tested |
| openSUSE | Expected to work, not tested |
| Alpine | Expected to work, not tested |
| Void Linux | Expected to work, not tested |
| Gentoo | Expected to work, not tested |
| Linux Mint | Expected to work, not tested |
| Pop!_OS | Expected to work, not tested |
| Rocky Linux | Expected to work, not tested |
| AlmaLinux | Expected to work, not tested |
| Windows (WSL) | Expected to work, not tested |

## Diagnostics

Built-in check (menu item 5) performs:

| Check | What it verifies |
|-------|-----------------|
| Internet | DNS resolution via Google (8.8.8.8) |
| DNS | Resolution of chat.qwen.ai |
| Qwen API | HTTPS connection to chat.qwen.ai |
| CatchMail API | HTTPS connection to api.catchmail.io |
| Config | config.json validity |
| Storage | data/ directory exists |
| Browser Profile | .browser-profile/ exists |
| HTTP Server | Server status |
| Browser | Browser status |
| Disk Space | Available disk space |
| Memory | Available RAM |
| Chromium | Binary search, launch test, missing .so detection, distro identification |
