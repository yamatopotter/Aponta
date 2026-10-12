---
name: pre-pr
description: Checklist executável antes de abrir um PR — qualidade, testes, docs e segredos, numa passada só. Use ao preparar ou revisar um PR.
allowed-tools: Read, Bash, Grep, Glob
user-invocable: true
---

# Checklist Pré-PR

Rode antes de abrir (ou pedir para abrir) um pull request. Corrija o que falhar; repita até ficar limpo.

## 1. Gates de qualidade

```bash
npm run lint        # ESLint (next lint)
npx tsc --noEmit    # tipos
```

Sem lint silenciado com `any`/`@ts-ignore`/equivalente sem justificativa.

## 2. Revisão do diff

```bash
git diff origin/main...HEAD
```

- **Sem segredos** no diff (`.env` nunca é commitado; cuidado com chaves/tokens hardcoded, inclusive em `.agents/mcp_config.json`).
- Sem código de debug esquecido, `console.log` solto, blocos comentados ou `.only` perdido em specs Playwright.
- Mudanças de banco: migração Prisma (`prisma/migrations/`) presente e revisada no mesmo PR.

## 3. Docs e organização

- README/`docs/ARQUITETURA.md` atualizados **neste PR** se uso, comandos ou estrutura mudaram.
- Commits em português, foco no porquê, sem gitmoji — siga o padrão observado no `git log` (frases diretas, sem prefixo tipo `feat:`/`fix:`).

## 4. Abrir o PR

Só quando o usuário pedir. Descreva o **porquê** acima do **o quê**, linke a issue/contexto e destaque o que os revisores precisam decidir (divergências, follow-ups). Nunca faça push nem abra o PR por iniciativa própria.
