import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/tipos-justificativa — por padrão só os ativos (formulário de
// justificativa do funcionário). ?todos=true traz tudo, inclusive
// desativados (tela de administração em /admin/configuracoes, aba Tipos).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const todos = new URL(req.url).searchParams.get('todos') === 'true';

  const tipos = await prisma.tipoJustificativa.findMany({
    where: todos ? undefined : { ativo: true },
    orderBy: { ordem: 'asc' },
  });
  return NextResponse.json(tipos);
}

// Admin cadastra/edita os tipos que o funcionário vê no formulário de justificativa.
const createSchema = z.object({
  label: z.string().min(1),
  contaTopDepartamentos: z.boolean().default(true),
  contaPendenciaRecorrente: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const count = await prisma.tipoJustificativa.count();
  try {
    const tipo = await prisma.tipoJustificativa.create({ data: { ...parsed.data, ordem: count } });
    return NextResponse.json(tipo, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um tipo com esse nome.' }, { status: 400 });
    }
    throw e;
  }
}
