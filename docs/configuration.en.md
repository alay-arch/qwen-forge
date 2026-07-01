# Configuration

The `config.json` file is in the project root (`~/.qwen-forge/config.json`).

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `server.port` | `3030` | HTTP API port |
| `browser.profileDir` | `.browser-profile` | Chromium profile directory |
| `browser.timeout` | `30000` | Browser operation timeout (ms) |
| `mail.apiUrl` | `https://api.catchmail.io/api/v1` | Mail service API URL |
| `mail.domain` | `catchmail.io` | Domain for email generation |
| `mail.timeout` | `180` | Email wait time (seconds) |
| `qwen.baseUrl` | `https://chat.qwen.ai` | Qwen URL |
| `storage.dir` | `data` | Storage directory |
| `cli.language` | `en` | Interface language (`ru` / `en`) |

## Example

```json
{
  "server": { "port": 3030 },
  "browser": { "profileDir": ".browser-profile", "timeout": 30000 },
  "mail": { "domain": "catchmail.io", "timeout": 180 },
  "cli": { "language": "en" }
}
```

## Change language

Menu item **6 — Configuration** or manually:

```json
{ "cli": { "language": "ru" } }
```

## Change port

```json
{ "server": { "port": 8080 } }
```

Verify the port is free:
```bash
lsof -i :8080
```