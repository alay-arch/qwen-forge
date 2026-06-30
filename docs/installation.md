# Установка

## Требования

- **Bun** ≥ 1.3 (https://bun.sh)
- **Git** (для установки из репозитория)
- **ОС**: Linux (Windows через WSL)

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
4. Регистрирует user-local команду `qf` в `~/.local/bin/qf`
5. Добавляет `~/.local/bin` в начало PATH (через shell-конфиг)
6. Проверяет, что PATH указывает именно на установленный `qf`
7. Выполняет диагностику Chromium через реальный headless-запуск

Не запускайте installer через `sudo`: установка выполняется для текущего пользователя. Для root-окружений используйте `QWEN_FORGE_ALLOW_ROOT=1` только осознанно.

После установки откройте новый терминал:

```bash
qf
```

## Ручная установка

```bash
git clone https://github.com/alay-arch/qwen-forge.git
cd qwen-forge
bun install
```

Запуск без глобальной регистрации:

```bash
bun src/index.ts
```

Или через entry point:

```bash
./bin/qf
```

Регистрация команды через Bun:

```bash
bun link
```

## Повторная установка и обновление

Запустите install.sh повторно:

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт выполнит `git fetch` и `git reset --hard` в `~/.qwen-forge`, только если в установленной копии нет локальных изменений.
