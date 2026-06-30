# Установка

## Требования

| Зависимость | Минимальная версия |
|-------------|-------------------|
| Bun         | ≥ 1.3             |
| Git         | любая             |
| Chromium / Google Chrome | системный пакет |

**ОС**: Linux (Windows через WSL)

```bash
curl -fsSL https://bun.sh/install | bash
```

## Установка (рекомендуемый способ)

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт install.sh:
1. Проверяет наличие Bun, Git и curl/wget
2. Клонирует репозиторий в `~/.qwen-forge`
3. Устанавливает зависимости (`bun install`)
4. Создаёт symlink `qf` в `~/.local/bin/qf`
5. Добавляет `~/.local/bin` в PATH через shell-конфигурацию
6. Проверяет разрешение пути в PATH
7. Запускает диагностику Chromium (реальный headless-запуск)

**Не запускайте через `sudo`** — установка выполняется для текущего пользователя. Для root-окружений используйте `QWEN_FORGE_ALLOW_ROOT=1`.

После установки перезапустите терминал:

```bash
qf --version
```

## Ручная установка

```bash
git clone https://github.com/alay-arch/qwen-forge.git
cd qwen-forge
bun install
```

Запуск без глобальной регистрации:

```bash
./bin/qf
```

Или через Bun:

```bash
bun src/index.ts
```

## Обновление

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт выполнит `git fetch` и `git reset --hard` в `~/.qwen-forge`, только если нет локальных изменений.

## Удаление

```bash
rm -rf ~/.qwen-forge
rm -f ~/.local/bin/qf
```

Удалите строку с `~/.local/bin` из вашего shell-конфига (`~/.bashrc`, `~/.zshrc` и т.д.), если она была добавлена скриптом установки.

## Поддерживаемые оболочки

| Shell | Поддержка |
|-------|-----------|
| bash  | Да        |
| zsh   | Да        |
| fish  | Да        |

Скрипт установки автоматически определяет конфигурационный файл.

## PATH

Команда `qf` устанавливается в `~/.local/bin/`. Этот каталог добавляется в начало PATH через первый найденный конфигурационный файл:

- `~/.bashrc`
- `~/.zshrc`
- `~/.config/fish/config.fish`

Если PATH не обновился после установки, откройте новый терминал или выполните `source ~/.bashrc` (или соответствующий файл для вашей оболочки).

## Решение проблем при установке

### `command not found: qf`

1. Перезапустите терминал
2. Убедитесь, что `~/.local/bin` в PATH: `echo $PATH`
3. Проверьте, что symlink существует: `ls -la ~/.local/bin/qf`

### Chromium не найден

Установите Chromium или Google Chrome:

```bash
# Debian / Ubuntu
sudo apt install chromium-browser

# Arch Linux
sudo pacman -S chromium

# Fedora
sudo dnf install chromium
```

### Bun не найден

```bash
curl -fsSL https://bun.sh/install | bash
```

### Ошибка: Application already running

Предыдущий процесс не завершился. Удалите lock-файл:

```bash
rm -f .qwen-forge.lock
```

### Debug-режим

Запустите с расширенным логированием:

```bash
qf --debug
```

Логи выводятся в консоль (TRACE уровень) и записываются в `logs/app.log`.
