# Contributing

## How to help

- Report bugs via Issues
- Suggest improvements via Pull Requests
- Do not add new features without prior discussion

## PR requirements

1. One task — one PR
2. TypeScript check (`bun run typecheck`) must pass
3. Follow existing code style
4. Add comments for complex code sections (Russian or English)
5. Do not add new dependencies unnecessarily

## Code style

- ES modules (`import`/`export`)
- `async`/`await`, no callback hell
- Explicit types for public APIs
- `any` only for Page/Browser (cloakbrowser has no types)
- Naming: camelCase for functions and variables, PascalCase for classes
- Logging via `Logger`, not `console.log`
