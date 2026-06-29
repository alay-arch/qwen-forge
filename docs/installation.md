# Установка

## Требования

- **Bun** ≥ 1.1 (https://bun.sh)
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
1. Проверяет наличие Bun, Git, curl
2. Клонирует репозиторий в `~/.qwen-forge`
3. Устанавливает зависимости (`bun install`)
4. Регистрирует глобальную команду `qf` в `~/.local/bin/qf`
5. Добавляет `~/.local/bin` в PATH (через `.bashrc`/`.zshrc`)

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
bun run src/index.ts
```

Или через entry point:

```bash
./bin/qf
```

Глобальная регистрация:

```bash
bun link
```

## Повторная установка и обновление

Запустите install.sh повторно:

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Скрипт выполнит `git fetch` и `git reset --hard` в `~/.qwen-forge`.
