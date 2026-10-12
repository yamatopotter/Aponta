---
name: fix
description: Corrige automaticamente problemas de lint no codigo
allowed-tools: Bash, Read
---

# Corrigir Problemas de Codigo

Execute o lint com auto-fix:

```bash
npm run lint -- --fix
```

Este comando corrige automaticamente:

- Problemas de lint (ESLint)
- Imports nao utilizados (quando a regra suportar auto-fix)

Apos executar:

1. Informe quantos arquivos foram modificados
2. Se restarem erros que precisam de correcao manual, liste-os
3. Sugira executar `/check` para verificar se tudo esta ok
