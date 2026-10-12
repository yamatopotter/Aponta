---
name: error
description: Padroes de error handling do projeto (Route Handlers, validacao Zod, logging)
allowed-tools: Read
---

# Error Handling - Aponta

## Route Handlers (`src/app/api/**/route.ts`)

Não há Server Actions neste projeto — erros são retornados como resposta HTTP direto da rota:

```typescript
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const criado = await criarRecurso(parsed.data);
    return NextResponse.json(criado, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar recurso", error);
    return NextResponse.json({ error: "Erro ao processar." }, { status: 500 });
  }
}
```

## Validação na Borda

Valide inputs com Zod logo no início da rota (ver `src/app/api/justificativas/route.ts` como referência):

```typescript
const createSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(2),
});

const parsed = createSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
}
// código interno pode confiar em parsed.data
```

## Logging

Não há logger estruturado nem captura de erros centralizada (Sentry/OpenTelemetry) neste projeto — ver skill `observability`. Use `console.error` com contexto para erros de integração externa (RHiD, Zoho); nunca deixe `console.log` de debug no código.

## Erros de negócio previsíveis

Modele com classes de erro específicas quando fizer sentido (ver `ArquivoInvalidoError` em `src/lib/storage.ts`) e trate-as explicitamente na rota, em vez de um catch genérico silencioso.
