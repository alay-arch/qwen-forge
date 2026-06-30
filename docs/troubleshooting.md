# Решение проблем

## Приложение не запускается

### `Application already running`

Предыдущий процесс не завершился корректно.

```bash
rm -f .qwen-forge.lock
```

### `No internet connection`

Проверьте подключение к сети:

```bash
ping -c 1 google.com
```

### `Qwen unavailable`

Сервис chat.qwen.ai может быть недоступен. Проверьте вручную в браузере.

---

## Ошибки регистрации

### `Failed to submit form`

Возможные причины:
- Изменилась структура страницы Qwen (селекторы устарели)
- CAPTCHA / Cloudflare блокирует отправку
- Проблемы с сетью

### `Email not received`

- Увеличьте `mail.timeout` в `config.json` (по умолчанию 180 с)
- Проверьте CatchMail — возможна задержка доставки
- Убедитесь, что email сгенерирован корректно

### `Activation failed`

- Откройте ссылку активации вручную в браузере
- Возможно, ссылка истекла

### `Logout failed`

- Перезапустите приложение — logout повторится автоматически
- Если проблема повторяется, очистите профиль браузера:

```bash
rm -rf .browser-profile
```

---

## Chromium

### Бинарник не найден

Установите Chromium:

```bash
# Debian / Ubuntu
sudo apt install chromium-browser

# Arch Linux
sudo pacman -S chromium

# Fedora
sudo dnf install chromium
```

### Недостающие разделяемые библиотеки

Диагностика (пункт меню 5) покажет конкретную отсутствующую `.so` библиотеку.

```bash
# Debian / Ubuntu — пример для libnss3
sudo apt install libnss3 libatk-bridge2.0-0 libdrm2 libgbm1

# Arch Linux
sudo pacman -S nss atk at-spi2-atk libdrm mesa
```

### Headless-запуск не работает

Запустите диагностику:

```bash
qf
# Пункт меню 5 — Диагностика
```

Или вручную:

```bash
chromium --headless --no-sandbox --dump-dom https://example.com 2>&1
```

---

## HTTP API

### Сервер не отвечает

- Проверьте, что `qf` запущен
- Проверьте порт: `curl http://localhost:3030/api/ping`
- Если порт изменён в config.json, используйте актуальный

### Порт занят

```bash
lsof -i :3030
```

Измените порт в `config.json`:

```json
{ "server": { "port": 8080 } }
```

---

## Хранилище

### `accounts.json` повреждён

Файл находится в `data/accounts.json`. Если он содержит невалидный JSON:

```bash
rm data/accounts.json
```

Файл будет пересоздан при следующей регистрации. Данные будут потеряны.

---

## Debug-режим

Для детальной диагностики запустите:

```bash
qf --debug
```

Выводится:
- HTTP-запросы с таймингом
- Операции браузера
- Mail-сервис: polling, retry
- Полные стеки ошибок

Логи записываются в `logs/app.log`. Crash-отчёты — в `logs/crash-*.log`.