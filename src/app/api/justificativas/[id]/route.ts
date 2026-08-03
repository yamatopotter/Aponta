import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const decisionSchema = z.object({
  decisao: z.enum(['APROVADO', 'REPROVADO']),
  motivoReprovacao: z.string().optional(),
});

// PATCH /api/justificativas/:id — aprovar ou reprovar (só admin).
// Isso NÃO grava no RHiD (ver README) — apenas registra a decisão aqui,
// para depois ser lançada manualmente na tela de Atribuições em massa do RHiD.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas o RH pode decidir justificativas.' }, { status: 403 });
  }

  const parsed = decisionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  if (parsed.data.decisao === 'REPROVADO' && !parsed.data.motivoReprovacao) {
    return NextResponse.json({ error: 'Informe o motivo da reprovação.' }, { status: 400 });
  }

  const justificativa = await prisma.justificativa.update({
    where: { id: params.id },
    data: {
      status: parsed.data.decisao,
      motivoReprovacao: parsed.data.motivoReprovacao,
      decididoPorId: session.adminId,
      decididoEm: new Date(),
    },
    include: { employee: true },
  });

  // TODO opcional: notificar o funcionário por e-mail (via SMTP, a definir)
  // quando a decisão for tomada.

  return NextResponse.json(justificativa);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const justificativa = await prisma.justificativa.findUnique({
    where: { id: params.id },
    include: { employee: true, anexos: true, decididoPor: { select: { id: true, name: true } } },
  });
  if (!justificativa) return NextResponse.json({ error: 'Não encontrada.' }, { status: 404 });

  if (session.role === 'EMPLOYEE' && justificativa.employeeId !== session.employeeId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  return NextResponse.json(justificativa);
}
