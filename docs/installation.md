# Установка

## Требования

| Зависимость | Минимальная версия |
|-------------|-------------------|
| Bun         | ≥ 1.3             |
| Git         | любая             |
| Chromium / Google Chrome | системный пакет |

**ОС**: Linux (Windows через WSL)

## Установка (рекомендуемый способ)

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт `install.sh`:
1. Проверяет наличие Bun, Git и curl/wget
2. Клонирует репозиторий в `~/.qwen-forge`
3. Устанавливает зависимости (`bun install`)
4. Создаёт symlink `qf` в `~/.local/bin/qf`
5. Добавляет `~/.local/bin` в PATH
6. Запускает диагностику Chromium

**Не запускайте через `sudo`** — установка выполняется для текущего пользователя.

После установки перезапустите терминал:
```bash
source ~/.bashrc
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

Или вручную:
```bash
cd ~/.qwen-forge
git pull
bun install
```

## Проверка установки

```bash
qf --version
```

Должна появиться версия `0.1.3-beta`.

## Следующие шаги

- [Использование](cli.md)
- [Конфигурация](configuration.md)
- [Решение проблем](troubleshooting.md)
