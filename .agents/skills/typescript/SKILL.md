---
name: typescript
description: Padroes TypeScript do projeto (tipos, Zod, imports, null handling)
allowed-tools: Read, Grep
---

# TypeScript - Aponta

## Regras de Ouro

### 1. Nunca use `any`

```typescript
// ❌ NUNCA
const data: any = fetchData();

// ✅ Use unknown + validacao
const data: unknown = fetchData();
const validated = Schema.parse(data);
```

### 2. `undefined` internamente, `null` só quando o Prisma exige

```typescript
// ✅ Use undefined em tipos/props que não vêm direto do banco
type Props = {
  onSelect?: (id: string) => void; // undefined, não null
};

// Colunas nullable do Prisma retornam `null` (não undefined) — não
// converta artificialmente: siga o tipo gerado pelo Prisma Client.
const nome: string | null = employee.nomeSocial;
```

## Zod Schemas

Usados principalmente para validar `body`/`searchParams` de Route Handlers (ver `src/app/api/justificativas/route.ts`):

```typescript
const createSchema = z.object({
  dataOcorrencia: z.string(),
  motivo: z.string().min(1),
  comentario: z.string().optional(),
});

const parsed = createSchema.safeParse(await req.json());
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
}
```

Não há barrel files neste projeto — não é necessário exportar tipo com o mesmo nome do schema; mantenha o schema local ao arquivo da rota, a menos que seja reutilizado em mais de um lugar.

## Enums

Enums de domínio (`JustificativaStatus`, `ChamadoStatus`, `NivelAdmin` etc.) são `enum` nativo do **Prisma** (`prisma/schema.prisma`), não `as const`/`z.enum` no TypeScript — o Prisma Client já gera o tipo TS correspondente:

```typescript
import { JustificativaStatus } from "@prisma/client";

if (justificativa.status === JustificativaStatus.APROVADO) {
  /* ... */
}
```

Para validar um desses campos vindo de um `searchParams`/body com Zod, use `z.nativeEnum(JustificativaStatus)` ou `z.enum([...])` com os mesmos valores.

## Imports

```typescript
// ✅ Imports absolutos com @/
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ❌ Imports relativos profundos
import { Button } from "../../../components/ui/button";

// ✅ Type imports explicitos
import type { ReactNode } from "react";
```

## interface vs type

```typescript
// interface para objetos e contratos
export interface UserData {
  id: string;
  email: string;
}

// type para props de componentes React
type Props = {
  title: string;
  onClick: () => void;
};

// type para unions e tipos derivados de Zod/Prisma
export type Status = "active" | "inactive";

// interface quando estende HTML
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
```

## Validacao na Borda

```typescript
// Valide na entrada do sistema (rota de API)
export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  // Codigo interno confia em parsed.data
}
```
