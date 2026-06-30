# Qwen Forge

**v0.1.3-beta** — автоматическая регистрация аккаунтов на Qwen (chat.qwen.ai) через одноразовую почту CatchMail.

---

## Возможности

- Регистрация одного или нескольких аккаунтов (пакетный режим до 50)
- Подтверждение email через CatchMail API
- Автоматическая активация по ссылке из письма
- Полный цикл: регистрация → активация → logout → очистка состояния
- HTTP API для интеграции с внешними скриптами
- Диагностика системы (интернет, DNS, браузер, конфигурация)
- Статистика по сессии и за всё время
- Интерфейс на русском и английском языках

---

## Требования

| Зависимость | Версия |
|-------------|--------|
| Bun         | ≥ 1.3  |
| Git         | любая  |
| Chromium / Google Chrome | системный |

**ОС**: Linux (Windows через WSL)

---

## Установка

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт проверяет зависимости, клонирует репозиторий в `~/.qwen-forge`, создаёт symlink `qf` в `~/.local/bin/`.

После установки перезапустите shell или выполните:

```bash
source ~/.bashrc
```

Полная документация по установке: [docs/installation.md](./docs/installation.md)

---

## Быстрый старт

```bash
qf
```

Запустится интерактивное меню:

```
1  Создать аккаунт
2  Пакетное создание
3  Аккаунты сессии
4  Статистика
5  Диагностика
6  Конфигурация
0  Выход
```

---

## CLI

| Команда | Описание |
|---------|----------|
| `qf` | Интерактивное меню |
| `qf --debug` | Режим отладки (TRACE, вывод в консоль) |
| `qf --help`, `-h` | Справка |
| `qf --version`, `-v` | Версия |

---

## HTTP API

Сервер запускается автоматически при старте приложения.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/ping` | Проверка работоспособности |
| POST | `/api/register` | Регистрация аккаунта |
| POST | `/api/logout` | Выход и очистка сессии |

Порт по умолчанию: `3030`. Настраивается в `config.json`.

```bash
curl http://localhost:3030/api/ping
```

---

## Диагностика

Встроенная диагностика (пункт меню 5) проверяет:

- Интернет-соединение и DNS
- Доступность chat.qwen.ai и CatchMail API
- Валидность конфигурации
- Директорию хранилища и профиль браузера
- Статус HTTP-сервера и браузера
- Свободное место и память
- Системный Chromium (бинарник, разделяемые библиотеки, дистрибутив)

Расширенное логирование: `qf --debug`

---

## Конфигурация

Файл `config.json` создаётся автоматически при первом запуске.

| Параметр | По умолчанию | Описание |
|----------|-------------|----------|
| `server.port` | `3030` | Порт HTTP API |
| `browser.profileDir` | `.browser-profile` | Директория профиля браузера |
| `browser.timeout` | `30000` | Таймаут операций браузера (мс) |
| `mail.apiUrl` | `https://api.catchmail.io/api/v1` | URL API почтового сервиса |
| `mail.domain` | `catchmail.io` | Домен для генерации email |
| `mail.timeout` | `180` | Таймаут ожидания письма (с) |
| `qwen.baseUrl` | `https://chat.qwen.ai` | Базовый URL Qwen |
| `storage.dir` | `data` | Директория хранилища аккаунтов |
| `logger.file` | `logs/app.log` | Файл логов |
| `cli.language` | `ru` | Язык интерфейса (`ru` / `en`) |

---

## Обновление

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт обновит существующую установку через `git pull`.

---

## Структура проекта

```
qwen-forge/
├── bin/qf                  # Entry point (bash wrapper)
├── install.sh              # Установщик
├── config.json             # Конфигурация (создаётся автоматически)
├── src/
│   ├── index.ts            # Точка входа, bootstrap
│   ├── context.ts          # AppContext (разрыв циклической зависимости)
│   ├── types.ts            # Все типы и интерфейсы
│   ├── i18n.ts             # Переводы EN/RU
│   ├── theme.ts            # UI: цвета, Spinner, Screen
│   ├── version.ts          # Константа версии
│   ├── browser/manager.ts  # Единственный владелец браузера
│   ├── cli/                # Ввод, меню, хелперы
│   ├── config/manager.ts   # Загрузка/сохранение конфигурации
│   ├── diagnostics/        # Chromium-диагностика, doctor
│   ├── mail/service.ts     # CatchMail: email, пароль, активация
│   ├── server/http.ts      # HTTP API (Bun.serve)
│   ├── services/           # Бизнес-логика (регистрация, batch, logout)
│   ├── storage/json.ts     # JSON-хранилище с атомарной записью
│   └── utils/              # Logger, Lock, EventBus, Network, Crash, Sanitizer
├── data/                   # Хранилище аккаунтов (accounts.json)
├── logs/                   # Логи приложения
└── docs/                   # Документация
```

---

## Поддерживаемые ОС

| Дистрибутив | Статус |
|-------------|--------|
| Debian 12 | Тестировано |
| Debian 13 | Тестировано |
| Arch Linux | Тестировано |
| Ubuntu | Ожидается работа, не тестировано |
| Fedora | Ожидается работа, не тестировано |
| openSUSE | Ожидается работа, не тестировано |
| Alpine | Ожидается работа, не тестировано |
| Void Linux | Ожидается работа, не тестировано |
| Gentoo | Ожидается работа, не тестировано |
| Linux Mint | Ожидается работа, не тестировано |
| Pop!_OS | Ожидается работа, не тестировано |
| Rocky Linux | Ожидается работа, не тестировано |
| AlmaLinux | Ожидается работа, не тестировано |

Тестирование проводилось в Docker-контейнерах.

---

## Документация

- [Установка](./docs/installation.md)
- [CLI и HTTP API](./docs/cli.md)
- [Конфигурация](./docs/configuration.md)
- [Решение проблем](./docs/troubleshooting.md)
- [Разработка](./docs/development.md)
- [Участие](./docs/contributing.md)

---

## Участие

Баги — через [Issues](https://github.com/alay-arch/qwen-forge/issues). Предложения — через Pull Requests. Подробности: [docs/contributing.md](./docs/contributing.md)

---

## Лицензия

MIT
