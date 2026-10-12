---
name: shadcn
description: Padroes de uso do shadcn/ui no projeto (componentes, instalacao)
allowed-tools: Read, Grep, Bash
---

# shadcn/ui - Aponta

## Instalacao

```bash
# Componente shadcn
npx shadcn@latest add button dialog card

# Listar componentes disponiveis
npx shadcn@latest add
```

## Estrutura

```
src/components/ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
├── input.tsx
├── table.tsx
└── ...
```

## Uso

### Button

```tsx
import {Button} from '@/components/ui/button'

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
```

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
<Card>
  <CardHeader>
    <CardTitle>Titulo</CardTitle>
  </CardHeader>
  <CardContent>Conteudo</CardContent>
</Card>;
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titulo</DialogTitle>
    </DialogHeader>
    <p>Conteudo</p>
  </DialogContent>
</Dialog>;
```

## Convencoes

- Sempre verifique `@/components/ui` antes de criar novos componentes
- Use `cn()` (de `@/lib/utils`) para classes condicionais e merge de Tailwind
- CVA (`class-variance-authority`) para variantes de componentes
- Micro-interações discretas via classes Tailwind (`active:scale-95`, `hover:shadow-md`) — `framer-motion` não está instalado neste projeto

## Checklist ao adicionar componente

- [ ] Instalar via `npx shadcn@latest add`
- [ ] Ajustar estilos ao design do projeto
- [ ] Testar acessibilidade (contraste, teclado, aria-labels)
