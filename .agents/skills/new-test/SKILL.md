---
name: new-test
description: Cria um novo teste Playwright (fluxo de UI/acessibilidade)
argument-hint: [fluxo-a-testar]
allowed-tools: Read, Write, Glob, Grep
user-invocable: true
disable-model-invocation: true
---

# Criar Teste (Playwright)

Este projeto **não tem testes unitários** (sem Vitest/Jest configurado) — a suíte existente em `tests/ux-audit/` cobre fluxos de UI e acessibilidade com Playwright. Se a tarefa exigir teste unitário de lógica pura em `src/lib`, pergunte ao usuário antes de introduzir um framework novo no projeto.

## Nomenclatura

- Specs em `tests/ux-audit/<fluxo>.spec.ts` (kebab-case)
- Setup de sessão de admin já existe em `tests/ux-audit/auth.setup.ts` — specs que dependem dele declaram `dependencies: ['setup']` no `playwright.config.ts`

## Template de Teste (fluxo de admin, com sessão)

```typescript
import { test, expect } from '@playwright/test';

test('descrição do fluxo', async ({ page }) => {
  await page.goto('/admin/justificativas');

  // Arrange/Act: navegue e interaja como o usuário faria

  // Assert
  await expect(page.getByRole('heading', { name: 'Justificativas' })).toBeVisible();
});
```

## Template de Teste (fluxo de colaborador, login por CPF)

Ver `tests/ux-audit/colaborador-demo.spec.ts` como referência — login só com CPF (sem senha), sem depender do projeto `setup` de admin.

## Fluxo

1. **Identifique** o fluxo de UI a testar (ou o bug a reproduzir)
2. **Crie** o spec em `tests/ux-audit/<nome>.spec.ts`
3. **Escreva** o teste que reproduz o problema (deve falhar antes da correção)
4. **Execute** `npx playwright test tests/ux-audit/<nome>.spec.ts` para confirmar que falha
5. **Corrija** o código
6. **Execute** novamente para validar

## Convenções

- Specs ao lado uns dos outros em `tests/ux-audit/` (não há pasta `__tests__/`)
- Rodam contra app e Postgres reais do ambiente de dev/teste — sem mocks
- Acessibilidade verificada com `@axe-core/playwright` onde aplicável
