---
name: react
description: Padroes React do projeto (componentes, hooks, props, estado, Server Components)
allowed-tools: Read, Grep
---

# React - Aponta

## Componentes

### Estrutura Basica

```tsx
type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, children, className }: Props) {
  return (
    <div className={cn("rounded-lg bg-white p-4", className)}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Props

```tsx
// Props como type (nao interface para props simples)
type Props = {
  className?: string;
};

// Sempre merge com cn()
<div className={cn("base-classes", className)} />;

// Props que estendem HTML podem usar interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}
```

## Server Components vs Client Components

```tsx
// ✅ Server Component (padrao no Next.js App Router)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Client Component (quando necessario)
("use client");
export function InteractiveForm() {
  const [value, setValue] = useState("");
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

## Hooks

### useState

```tsx
// Tipo inferido quando possivel
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | undefined>();

// Funcao para estado inicial pesado
const [data, setData] = useState(() => expensiveComputation());
```

### useEffect

```tsx
// Cleanup quando necessario
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal }).then(setData);
  return () => controller.abort();
}, [dependency]);
```

## Event Handlers

```tsx
// Nomeie handlers com handle*
function handleClick(e: MouseEvent) {}
function handleSubmit(e: FormEvent) {}

// Inline para handlers simples
<button onClick={() => setOpen(true)}>

// Extraido para handlers complexos
<button onClick={handleSubmit}>
```

## Chamadas ao backend

Não há Server Actions neste projeto — Client Components chamam as rotas de API (`src/app/api/**/route.ts`) via `fetch`, tratando o formato `{ error: string }` de resposta de erro (ver skill `error`).

## Memoizacao

```tsx
// useMemo para calculos pesados
const filtered = useMemo(() => items.filter(expensive), [items]);

// useCallback para callbacks passados como props a componentes memoizados
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// React.memo para componentes em listas grandes
export const ProdutoCard = React.memo(({ produto }: { produto: Produto }) => (
  <div>{produto.nome}</div>
));
```
