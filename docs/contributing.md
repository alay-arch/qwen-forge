# Участие

## Как помочь

- Сообщайте о багах через [Issues](https://github.com/alay-arch/qwen-forge/issues)
- Предлагайте улучшения через Pull Requests
- Не добавляйте новый функционал без предварительного обсуждения

## Требования к PR

1. Одна задача — один PR
2. TypeScript проверка (`bun run typecheck`) должна проходить
3. Следуйте существующему стилю кода
4. Не добавляйте новые зависимости без необходимости

## Код-стайл

- ES модули (`import`/`export`)
- `async`/`await`
- Явные типы для публичных API
- `any` — только для Page/Browser (cloakbrowser не имеет типов)
- Имена: camelCase для функций и переменных, PascalCase для классов
- Логирование через `Logger`, не `console.log`

## Локальная разработка

```bash
git clone https://github.com/alay-arch/qwen-forge.git
cd qwen-forge
bun install
bun run dev
```

## Проверка перед коммитом

```bash
bun run typecheck
bun test
```