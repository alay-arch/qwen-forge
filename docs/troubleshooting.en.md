# Troubleshooting

## Application won't start

### `Application already running`

```bash
rm -f .qwen-forge.lock
```

### `No internet connection`

```bash
ping -c 3 chat.qwen.ai
```

Check proxy, VPN, firewall.

---

## Registration

### `Registration failed`

- Check internet connection
- Run diagnostics: `qf` → option 5
- Qwen may temporarily block registrations — wait and retry

### `Activation failed`

- Open the activation link manually in a browser
- Link may have expired — create a new account

### `No confirmation email`

- Wait 2-3 minutes
- Check `logs/app.log`
- Run `qf --debug` for detailed logs

### `Logout failed`

- Restart the app — logout will retry automatically
- Clear browser profile:
```bash
rm -rf .browser-profile
```

---

## Chromium

### Browser not found

```bash
# Debian / Ubuntu
sudo apt install chromium-browser

# Arch
sudo pacman -S chromium

# Fedora
sudo dnf install chromium
```

### Missing shared libraries

Diagnostics (`qf` → option 5) will show the specific `.so` library.

```bash
# Debian / Ubuntu
sudo apt install libnss3 libatk-bridge2.0-0 libdrm2 libgbm1

# Arch
sudo pacman -S nss atk at-spi2-atk libdrm mesa
```

### Headless won't launch

```bash
chromium --headless --no-sandbox --dump-dom https://example.com 2>&1
```

---

## HTTP API

### Server not responding

- Verify `qf` is running
- `curl http://localhost:3030/api/ping`
- If port was changed in config.json, use the current one

### Port already in use

```bash
lsof -i :3030
```

Change port in `config.json`:
```json
{ "server": { "port": 8080 } }
```

---

## Storage

### `accounts.json` corrupted

```bash
rm data/accounts.json
```

The file will be recreated on next registration. Data will be lost.

---

## Debug

```bash
qf --debug
```

Logs: `logs/app.log`. Crashes: `logs/crash-*.log`.