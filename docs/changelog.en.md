# Changelog

## 0.1.1-beta

Bugfix release — critical fixes for first public beta.

### Fixed
- Installer: `command -v qf` now uses real PATH check, never shows false positive
- Installer: proper PATH export with `hash -r` before verification
- First-run wizard: moved before lock to prevent menu not appearing
- First-run wizard: graceful HTTP server failure no longer blocks startup
- Chromium: missing system libraries now show a clear distro-specific error
- Chromium: unified diagnostic module used by install.sh, doctor, bootstrap, and pre-registration
- Chromium: actual binary launch test (not just library check)
- Documentation: added Chromium Runtime Requirements section
- Docker: validated on Debian Bookworm
- Idempotency: repeated install.sh runs safe, no duplicate PATH entries

### Changed
- Version bumped to 0.1.1-beta

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
