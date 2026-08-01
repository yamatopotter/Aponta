import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/employee/pendencias — contadores pros badges de notificação do
// funcionário (menu inferior): chamados com resposta nova do RH e
// justificativas com decisão nova. Só conta, não marca como visto — isso
// acontece em GET /api/chamados/[id] (abrir a conversa) e GET
// /api/justificativas (abrir a lista).
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const [chamados, justificativas] = await Promise.all([
    prisma.chamado.findMany({
      // Concluído não entra — pedido explícito: o badge é só pra chamado
      // em andamento, não pra histórico já fechado.
      where: { employeeId: session.employeeId, status: 'ANDAMENTO', respondidoEm: { not: null } },
      select: { respondidoEm: true, visualizadoPeloFuncionarioEm: true },
    }),
    prisma.justificativa.findMany({
      where: { employeeId: session.employeeId, status: { in: ['APROVADO', 'REPROVADO'] } },
      select: { decididoEm: true, visualizadoPeloFuncionarioEm: true },
    }),
  ]);

  const chamadosComRespostaNova = chamados.filter(
    (c) => !c.visualizadoPeloFuncionarioEm || (c.respondidoEm && c.respondidoEm > c.visualizadoPeloFuncionarioEm)
  ).length;
  const justificativasComDecisaoNova = justificativas.filter(
    (j) => !j.visualizadoPeloFuncionarioEm || (j.decididoEm && j.decididoEm > j.visualizadoPeloFuncionarioEm)
  ).length;

  return NextResponse.json({ chamadosComRespostaNova, justificativasComDecisaoNova });
}
