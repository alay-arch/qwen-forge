# Конфигурация

Файл `config.json` находится в корне проекта (`~/.qwen-forge/config.json`).

## Параметры

| Параметр | По умолчанию | Описание |
|----------|-------------|----------|
| `server.port` | `3030` | Порт HTTP API |
| `browser.profileDir` | `.browser-profile` | Директория профиля Chromium |
| `browser.timeout` | `30000` | Таймаут операций браузера (мс) |
| `mail.apiUrl` | `https://api.catchmail.io/api/v1` | API почтового сервиса |
| `mail.domain` | `catchmail.io` | Домен для генерации email |
| `mail.timeout` | `180` | Ожидание письма (сек) |
| `qwen.baseUrl` | `https://chat.qwen.ai` | URL Qwen |
| `storage.dir` | `data` | Директория хранилища |
| `cli.language` | `ru` | Язык интерфейса (`ru` / `en`) |

## Пример

```json
{
  "server": { "port": 3030 },
  "browser": { "profileDir": ".browser-profile", "timeout": 30000 },
  "mail": { "domain": "catchmail.io", "timeout": 180 },
  "cli": { "language": "ru" }
}
```

## Смена языка

Пункт меню **6 — Конфигурация** или вручную:

```json
{ "cli": { "language": "en" } }
```

## Смена порта

```json
{ "server": { "port": 8080 } }
```

Проверь, что порт свободен:
```bash
lsof -i :8080
```