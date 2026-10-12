---
name: perf
description: Dicas de performance (Server Components, memoizacao, bundle, queries)
allowed-tools: Read
---

# Performance - Aponta

## Server Components (Padrao)

```tsx
// ✅ Prefira Server Components para dados e logica server-side
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ✅ 'use client' apenas para componentes interativos
'use client'
export function InteractiveForm() { ... }
```

## Memoizacao

```tsx
// ✅ React.memo para componentes em listas grandes
export const ProdutoCard = React.memo(({ produto }: { produto: Produto }) => (
  <div>{produto.nome}</div>
));

// ✅ useMemo para calculos pesados
const filtered = useMemo(() => items.filter(expensive), [items]);

// ❌ Desnecessario para valores primitivos
const total = useMemo(() => a + b, [a, b]);
```

## Debounce em Buscas

`es-toolkit` não está instalado neste projeto ainda — se for adicionar debounce, prefira instalar `es-toolkit` a reimplementar na mão (ver AGENTS.md, seção Filosofia).

```typescript
import { debounce } from "es-toolkit";

const debouncedSearch = useMemo(
  () =>
    debounce((term: string) => {
      // logica de busca
    }, 300),
  [dependencies],
);
```

## Queries Otimizadas

```typescript
// ✅ Joins e GROUP BY para deduplicacao
// ✅ Busca em batch quando possivel
// ❌ Loops com queries individuais (N+1)
```

## Async/Promises

```typescript
// ✅ Paralelo para operacoes independentes
const [clientes, produtos] = await Promise.all([findClientes(), findProdutos()]);

// ❌ Sequencial desnecessario
const clientes = await findClientes();
const produtos = await findProdutos(); // Podia ser paralelo
```

## Bundle

```typescript
// ✅ Import especifico (tree-shakeable)
import { isEmpty } from "es-toolkit/compat";
// ❌ Import completo
import _ from "lodash";

// NUNCA use Lodash
```

## Code Splitting

```tsx
// ✅ next/dynamic para modais e componentes grandes
import dynamic from "next/dynamic";

const HeavyModal = dynamic(() => import("./heavy-modal"));
```
