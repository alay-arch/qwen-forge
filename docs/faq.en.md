# FAQ

## General

**Can I use a different email service instead of CatchMail?**
Yes. Change `mail.apiUrl` and `mail.domain` in `config.json`.

**Does the browser open on every run?**
No. The browser starts once (lazy init) on the first operation.

**How many accounts can I create at once?**
Batch mode supports up to 50. The limit can be changed in source code (`MAX_BATCH` in `src/services/batch.ts`).

**How do I stop the process?**
- ESC during wait operations (email, activation)
- Ctrl+C for hard stop
- Menu item 0 (Exit)

**Can I use Qwen Forge on Windows?**
Via WSL. The project has not been tested on native Windows.

## Technical

**Why use `domcontentloaded` instead of `networkidle`?**
Qwen maintains a persistent WebSocket connection. `networkidle` waits for 0 active connections and never resolves. `domcontentloaded` + `waitForSelector` is the only reliable pattern.

**What is cloakbrowser?**
A library for launching Chromium with anti-detection settings (stealth, fingerprinting, geolocation).

**Why Bun instead of Node.js?**
Bun has faster dependency installation, a built-in TypeScript runtime, and a test runner. The project has no Node.js API dependencies.

**How does process locking work?**
A lock file is created at `/tmp/qwen-forge.lock` on startup. If the file already exists, the application exits with an error.
