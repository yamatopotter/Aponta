import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireNivelAdmin } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';

const schema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

export async function GET() {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const config = await prisma.zohoConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    clientId: config?.clientId ?? '',
    configurado: Boolean(config?.clientId && config?.clientSecretEnc),
    // client secret nunca volta para o front-end
  });
}

export async function POST(req: NextRequest) {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  await prisma.zohoConfig.upsert({
    where: { id: 1 },
    update: {
      clientId: parsed.data.clientId,
      clientSecretEnc: encryptSecret(parsed.data.clientSecret),
    },
    create: {
      id: 1,
      clientId: parsed.data.clientId,
      clientSecretEnc: encryptSecret(parsed.data.clientSecret),
    },
  });

  return NextResponse.json({ ok: true });
}
