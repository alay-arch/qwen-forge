# Troubleshooting

## Application won't start

### `Application already running`

The previous process did not exit cleanly.

```bash
rm -f .qwen-forge.lock
```

### `No internet connection`

Check your network:

```bash
ping -c 1 google.com
```

### `Qwen unavailable`

chat.qwen.ai may be down. Check manually in a browser.

---

## Registration errors

### `Failed to submit form`

Possible causes:
- Qwen page structure changed (selectors outdated)
- CAPTCHA / Cloudflare blocking the submission
- Network issues

### `Email not received`

- Increase `mail.timeout` in `config.json` (default 180s)
- Check CatchMail — delivery may be delayed
- Verify the email was generated correctly

### `Activation failed`

- Open the activation link manually in a browser
- The link may have expired

### `Logout failed`

- Restart the application — logout will retry automatically
- If the issue persists, clear the browser profile:

```bash
rm -rf .browser-profile
```

---

## Chromium

### Binary not found

Install Chromium:

```bash
# Debian / Ubuntu
sudo apt install chromium-browser

# Arch Linux
sudo pacman -S chromium

# Fedora
sudo dnf install chromium
```

### Missing shared libraries

Diagnostics (menu item 5) will show the specific missing `.so` library.

```bash
# Debian / Ubuntu — example for libnss3
sudo apt install libnss3 libatk-bridge2.0-0 libdrm2 libgbm1

# Arch Linux
sudo pacman -S nss atk at-spi2-atk libdrm mesa
```

### Headless launch fails

Run diagnostics:

```bash
qf
# Menu item 5 — Diagnostics
```

Or manually:

```bash
chromium --headless --no-sandbox --dump-dom https://example.com 2>&1
```

---

## HTTP API

### Server not responding

- Verify `qf` is running
- Check the port: `curl http://localhost:3030/api/ping`
- If the port was changed in config.json, use the current one

### Port already in use

```bash
lsof -i :3030
```

Change the port in `config.json`:

```json
{ "server": { "port": 8080 } }
```

---

## Storage

### `accounts.json` corrupted

The file is at `data/accounts.json`. If it contains invalid JSON:

```bash
rm data/accounts.json
```

The file will be recreated on the next registration. Data will be lost.

---

## Debug mode

For detailed diagnostics:

```bash
qf --debug
```

Outputs:
- HTTP requests with timing
- Browser operations
- Mail service: polling, retry
- Full error stacks

Logs are written to `logs/app.log`. Crash reports go to `logs/crash-*.log`.