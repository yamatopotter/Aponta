---
trigger: always_on
---

# Task Runner: scripts do npm

## Regra

Use os scripts definidos em `package.json`, via `npm run`. Não há `mise` nem outro task runner neste projeto.

## Correto

```bash
npm run lint
npm run build
npm run dev
npm run prisma:migrate
```

## Errado

```bash
mise run lint     # ❌ não existe neste projeto
pnpm run test     # ❌ este projeto usa npm
yarn build        # ❌ este projeto usa npm
```

## Package Manager

- Use `npm` para instalar dependencias (há `package-lock.json`)
- Use `npx` para executar binários não instalados globalmente (ex: `npx prisma migrate dev`)
- NUNCA especifique versoes ao instalar dependencias

## Scripts ficam no `package.json`

- Scripts são definidos em `package.json` > `scripts`
- Não crie um task runner file-based (`.config/mise/tasks/` ou similar) para este projeto
