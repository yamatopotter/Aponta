---
name: tailwind
description: Padroes de Tailwind CSS, CVA, cn() do projeto
allowed-tools: Read, Grep
---

# Tailwind CSS - Aponta

## Regra de Ouro

```typescript
// ❌ NUNCA template strings
className={`p-4 ${isActive ? 'bg-blue-500' : ''}`}

// ✅ SEMPRE cn()
import {cn} from '@/lib/utils'
className={cn('p-4', isActive && 'bg-blue-500')}
```

## CVA (Class Variance Authority)

Use CVA para componentes com variantes:

```typescript
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
```

## Cores

Cores vêm de tokens CSS (`hsl(var(--primary))` etc.), definidos em `tailwind.config.ts` e nas variáveis CSS do tema — use as classes semânticas do shadcn (`bg-primary`, `text-foreground`, `border-border`...) em vez de hex hardcoded, para dark mode e consistência funcionarem automaticamente.

## Micro-interações

```tsx
className = "active:scale-95 transition-all hover:opacity-90"; // Botoes
className = "hover:shadow-md transition-all"; // Cards
```

Discretas — prioridade é clareza e feedback visual, não "flashiness".

## Responsive

```typescript
// Mobile first
className = "p-4 md:p-6 lg:p-8";

// Breakpoints
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px
```

## Padroes Comuns

```typescript
// Card
cn("rounded-xl border bg-white p-5 shadow-sm");

// Input
cn(
  "h-10 w-full rounded-lg border px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
);

// Link hover
cn("transition-colors hover:text-primary");
```
