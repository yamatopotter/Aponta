---
name: prep
description: Prepara o ambiente de desenvolvimento do Aponta. Use ao configurar o ambiente pela primeira vez ou após um pull grande.
allowed-tools: Bash, Read
---

# Preparar Ambiente de Desenvolvimento

Execute os comandos na ordem:

```bash
npm install                # instala as dependências JavaScript
docker compose up -d       # sobe o Postgres local
npm run prisma:migrate     # aplica as migrations
npm run prisma:seed        # popula dados iniciais (admin padrão etc.)
```

Regras:

- `prisma:seed` é **idempotente**: pode ser executado quantas vezes for necessário.
- Se `prisma:migrate` falhar, verifique se o Postgres subiu (`docker compose ps`) e se `DATABASE_URL` em `.env` bate com as credenciais do `docker-compose.yml`.

Após executar, informe ao usuário:

1. Se houve erros, explique o que aconteceu e o que precisa ser corrigido
2. Se tudo funcionou, sugira executar `npm run dev` para subir o app
