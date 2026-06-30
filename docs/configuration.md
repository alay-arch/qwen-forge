# Конфигурация

Файл `config.json` создаётся автоматически при первом запуске `qf`. Находится в корне установленной директории (`~/.qwen-forge/config.json` или в репозитории при ручной установке).

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `version` | string | `0.1.3-beta` | Версия приложения (не изменять вручную) |
| `server.port` | number | `3030` | Порт HTTP API сервера |
| `browser.profileDir` | string | `.browser-profile` | Директория профиля Chromium |
| `browser.timeout` | number | `30000` | Таймаут операций браузера (мс) |
| `mail.apiUrl` | string | `https://api.catchmail.io/api/v1` | URL API почтового сервиса |
| `mail.domain` | string | `catchmail.io` | Домен для генерации email |
| `mail.timeout` | number | `180` | Максимальное время ожидания письма (секунды) |
| `qwen.baseUrl` | string | `https://chat.qwen.ai` | Базовый URL Qwen |
| `storage.dir` | string | `data` | Директория хранилища аккаунтов |
| `logger.file` | string | `logs/app.log` | Путь к файлу логов |
| `cli.language` | string | `ru` | Язык интерфейса: `ru` или `en` |
| `cli.firstRun` | boolean | `false` | Флаг первого запуска (автоматический) |

## Пример

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

## Редактирование

### Через меню

Пункт **6 — Конфигурация** в главном меню позволяет просмотреть текущие настройки и изменить ключевые параметры интерактивно.

### Вручную

Откройте `config.json` в текстовом редакторе. Перезапустите `qf` после внесения изменений.

### Сброс

Удалите `config.json` — он будет создан заново со значениями по умолчанию при следующем запуске.

```bash
rm config.json
qf
```

## Смена языка

В меню конфигурации выберите **Language** и укажите `ru` или `en`. Или измените `cli.language` в `config.json` вручную.

## Смена порта

Для изменения порта HTTP API отредактируйте `server.port`:

```json
{
  "server": { "port": 8080 }
}
```

API станет доступен по адресу `http://localhost:8080`.

## Смена домена почты

Для использования другого домена CatchMail (если доступен), измените:

```json
{
  "mail": {
    "apiUrl": "https://api.catchmail.io/api/v1",
    "domain": "other-domain.io"
  }
}
```

Email-адреса будут генерироваться с указанным доменом.