# Разработка

## Стек

- **Runtime**: Bun ≥ 1.3
- **Язык**: TypeScript 5.9
- **Браузер**: cloakbrowser ^0.4.5 (Chromium с антидетект-настройками)
- **Браузерный движок**: playwright-core ^1.61.1

## Команды

| Команда | Описание |
|---------|----------|
| `bun install` | Установить зависимости |
| `bun run typecheck` | Проверка типов TypeScript |
| `bun run lint` | Линтинг (typecheck) |
| `bun run dev` | Режим разработки с автоперезагрузкой |
| `bun run src/index.ts` | Запуск напрямую |
| `./bin/qf` | Запуск через entry point |
| `bun test` | Запуск тестов |

## Структура репозитория

```
qwen-forge/
├── bin/qf                      # Bash-обёртка, entry point
├── install.sh                  # Установщик
├── config.json                 # Конфигурация (auto-generated)
├── package.json                # Зависимости, скрипты
├── tsconfig.json               # TypeScript конфигурация
├── src/
│   ├── index.ts                # Точка входа, bootstrap, signal handlers
│   ├── context.ts              # AppContext (разрыв циклической зависимости)
│   ├── types.ts                # Все типы и интерфейсы
│   ├── i18n.ts                 # Переводы EN/RU в одном файле
│   ├── theme.ts                # UI: цвета, Spinner, Screen, layout
│   ├── version.ts              # Константа версии (единственный источник)
│   ├── browser/
│   │   └── manager.ts          # Единственный владелец браузера
│   ├── cli/
│   │   ├── input.ts            # Readline, меню, pipe-поддержка
│   │   └── helpers.ts          # sleep, ESC-детект, форматирование
│   ├── config/
│   │   └── manager.ts          # Загрузка/сохранение/миграция config.json
│   ├── diagnostics/
│   │   ├── chromium.ts         # Chromium: бинарник, .so, дистрибутив
│   │   ├── chromium.test.ts    # Тесты для Chromium-диагностики
│   │   └── doctor.ts           # Полная системная диагностика
│   ├── mail/
│   │   └── service.ts          # CatchMail: email, пароль, polling, активация
│   ├── server/
│   │   └── http.ts             # HTTP API (Bun.serve)
│   ├── services/
│   │   ├── account.ts          # CRUD аккаунтов
│   │   ├── batch.ts            # Пакетное создание
│   │   ├── create.ts           # Оркестрация одиночной регистрации
│   │   ├── logout.ts           # Logout + очистка сессии
│   │   ├── registration.ts     # Заполнение формы регистрации
│   │   ├── session.ts          # Трекинг аккаунтов сессии
│   │   └── stats.ts            # Экран статистики
│   ├── storage/
│   │   └── json.ts             # JSON-хранилище с атомарной записью
│   └── utils/
│       ├── crash.ts            # Crash-репортёр
│       ├── eventbus.ts         # Шина событий
│       ├── lock.ts             # Lock-файл (singleton)
│       ├── logger.ts           # Логгер с ротацией
│       ├── network.ts          # Проверка connectivity
│       ├── runtime.ts          # CLI-флаги, debug, timer
│       └── sanitizer.ts        # Очистка логов от secrets
├── data/                       # accounts.json (runtime)
├── logs/                       # app.log, crash-*.log (runtime)
└── docs/                       # Документация
```

## Архитектура

### Принципы

1. **Единый владелец браузера** — `BrowserManager` — единственный модуль, управляющий browser/context/page. Никакой другой модуль не вызывает `close()`, `newPage()`, `clearCookies()`.

2. **Гарантированная очистка** — после любого завершения (успех, ошибка, отмена, таймаут) выполняется logout и очистка состояния. Следующий цикл начинается с чистой страницы `/auth?mode=register`.

3. **Graceful shutdown** — при выходе освобождаются: HTTP-сервер, браузер, хранилище, блокировка. `process.exit()` используется только в signal handlers.

### Жизненный цикл

```
bootstrap → cliLoop → createAccount
├── ensureCleanState
├── register
├── confirm
├── waitForMail
├── activate
└── [finally] cleanup logout
→ shutdown (если успешно)
```

### AppContext

`context.ts` определяет интерфейс `AppContext`, который импортируется всеми сервисами. Это разрывает циклическую зависимость: `index.ts` создаёт все сервисы и передаёт контекст, сервисы импортируют только тип.

### Навигация

Используется `waitUntil: 'domcontentloaded'`, а не `networkidle`. Qwen поддерживает постоянное WebSocket-соединение — `networkidle` никогда не наступит.

## Тестирование

```bash
bun test
```

Тесты используют `bun:test`. Текущие тесты покрывают Chromium-диагностику (`src/diagnostics/chromium.test.ts`).

## Логирование

Уровни: `TRACE`, `DEBUG`, `INFO`, `SUCCESS`, `WARN`, `ERROR`, `FATAL`

```typescript
const logger = new Logger({ file: 'logs/app.log', name: 'App' });
logger.info('Server started');
logger.debug('Request details', { url, status });
const child = logger.child('Module');
```

В режиме `--debug` логи выводятся в консоль (TRACE уровень). Sanitizer автоматически удаляет пароли, токены, cookies из вывода.

## Release-процесс

См. `docs/release-checklist.md`.

Версия обновляется в:
- `package.json`
- `src/version.ts` (единственный runtime-источник)
- `README.md` / `README.en.md`

## Внутренние файлы

| Файл | Назначение |
|------|-----------|
| `docs/release-checklist.md` | Чеклист релиза |
| `docs/github-labels.md` | Схема лейблов GitHub |
| `.github/SECURITY.md` | Политика безопасности |
| `.github/CODEOWNERS` | Владельцы кода |
| `.github/pull_request_template.md` | Шаблон PR |
| `.github/ISSUE_TEMPLATE/` | Шаблоны Issues |