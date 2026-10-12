---
name: env
description: Como usar variaveis de ambiente no projeto (.env, sem validacao Zod)
allowed-tools: Read, Grep
---

# Variaveis de Ambiente - Aponta

## Regra de Ouro

**Secrets NUNCA no codigo. Sempre via variaveis de ambiente ou config no banco (ver abaixo).**

## Estrutura

Este projeto **usa `.env`** (não versionado) — não há `src/env.ts` nem validação centralizada com Zod. Acesse `process.env.<VAR>` diretamente onde necessário, seguindo o padrão já usado em `src/lib` (ex: `process.env.AUTH_SECRET` em `src/lib/auth.ts`).

`.env.example` e `.env.production.example` documentam quais chaves existem e para que servem — mantenha-os atualizados ao adicionar uma variável nova.

## O que fica em variável de ambiente vs. no banco

- **Infra pura** (`DATABASE_URL`, `AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `RHID_INTEGRATION_PASSWORD`, `SYNC_INTERVAL_MINUTES`): variável de ambiente.
- **Configuração de integração** (credenciais Zoho, base URL/usuário do RHiD, regras de folha): vive nas tabelas `ZohoConfig`/`RhidConfig`/`FolhaConfig` (Prisma) e é editada pela tela `/admin/configuracoes` — segredos aí ficam criptografados em repouso com `APP_ENCRYPTION_KEY` (ver `src/lib/crypto.ts`). Ao adicionar uma nova config de integração, prefira esse padrão a criar uma env var nova.

## Uso

```typescript
// Padrão deste projeto: acesso direto
const secret = process.env.AUTH_SECRET;
```

## Configuração local

- Copie `.env.example` para `.env` e preencha os valores.
- `docker-compose.yml` sobe o Postgres local com credenciais que já batem com o `DATABASE_URL` padrão do `.env.example`.

## Checklist

- [ ] Nunca hardcode valores sensíveis no código
- [ ] Segredo de infraestrutura → `.env` / `.env.example` documentado
- [ ] Configuração de integração → tabela `system`-like (`ZohoConfig`/`RhidConfig`/`FolhaConfig`) + tela `/admin/configuracoes`, não env var nova
- [ ] `.env` nunca é commitado
