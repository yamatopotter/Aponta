import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const updateSchema = z.object({
  status: z.enum(['ABERTO', 'ANDAMENTO', 'CONCLUIDO']),
  resposta: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas o RH pode responder chamados.' }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const chamado = await prisma.chamado.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      resposta: parsed.data.resposta,
      respondidoPorId: session.adminId,
      respondidoEm: parsed.data.status === 'CONCLUIDO' ? new Date() : undefined,
    },
    include: { employee: true, categoria: true },
  });

  return NextResponse.json(chamado);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const chamado = await prisma.chamado.findUnique({
    where: { id: params.id },
    include: { employee: true, categoria: true, anexos: true },
  });
  if (!chamado) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });

  if (session.role === 'EMPLOYEE' && chamado.employeeId !== session.employeeId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  return NextResponse.json(chamado);
}
