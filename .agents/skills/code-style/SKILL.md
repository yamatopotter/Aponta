---
name: code-style
description: Mostra o estilo de codigo e comentarios do projeto Aponta
allowed-tools: Read
---

# Estilo de Codigo - Aponta

## Comentarios

### Regra Principal

- **Explique o PORQUE**, nao o que
- Se o codigo e obvio, **nao comente**

### Idioma

- **Portugues** para comentarios tecnicos
- Ingles permitido em testes se necessario

### Exemplos

```typescript
// ❌ RUIM: Descreve o que (obvio pelo codigo)
// Incrementa o contador
counter++;

// ✅ BOM: Explica o porque
// Evita divisao por zero no calculo de media
if (total === 0) return 0;
```

```typescript
// ❌ RUIM: Comentarios numerados
// 1. Validar payload
// 2. Processar dados

// ✅ BOM: Nomes descritivos de funcoes
const validatedPayload = validatePayload(data);
const processedData = processData(validatedPayload);
```

## Nomenclatura de Arquivos

| Tipo             | Convencao        | Exemplo                    |
| ---------------- | ---------------- | -------------------------- |
| Componente React | kebab-case       | `admin-shell.tsx`          |
| Pagina Next.js   | kebab-case       | `page.tsx`                 |
| Utilitarios/lib  | kebab-case       | `rhid.ts`, `folha.ts`      |
| Hooks            | camelCase (`use...`) | `useTiposJustificativa.ts` (exceção observada no projeto) |
| Specs Playwright | Sufixo `.spec`   | `admin-pages.spec.ts`      |

## TypeScript

```typescript
// ❌ NUNCA use any
const data: any = fetchData();

// ✅ Use unknown + validacao
const data: unknown = fetchData();
const validated = MySchema.parse(data);
```

## Imports

```typescript
// ✅ Imports absolutos
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

// ❌ Imports relativos profundos
import { Button } from "../../../components/ui";
```

## Tailwind CSS

```typescript
// ❌ NUNCA template strings
className={`p-4 ${isActive ? 'bg-blue-500' : ''}`}

// ✅ SEMPRE cn()
import {cn} from '@/lib/utils'
className={cn('p-4', isActive && 'bg-blue-500')}
```

## Logs

Não há logger estruturado neste projeto (ver skill `observability`). Use `console.error` com contexto para erros de integração externa; nunca deixe `console.log` de debug esquecido.

```typescript
// ❌ NUNCA console.log de debug esquecido
console.log("debug:", data);

// ✅ console.error com contexto, para erros reais
console.error("Falha ao sincronizar com o RHiD", error);
```
