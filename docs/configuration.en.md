# Configuration

The `config.json` file is created automatically on the first run of `qf`. It is located in the root of the installed directory (`~/.qwen-forge/config.json` or in the repository for manual installations).

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | string | `0.1.3-beta` | Application version (do not edit manually) |
| `server.port` | number | `3030` | HTTP API server port |
| `browser.profileDir` | string | `.browser-profile` | Chromium profile directory |
| `browser.timeout` | number | `30000` | Browser operation timeout (ms) |
| `mail.apiUrl` | string | `https://api.catchmail.io/api/v1` | Mail service API URL |
| `mail.domain` | string | `catchmail.io` | Domain for email generation |
| `mail.timeout` | number | `180` | Maximum wait time for email (seconds) |
| `qwen.baseUrl` | string | `https://chat.qwen.ai` | Qwen base URL |
| `storage.dir` | string | `data` | Account storage directory |
| `logger.file` | string | `logs/app.log` | Log file path |
| `cli.language` | string | `ru` | Interface language: `ru` or `en` |
| `cli.firstRun` | boolean | `false` | First-run flag (automatic) |

## Example

```json
{
  "version": "0.1.3-beta",
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
  "cli": {
    "language": "ru",
    "firstRun": false
  }
}
```

## Editing

### Via Menu

Option **6 — Configuration** in the main menu allows you to view current settings and change key parameters interactively.

### Manually

Open `config.json` in a text editor. Restart `qf` after making changes for them to take effect.

### Reset

Delete `config.json` — it will be recreated with default values on the next run.

```bash
rm config.json
qf
```

## Changing Language

In the configuration menu, select **Language** and specify `ru` or `en`. Or edit `cli.language` in `config.json` manually.

## Changing Port

To change the HTTP API port, edit `server.port`:

```json
{
  "server": { "port": 8080 }
}
```

The API will then be available at `http://localhost:8080`.

## Changing Mail Domain

To use a different CatchMail domain (if available), modify:

```json
{
  "mail": {
    "apiUrl": "https://api.catchmail.io/api/v1",
    "domain": "other-domain.io"
  }
}
```

Email addresses will be generated with the specified domain.