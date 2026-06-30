# Contributing

## How to Help

- Report bugs via [Issues](https://github.com/alay-arch/qwen-forge/issues)
- Submit improvements via Pull Requests
- Do not add new features without prior discussion

## PR Requirements

1. One task — one PR
2. TypeScript check (`bun run typecheck`) must pass
3. Follow existing code style
4. Do not add new dependencies unnecessarily

## Code Style

- ES modules (`import`/`export`)
- `async`/`await`
- Explicit types for public APIs
- `any` — only for Page/Browser (cloakbrowser has no types)
- Naming: camelCase for functions and variables, PascalCase for classes
- Logging via `Logger`, not `console.log`

## Local Development

```bash
git clone https://github.com/alay-arch/qwen-forge.git
cd qwen-forge
bun install
bun run dev
```

## Pre-commit Checks

```bash
bun run typecheck
bun test
```