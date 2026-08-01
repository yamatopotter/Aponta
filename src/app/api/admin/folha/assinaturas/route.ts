import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calcularPeriodo, periodoReferencia } from '@/lib/folha';

// GET /api/admin/folha/assinaturas?ano=&mes= — lista todo funcionário ativo
// com o status de assinatura da folha do período (padrão: período atual).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const config = await prisma.folhaConfig.findUnique({ where: { id: 1 } });
  const diaFechamento = config?.diaFechamento ?? 20;

  const { searchParams } = new URL(req.url);
  const anoParam = searchParams.get('ano');
  const mesParam = searchParams.get('mes');
  const { ano, mes } = anoParam && mesParam ? { ano: Number(anoParam), mes: Number(mesParam) } : periodoReferencia(diaFechamento);
  const periodo = calcularPeriodo(ano, mes, diaFechamento);

  const [funcionarios, assinaturas] = await Promise.all([
    prisma.employee.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, cargo: true, unidade: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.assinaturaFolha.findMany({ where: { ano, mes } }),
  ]);

  const assinadoPorEmployeeId = new Map(assinaturas.map((a) => [a.employeeId, a.assinadoEm]));

  const items = funcionarios.map((f) => ({
    ...f,
    assinadoEm: assinadoPorEmployeeId.get(f.id) ?? null,
  }));

  return NextResponse.json({
    periodo,
    total: items.length,
    assinados: assinaturas.length,
    items,
  });
}
