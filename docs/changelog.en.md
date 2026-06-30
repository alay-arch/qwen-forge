# Changelog

## 0.1.2-beta

Final quality-audit release before broader public use.

### Fixed
- Chromium: diagnostics now run a real headless browser launch first and analyze stderr only after launch failure
- Chromium: CloakBrowser binary lookup now covers `CLOAKBROWSER_BINARY_PATH` and `~/.cloakbrowser/chromium-*`
- Chromium: Debian 12 no longer receives invalid `t64` package recommendations
- Chromium: Arch no longer prints install commands for packages already installed
- Chromium: added Void, Gentoo, and a dedicated openSUSE package map
- Installer: `bun install` failures are no longer hidden by a pipeline
- Installer: `qf` verification checks the exact installed path, not any command named `qf`
- Installer: PATH is prepended, and the wrapper points to the actual `INSTALL_DIR`
- Installer: root execution is blocked by default to avoid installing into `/root`
- HTTP API: removed open CORS `*`, added localhost Origin validation
- HTTP API: added JSON, email/password validation and browser-operation busy protection
- Security: activation links are allowed only for `https://*.qwen.ai`
- Security: generated emails and passwords now use cryptographic RNG
- Storage: `accounts.json` is written with `0600` permissions, write queue recovers after failures
- Runtime: lock file is acquired atomically with `wx`
- Runtime: browser start is protected against race conditions and double-context leaks
- Runtime: crash handlers run full shutdown instead of only removing the lock file

### Documentation
- README and README.en updated for the actual Chromium diagnostic algorithm
- Installation docs clarified user-local install, PATH behavior, and supported Linux distros
- Version bumped to 0.1.2-beta

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
