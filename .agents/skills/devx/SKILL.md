---
name: devx
description: Mostra comandos de desenvolvimento disponiveis (docker compose + scripts npm)
allowed-tools: Bash, Read
---

# Developer Experience - Comandos Disponiveis

## Banco de dados local (Docker Compose)

`docker-compose.yml` sobe só o Postgres local (não há Tilt neste projeto).

```bash
docker compose up -d      # sobe o Postgres em background
docker compose down       # derruba
```

**Portas principais:** | Serviço | Porta | |---------|-------| | Next.js | 3000 | | PostgreSQL | 5432 |

## Scripts npm

Ver todos em `package.json` > `scripts`.

```bash
npm run dev              # next dev
npm run build             # build de producao
npm run start             # next start (produção)
npm run lint               # next lint
```

### Banco de Dados (Prisma)

```bash
npx prisma migrate dev --name <nome>   # cria e aplica migração
npm run prisma:migrate                  # atalho: prisma migrate dev
npm run prisma:seed                     # popula dados iniciais
npm run prisma:studio                   # abre o Prisma Studio
```

### Worker

```bash
npm run worker:sync   # roda a sincronização com o RHiD (fora do Next.js)
```

## Fluxo Tipico de Desenvolvimento

```bash
# 1. Setup inicial
npm install
docker compose up -d
npm run prisma:migrate
npm run prisma:seed

# 2. Subir o app
npm run dev

# 3. Desenvolver...

# 4. Antes de commit
npm run lint
```
