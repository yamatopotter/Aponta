import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  categoriaId: z.string().min(1),
  descricao: z.string().min(1, 'Descreva o que você precisa.'),
  anexos: z.array(z.object({ nomeArquivo: z.string(), url: z.string() })).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (session.role === 'EMPLOYEE') {
    const chamados = await prisma.chamado.findMany({
      where: { employeeId: session.employeeId },
      include: { categoria: true, anexos: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(chamados);
  }

  const status = searchParams.get('status');
  const unidade = searchParams.get('unidade');

  const chamados = await prisma.chamado.findMany({
    where: {
      status: status && status !== 'Todos' ? (status as any) : undefined,
      employee: { unidade: unidade && unidade !== 'Todas' ? unidade : undefined },
    },
    include: { employee: true, categoria: true, anexos: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(chamados);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Apenas funcionários podem abrir chamados.' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const chamado = await prisma.chamado.create({
    data: {
      employeeId: session.employeeId,
      categoriaId: parsed.data.categoriaId,
      descricao: parsed.data.descricao,
      anexos: parsed.data.anexos?.length ? { create: parsed.data.anexos } : undefined,
    },
    include: { categoria: true, anexos: true },
  });

  return NextResponse.json(chamado, { status: 201 });
}
