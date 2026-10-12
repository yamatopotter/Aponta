---
name: db-migrate
description: Ajuda a criar e executar migracoes de banco de dados (Prisma)
argument-hint: [create|up|reset]
allowed-tools: Bash, Read, Write
user-invocable: true
---

# Migracoes de Banco de Dados

O projeto usa **Prisma** com PostgreSQL.

## Comandos

**Criar migracao a partir do schema (dev, aplica na hora):**

```bash
npx prisma migrate dev --name <nome_descritivo>
```

**Aplicar migracoes pendentes sem gerar nova (ex: produção):**

```bash
npx prisma migrate deploy
```

**Resetar banco local (dev):**

```bash
npx prisma migrate reset
```

**Abrir Prisma Studio:**

```bash
npm run prisma:studio
```

## Fluxo para Nova Migracao

1. **Edite o schema** em `prisma/schema.prisma`
2. **Gere e aplique a migracao**: `npx prisma migrate dev --name <nome_descritivo>`
   - Use nomes curtos e descritivos (ex: `add_status_chamado`)
3. **Revise** o SQL gerado em `prisma/migrations/<timestamp>_<nome>/migration.sql`
4. **Teste** localmente

## Convencoes

- Schema em `prisma/schema.prisma` (Prisma)
- Acesso ao banco via `prisma` (client de `@/lib/prisma`) — não há camada de repositório separada neste projeto, rotas de API chamam o client diretamente
- Use `enum` do Prisma para campos com valores limitados (ver `NivelAdmin`, `JustificativaStatus`, `ChamadoStatus`)
- Nunca edite migrations já aplicadas em producao
- Nomes descritivos para migracoes (ex: `add_status_chamado`, nao `migration_001`)
