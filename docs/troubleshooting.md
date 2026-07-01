# Решение проблем

## Приложение не запускается

### `Application already running`

```bash
rm -f .qwen-forge.lock
```

### `No internet connection`

```bash
ping -c 3 chat.qwen.ai
```

Проверь прокси, VPN, firewall.

---

## Регистрация

### `Registration failed`

- Проверь интернет
- Запусти диагностику: `qf` → пункт 5
- Qwen может временно блокировать регистрации — подожди и попробуй снова

### `Activation failed`

- Открой ссылку активации вручную в браузере
- Ссылка могла истечь — создай аккаунт заново

### `No confirmation email`

- Подожди 2-3 минуты
- Проверь `logs/app.log`
- Запусти `qf --debug` для детальных логов

### `Logout failed`

- Перезапусти приложение — logout повторится автоматически
- Очисти профиль браузера:
```bash
rm -rf .browser-profile
```

---

## Chromium

### Браузер не найден

```bash
# Debian / Ubuntu
sudo apt install chromium-browser

# Arch
sudo pacman -S chromium

# Fedora
sudo dnf install chromium
```

### Недостающие библиотеки

Диагностика (`qf` → пункт 5) покажет конкретную `.so` библиотеку.

```bash
# Debian / Ubuntu
sudo apt install libnss3 libatk-bridge2.0-0 libdrm2 libgbm1

# Arch
sudo pacman -S nss atk at-spi2-atk libdrm mesa
```

### Headless не запускается

```bash
chromium --headless --no-sandbox --dump-dom https://example.com 2>&1
```

---

## HTTP API

### Сервер не отвечает

- Проверь, что `qf` запущен
- `curl http://localhost:3030/api/ping`
- Если порт изменён в config.json — используй актуальный

### Порт занят

```bash
lsof -i :3030
```

Смени порт в `config.json`:
```json
{ "server": { "port": 8080 } }
```

---

## Хранилище

### `accounts.json` повреждён

```bash
rm data/accounts.json
```

Файл пересоздастся при следующей регистрации. Данные будут потеряны.

---

## Отладка

```bash
qf --debug
```

Логи: `logs/app.log`. Краши: `logs/crash-*.log`.