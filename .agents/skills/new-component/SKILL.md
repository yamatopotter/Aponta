---
name: new-component
description: Cria um novo componente React seguindo os padroes do projeto
argument-hint: [nome-do-componente]
allowed-tools: Read, Write, Glob
user-invocable: true
disable-model-invocation: true
---

# Criar Novo Componente

Cria um componente em `src/components/` seguindo os padroes do Aponta.

## Pergunte ao usuario

1. **Pasta**: Qual pasta? (`ui` para componentes shadcn, `admin` para específicos da área de RH/Admin, ou nova pasta)
2. **Server ou Client**: Server Component ou Client Component (`'use client'`)?

## Templates

### Server Component (`component-name.tsx`):

```tsx
type Props = {
  // props aqui
};

export function ComponentName({}: Props) {
  return <div>{/* conteudo */}</div>;
}
```

### Client Component (`component-name.tsx`):

```tsx
"use client";

type Props = {
  // props aqui
};

export function ComponentName({}: Props) {
  return <div>{/* conteudo */}</div>;
}
```

## Convencoes

- **kebab-case** para nome do arquivo (ex: `admin-shell.tsx`)
- Props como `type Props = {...}` (nao interface para props simples)
- Use `cn()` (de `@/lib/utils`) para merge de classes Tailwind
- Verifique `@/components/ui` antes de criar componentes base
- Micro-interações via classes Tailwind (`active:scale-95`, `hover:shadow-md`) — `framer-motion` não está instalado neste projeto
