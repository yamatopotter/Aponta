---
name: new-page
description: Cria uma nova pagina Next.js seguindo os padroes do projeto
argument-hint: [caminho-da-pagina]
allowed-tools: Read, Write, Glob
user-invocable: true
disable-model-invocation: true
---

# Criar Nova Pagina Next.js

Cria uma pagina em `src/app/` seguindo os padroes do Aponta (App Router). Área do funcionário fica em `src/app/(employee)/`, área de RH/Admin em `src/app/admin/`.

## Pergunte ao usuario

1. **Rota**: Qual o caminho da rota? (ex: `admin/produtos`)
2. **Server ou Client**: Server Component ou Client Component?

## Templates

### Server Page (`src/app/[caminho]/page.tsx`):

```tsx
export default async function NomeDaPagina() {
  return <div>{/* conteudo */}</div>;
}
```

### Client Page (`src/app/[caminho]/page.tsx`):

```tsx
"use client";

export default function NomeDaPagina() {
  return <div>{/* conteudo */}</div>;
}
```

### Layout (se necessario) (`src/app/[caminho]/layout.tsx`):

```tsx
type Props = {
  children: React.ReactNode;
};

export default function NomeDoLayout({ children }: Props) {
  return <div>{children}</div>;
}
```

## Convencoes

- Prefira Server Components para paginas que fazem fetch de dados
- Use `'use client'` apenas para paginas interativas
- Nomes de arquivos sempre em kebab-case
- Não há Server Actions neste projeto — dados vêm de rotas em `src/app/api/**/route.ts` (ver skill `error`)
- Rotas protegidas por role são checadas em `src/middleware.ts` — se a página for nova, confira se ela cai em `/admin/*` ou `/ponto|/chamados` e se precisa entrar nas listas de rotas ali
