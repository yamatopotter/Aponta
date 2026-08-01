import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calcularPeriodo, periodoReferencia, podeAssinarHoje } from '@/lib/folha';

// POST /api/folha/assinar — funcionário confirma que a apuração do período
// atual está correta. Um clique = um registro (não é assinatura criptográfica).
// Só é permitido no dia de fechamento do período (ver podeAssinarHoje em
// src/lib/folha.ts) — antes disso a apuração do mês ainda não fechou.
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const config = await prisma.folhaConfig.findUnique({ where: { id: 1 } });
  const diaFechamento = config?.diaFechamento ?? 20;
  const { ano, mes } = periodoReferencia(diaFechamento);
  const periodo = calcularPeriodo(ano, mes, diaFechamento);

  if (!podeAssinarHoje(periodo)) {
    return NextResponse.json(
      { error: `A confirmação só pode ser feita no dia de fechamento do período (${new Date(periodo.fim + 'T00:00:00').toLocaleDateString('pt-BR')}).` },
      { status: 400 }
    );
  }

  const assinatura = await prisma.assinaturaFolha.upsert({
    where: { employeeId_ano_mes: { employeeId: session.employeeId, ano, mes } },
    update: {},
    create: { employeeId: session.employeeId, ano, mes },
  });

  return NextResponse.json({ ok: true, assinadoEm: assinatura.assinadoEm });
}
