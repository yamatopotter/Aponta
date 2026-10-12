---
name: check
description: Executa verificacoes de qualidade do codigo (lint, types) sem fazer alteracoes
allowed-tools: Bash, Read
---

# Verificar Qualidade do Codigo

Execute a verificacao completa sem fazer alteracoes:

```bash
npm run lint
```

Este comando executa o ESLint (config padrão do Next.js, via `next lint`).

Para verificar tipos TypeScript:

```bash
npx tsc --noEmit
```

Apos executar:

1. Se houver erros, liste-os organizados por tipo
2. Sugira usar `/fix` para corrigir automaticamente o que for possivel
3. Para erros que precisam de correcao manual, explique como resolver
