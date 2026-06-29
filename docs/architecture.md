# Архитектура

## Принципы

### 1. Единый владелец браузера

`BrowserManager` — единственный класс, управляющий browser/context/page.

Запрещено:
- вызывать `browser.close()`, `context.close()`, `page.close()` из других модулей
- вызывать `context.newPage()`, `context.clearCookies()`, `context.cookies()`
- работать с `context.pages()` напрямую

Все операции — через методы `BrowserManager`.

### 2. Гарантированная очистка

После ЛЮБОГО завершения регистрации (успех, ошибка, отмена, таймаут) выполняется logout и очистка состояния браузера.

Следующий цикл всегда начинается с чистой страницы `/auth?mode=register`.

### 3. Graceful shutdown

При успешной регистрации или выходе из меню все ресурсы освобождаются:
- HTTP-сервер (Bun.serve)
- Браузер (launchPersistentContext → close)
- Файловое хранилище (Storage)
- Блокировка процесса (Lock)

`process.exit()` используется только в обработчиках сигналов (SIGINT/SIGTERM).

## Жизненный цикл приложения

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

## Структура модулей

```
src/
├── index.ts              # Точка входа, bootstrap, shutdown
├── context.ts            # AppContext (разрыв циклической зависимости)
├── types.ts              # Типы
├── i18n.ts               # Переводы
├── theme.ts              # UI тема
├── browser/manager.ts    # Управление браузером
├── cli/                   # Ввод/вывод
├── config/manager.ts     # Конфигурация
├── diagnostics/doctor.ts # Диагностика
├── mail/service.ts       # Почта
├── server/http.ts        # HTTP API
├── services/              # Бизнес-логика
│   ├── account.ts        # CRUD аккаунтов
│   ├── batch.ts          # Пакетное создание
│   ├── create.ts         # Создание одного аккаунта
│   ├── logout.ts         # Logout
│   ├── registration.ts   # Регистрация
│   ├── session.ts        # Сессия
│   └── stats.ts          # Статистика
├── storage/json.ts       # Хранилище
└── utils/                # Утилиты
```

## Выбор `waitUntil: 'domcontentloaded'`

Все навигации используют `domcontentloaded`, а не `networkidle`.

Причина: Qwen поддерживает WebSocket-соединение. `networkidle` никогда не наступит и вызовет таймаут.

`domcontentloaded` + `waitForSelector` — единственный надёжный паттерн.
