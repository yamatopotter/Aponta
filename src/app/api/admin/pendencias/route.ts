import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/pendencias — contadores pro badge de pendências no menu
// lateral (Justificativas aguardando decisão + Chamados em aberto).
// Acessível a qualquer ADMIN (RH ou nível ADMIN), já que ambos veem essas
// duas telas.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const [justificativasPendentes, chamadosAbertos] = await Promise.all([
    prisma.justificativa.count({ where: { status: { in: ['PENDENTE', 'EM_ANALISE'] } } }),
    prisma.chamado.count({ where: { status: { not: 'CONCLUIDO' } } }),
  ]);

  return NextResponse.json({ justificativasPendentes, chamadosAbertos });
}
