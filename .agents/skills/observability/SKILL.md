---
name: observability
description: Padroes de logging/observabilidade do projeto (o que existe hoje, sem inventar camadas)
allowed-tools: Read, Grep
---

# Observabilidade - Aponta

Este projeto **não tem** camada de observabilidade estruturada (`traced()`, tracing/metrics, Sentry/OpenTelemetry) nem logger estruturado (`pino` ou similar). Não invente essas dependências ou padrões — se uma tarefa realmente precisar disso, alinhe com o usuário antes de introduzir a lib.

## O que existe hoje

- `console.error`/`console.warn` com contexto (mensagem + dados relevantes), usados principalmente em erros de integração externa (RHiD, Zoho) — ver `src/lib/rhid.ts`, `src/lib/zoho.ts`.
- Erros de validação/negócio nas rotas de API retornam direto como resposta HTTP (`NextResponse.json({ error: '...' }, { status })`), sem passar por um capturador central.

## Convenção ao logar um erro

```typescript
try {
  await sincronizarComRhid();
} catch (error) {
  console.error("Falha ao sincronizar com o RHiD", error);
  throw error;
}
```

- Contexto relevante sempre incluído na mensagem (o quê estava acontecendo), não só o objeto de erro cru.
- Não use `console.log` para debug esquecido — remova antes de commitar.

## Checklist

- [ ] Erros de integração externa (RHiD, Zoho) logados com `console.error` e contexto
- [ ] Nenhum `console.log` de debug esquecido no diff
- [ ] Se a tarefa parecer exigir logger estruturado/tracing, perguntar ao usuário antes de introduzir a dependência
