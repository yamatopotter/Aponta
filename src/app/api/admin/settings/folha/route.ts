import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireNivelAdmin } from '@/lib/auth';

const schema = z.object({
  diaFechamento: z.number().int().min(1).max(28),
});

export async function GET() {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const config = await prisma.folhaConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({ diaFechamento: config?.diaFechamento ?? 20 });
}

export async function POST(req: NextRequest) {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  await prisma.folhaConfig.upsert({
    where: { id: 1 },
    update: { diaFechamento: parsed.data.diaFechamento },
    create: { id: 1, diaFechamento: parsed.data.diaFechamento },
  });

  return NextResponse.json({ ok: true });
}
