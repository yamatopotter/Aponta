import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const updateSchema = z.object({
  status: z.enum(['ABERTO', 'ANDAMENTO', 'CONCLUIDO']),
});

// PATCH /api/chamados/:id — só muda o status. Independente de enviar
// mensagem (ver POST /api/chamados/:id/mensagens): o RH pode marcar como
// Concluído sem escrever nada novo, se já respondeu antes na conversa.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas o RH pode alterar chamados.' }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // Cada troca de status vira um registro no histórico (ChamadoInteracao) —
  // é como sabemos quem atendeu (marcou em andamento) e quem resolveu.
  const [chamado] = await prisma.$transaction([
    prisma.chamado.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      include: { employee: true, categoria: true },
    }),
    prisma.chamadoInteracao.create({
      data: {
        chamadoId: params.id,
        autorTipo: 'ADMIN',
        autorAdminId: session.adminId,
        tipo: 'STATUS_ALTERADO',
        statusNovo: parsed.data.status,
      },
    }),
  ]);

  return NextResponse.json(chamado);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const chamado = await prisma.chamado.findUnique({
    where: { id: params.id },
    include: {
      employee: true,
      categoria: true,
      anexos: true,
      respondidoPor: { select: { id: true, name: true } },
      interacoes: {
        include: {
          autorAdmin: { select: { id: true, name: true } },
          autorEmployee: { select: { id: true, nome: true } },
          anexos: { select: { id: true, nomeArquivo: true, mimeType: true, tamanhoBytes: true } },
        },
        orderBy: { criadoEm: 'asc' },
      },
    },
  });
  if (!chamado) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });

  if (session.role === 'EMPLOYEE' && chamado.employeeId !== session.employeeId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  // Abrir a conversa marca como "visto" — some com o badge de resposta
  // nova (ver GET /api/employee/pendencias).
  if (session.role === 'EMPLOYEE') {
    await prisma.chamado.update({ where: { id: chamado.id }, data: { visualizadoPeloFuncionarioEm: new Date() } });
  }

  return NextResponse.json(chamado);
}
