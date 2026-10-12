---
name: new-task
description: Cria um novo script npm em package.json. Use ao criar ou padronizar scripts do projeto.
argument-hint: [nome-do-script]
allowed-tools: Read, Write, Edit, Bash
user-invocable: true
disable-model-invocation: true
---

# Criar Novo Script npm

Este projeto não usa um task runner file-based (`mise`/similar) — scripts vivem em `package.json` > `scripts`.

## Convenções

1. Adicione a entrada em `package.json` > `scripts`, nome curto e em kebab-case ou com `:` para agrupar (ex: `prisma:seed`, `worker:sync`).
2. Se o script chamar um binário não instalado globalmente, use `npx <binário>` dentro do valor do script.
3. Scripts longos ou com lógica não trivial: prefira um arquivo em `worker/` ou `prisma/` (como `prisma/seed.ts`, `worker/sync-worker.ts`) chamado via `tsx`, em vez de uma linha só de shell.
4. Scripts que rodam em produção (ex: `docker-entrypoint.sh`) devem ser idempotentes.

## Verificar

```bash
npm run <nome>       # funciona
```
