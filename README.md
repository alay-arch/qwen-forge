# Qwen Forge

**v0.1.3-beta**

Автоматическая регистрация аккаунтов Qwen (chat.qwen.ai) через одноразовую почту.

## Что это

Qwen Forge регистрирует аккаунты на chat.qwen.ai без ручного ввода. Создаёт временный email, заполняет форму, подтверждает регистрацию, сохраняет данные.

**Зачем:**
- Нужен аккаунт для тестирования
- Массовая регистрация для команды
- Автоматизация без ручного ввода

## Установка

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт проверит зависимости (Bun, Git, Chromium), установит проект в `~/.qwen-forge` и создаст команду `qf`.

После установки:
```bash
source ~/.bashrc
qf --version
```

## Использование

Запусти интерактивное меню:
```bash
qf
```

Выбери действие:
```
1  Создать аккаунт
2  Пакетное создание
3  Сессия
4  Статистика
5  Диагностика
6  Настройки
0  Выход
```

### Примеры

**Создать один аккаунт:**
```bash
qf
# Выбери "1" → следуй инструкциям
```

**Создать 10 аккаунтов:**
```bash
qf
# Выбери "2" → введи "10"
```

**Проверить систему:**
```bash
qf
# Выбери "5" → диагностика покажет проблемы
```

## HTTP API

Сервер запускается автоматически на `localhost:3030`.

**Проверка:**
```bash
curl http://localhost:3030/api/ping
```

**Создать аккаунт:**
```bash
curl -X POST http://localhost:3030/api/register
```

**Выйти:**
```bash
curl -X POST http://localhost:3030/api/logout
```

## Конфигурация

Настройки в `config.json`:

```json
{
  "version": "0.1.3-beta",
  "server": { "port": 3030 },
  "browser": { "profileDir": ".browser-profile", "timeout": 30000 },
  "mail": { "apiUrl": "https://api.catchmail.io/api/v1", "domain": "catchmail.io" },
  "cli": { "language": "ru" }
}
```

**Параметры:**
- `server.port` — порт HTTP API
- `browser.timeout` — таймаут операций (мс)
- `cli.language` — язык интерфейса (`ru` или `en`)

## Типичные проблемы

### `Chromium not found`
Установи Chromium:
```bash
# Debian/Ubuntu
sudo apt install chromium-browser

# Arch
sudo pacman -S chromium
```

### `Missing shared libraries`
Установи зависимости:
```bash
# Debian/Ubuntu
sudo apt install libnss3 libatk-bridge2.0-0 libdrm2 libgbm1

# Arch
sudo pacman -S nss atk at-spi2-atk libdrm mesa
```

### `Registration failed`
- Проверь интернет
- Запусти диагностику: `qf` → пункт 5
- Попробуй позже (возможны лимиты Qwen)

### `No confirmation email`
- Подожди 2-3 минуты
- Проверь логи: `logs/app.log`
- Запусти с `--debug` для детальной диагностики

## Отладка

Подробные логи:
```bash
qf --debug
```

Логи сохраняются в `logs/app.log`. Краши — в `logs/crash-*.log`.

## Требования

- **Bun** ≥ 1.3
- **Git** — любая версия
- **Chromium** или **Google Chrome** — системный пакет
- **ОС**: Linux (Windows через WSL)

## Документация

- [Установка](docs/installation.md)
- [CLI](docs/cli.md)
- [Конфигурация](docs/configuration.md)
- [Решение проблем](docs/troubleshooting.md)
- [Разработка](docs/development.md)

## Лицензия

MIT
