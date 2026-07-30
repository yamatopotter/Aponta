import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getApuracaoPonto } from '@/lib/rhid';

// GET /api/rhid/apuracao?competencia=2026-07
// Funcionário: consulta a própria apuração.
// Admin: pode passar ?employeeId= para consultar de qualquer funcionário.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const competencia = searchParams.get('competencia'); // yyyy-MM
  if (!competencia || !/^\d{4}-\d{2}$/.test(competencia)) {
    return NextResponse.json({ error: 'Parâmetro competencia (yyyy-MM) é obrigatório.' }, { status: 400 });
  }

  let employeeId = session.role === 'EMPLOYEE' ? session.employeeId : searchParams.get('employeeId');
  if (!employeeId) return NextResponse.json({ error: 'employeeId é obrigatório para admin.' }, { status: 400 });

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return NextResponse.json({ error: 'Funcionário não encontrado.' }, { status: 404 });

  if (session.role === 'EMPLOYEE' && employee.id !== session.employeeId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  const [ano, mes] = competencia.split('-').map(Number);
  const dataIni = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFinal = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

  try {
    const apuracao = await getApuracaoPonto({ idPerson: employee.rhidPersonId, dataIni, dataFinal });
    return NextResponse.json(apuracao);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao consultar o RHiD.' },
      { status: 502 }
    );
  }
}
