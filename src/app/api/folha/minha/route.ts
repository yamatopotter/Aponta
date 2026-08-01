import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getApuracaoPonto } from '@/lib/rhid';
import { calcularPeriodo, periodoReferencia, podeAssinarHoje } from '@/lib/folha';

// GET /api/folha/minha?ano=&mes= — funcionário logado consulta a apuração e o
// status de assinatura do período informado (padrão: período atual).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const employee = await prisma.employee.findUnique({ where: { id: session.employeeId } });
  if (!employee) return NextResponse.json({ error: 'Funcionário não encontrado.' }, { status: 404 });

  const config = await prisma.folhaConfig.findUnique({ where: { id: 1 } });
  const diaFechamento = config?.diaFechamento ?? 20;

  const { searchParams } = new URL(req.url);
  const anoParam = searchParams.get('ano');
  const mesParam = searchParams.get('mes');
  const { ano, mes } = anoParam && mesParam ? { ano: Number(anoParam), mes: Number(mesParam) } : periodoReferencia(diaFechamento);

  const periodo = calcularPeriodo(ano, mes, diaFechamento);

  try {
    const [assinatura, apuracao] = await Promise.all([
      prisma.assinaturaFolha.findUnique({ where: { employeeId_ano_mes: { employeeId: employee.id, ano, mes } } }),
      getApuracaoPonto({ idPerson: employee.rhidPersonId, dataIni: periodo.inicio, dataFinal: periodo.fim }),
    ]);

    return NextResponse.json({
      periodo,
      apuracao,
      assinadoEm: assinatura?.assinadoEm ?? null,
      podeAssinar: podeAssinarHoje(periodo),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao consultar o RHiD.' }, { status: 502 });
  }
}
