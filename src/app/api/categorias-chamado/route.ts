import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const categorias = await prisma.categoriaChamado.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  });
  return NextResponse.json(categorias);
}

// Admin cadastra/edita as categorias que o funcionário vê no formulário de chamado.
const createSchema = z.object({ label: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const count = await prisma.categoriaChamado.count();
  const categoria = await prisma.categoriaChamado.create({ data: { label: parsed.data.label, ordem: count } });
  return NextResponse.json(categoria, { status: 201 });
}
