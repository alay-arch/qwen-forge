# Разработка

## Стек

Проект использует **Bun** как единственный рантайм и пакетный менеджер.

- TypeScript 5.9
- Bun 1.1+
- cloakbrowser 0.4.5 (браузерный движок)

## Команды

```bash
bun install          # Установить зависимости
bun run typecheck    # Проверка типов TypeScript
bun run lint         # Линтинг (typecheck)
bun run dev          # Режим разработки с автоперезагрузкой
bun run src/index.ts # Запуск
./bin/qf             # Запуск через entry point
```

## Структура

```
src/
├── context.ts          # AppContext (разрыв циклической зависимости)
├── types.ts            # Все типы и интерфейсы
├── i18n.ts             # Переводы (EN/RU) в одном файле
├── theme.ts            # UI: цвета, Spinner, Screen
├── browser/manager.ts  # Единственный владелец браузера
├── cli/                # Ввод с клавиатуры, меню
├── config/manager.ts   # Загрузка/сохранение config.json
├── diagnostics/        # Диагностика системы
├── mail/               # Почта CatchMail
├── server/             # HTTP API (Bun.serve)
├── services/           # Бизнес-логика
├── storage/            # JSON-хранилище
└── utils/              # Утилиты (логгер, блокировка, проверка сети)
```

## Логирование

```typescript
// Уровни: TRACE, DEBUG, INFO, SUCCESS, WARN, ERROR, FATAL
Logger.error('Something failed', { error: err.message });
Logger.info('Account created');
Logger.debug('Navigating to registration page');
```

В режиме `--debug` логи пишутся в консоль и в файл `logs/app.log`.

## Добавление нового сервиса

1. Создать файл в `src/services/`
2. Добавить класс с методами `init()`, `shutdown()`, `isReady()`
3. Зарегистрировать в `src/index.ts` — constructor, init, shutdown

## Проверка перед коммитом

```bash
bun run typecheck
# Убедиться, что нет ошибок TypeScript
```
