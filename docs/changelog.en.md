# Changelog

## 0.1.0-beta

First public beta release.

### Added
- Automated Qwen account registration
- Email confirmation via CatchMail API
- Automatic activation from email link
- Batch creation (up to 50 accounts)
- HTTP API for external script integration
- System diagnostics
- Statistics (session + history)
- Two interface languages (RU/EN)
- Graceful shutdown

### Architecture
- `BrowserManager` — single browser owner
- `context.ts` — breaks AppContext circular dependency
- logout in `finally` — guaranteed cleanup after any operation
- `waitUntil: 'domcontentloaded'` — prevents WebSocket hangs

### Installation
- `install.sh` — curl-to-bash installer
- `bin/qf` — global command
