import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireNivelAdmin } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';

const schema = z.object({
  apiBaseUrl: z.string().url(),
  integrationEmail: z.string().email(),
  // Opcional: em branco mantém a senha já salva (mesmo padrão do Client Secret do Zoho).
  integrationPassword: z.string().optional(),
});

export async function GET() {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const config = await prisma.rhidConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    apiBaseUrl: config?.apiBaseUrl ?? 'https://www.rhid.com.br/v2/api.svc',
    integrationEmail: config?.integrationEmail ?? '',
    conectado: Boolean(config?.integrationEmail && config?.integrationPasswordEnc),
    // senha nunca volta para o front-end
  });
}

export async function POST(req: NextRequest) {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const existing = await prisma.rhidConfig.findUnique({ where: { id: 1 } });
  if (!existing && !parsed.data.integrationPassword) {
    return NextResponse.json({ error: 'Senha de integração é obrigatória na primeira configuração.' }, { status: 400 });
  }

  await prisma.rhidConfig.upsert({
    where: { id: 1 },
    update: {
      apiBaseUrl: parsed.data.apiBaseUrl,
      integrationEmail: parsed.data.integrationEmail,
      ...(parsed.data.integrationPassword ? { integrationPasswordEnc: encryptSecret(parsed.data.integrationPassword) } : {}),
    },
    create: {
      id: 1,
      apiBaseUrl: parsed.data.apiBaseUrl,
      integrationEmail: parsed.data.integrationEmail,
      integrationPasswordEnc: encryptSecret(parsed.data.integrationPassword!),
    },
  });

  // Credencial mudou — descarta o token em cache pra forçar login com a nova credencial.
  await prisma.rhidIntegrationToken.deleteMany({ where: { id: 1 } });

  return NextResponse.json({ ok: true });
}
