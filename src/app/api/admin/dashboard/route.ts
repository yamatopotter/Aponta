import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calcularPeriodo, periodoReferencia } from '@/lib/folha';

type Periodo = '30d' | '90d' | 'mes_atual';

// Resolve o intervalo de datas do filtro do dashboard. 'mes_atual' usa o
// primeiro dia do mês corrente até hoje (não o período de folha — esse é um
// filtro solto, diferente do período de fechamento configurado em FolhaConfig).
function resolveIntervalo(periodo: Periodo): { inicio: Date; fim: Date } {
  const fim = new Date();
  const inicio = new Date();
  if (periodo === '30d') inicio.setDate(inicio.getDate() - 30);
  else if (periodo === '90d') inicio.setDate(inicio.getDate() - 90);
  else inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  return { inicio, fim };
}

// GET /api/admin/dashboard?periodo=30d|90d|mes_atual — indicadores agregados
// pro painel inicial do RH. Acessível a qualquer ADMIN (RH ou nível ADMIN),
// mesmo nível de acesso de Justificativas/Chamados/Folha/Funcionários.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const periodoParam = (searchParams.get('periodo') as Periodo) || '30d';
  const periodo: Periodo = ['30d', '90d', 'mes_atual'].includes(periodoParam) ? periodoParam : '30d';
  const { inicio, fim } = resolveIntervalo(periodo);

  const [
    justificativasPorStatus,
    justificativasPorTipo,
    tiposJustificativa,
    chamadosPorStatus,
    chamadosRespondidos,
    ocorrenciasPorDepartamento,
    pendenciaRecorrente,
    folhaConfig,
    funcionariosAtivos,
  ] = await Promise.all([
    prisma.justificativa.groupBy({ by: ['status'], where: { createdAt: { gte: inicio, lte: fim } }, _count: true }),
    prisma.justificativa.groupBy({ by: ['tipoId'], where: { createdAt: { gte: inicio, lte: fim } }, _count: true }),
    prisma.tipoJustificativa.findMany({ select: { id: true, label: true } }),
    prisma.chamado.groupBy({ by: ['status'], where: { createdAt: { gte: inicio, lte: fim } }, _count: true }),
    prisma.chamado.findMany({
      where: { createdAt: { gte: inicio, lte: fim }, respondidoEm: { not: null } },
      select: { createdAt: true, respondidoEm: true },
    }),
    prisma.justificativa.findMany({
      where: { createdAt: { gte: inicio, lte: fim }, tipo: { contaTopDepartamentos: true } },
      select: { employee: { select: { departamento: { select: { nome: true } } } } },
    }),
    prisma.justificativa.groupBy({
      by: ['employeeId'],
      where: {
        createdAt: { gte: inicio, lte: fim },
        tipo: { contaPendenciaRecorrente: true },
      },
      _count: true,
    }),
    prisma.folhaConfig.findUnique({ where: { id: 1 } }),
    prisma.employee.count({ where: { ativo: true } }),
  ]);

  const labelPorTipoId = new Map(tiposJustificativa.map((t) => [t.id, t.label]));

  // Tempo médio de resposta de chamados (em horas), sobre os já respondidos no período.
  const temposRespostaHoras = chamadosRespondidos.map(
    (c) => (c.respondidoEm!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60)
  );
  const tempoMedioRespostaHoras =
    temposRespostaHoras.length > 0
      ? temposRespostaHoras.reduce((soma, h) => soma + h, 0) / temposRespostaHoras.length
      : null;

  // Ranking de departamentos por ocorrência de FALTA/ATRASO — agrupado em JS
  // porque o Prisma não faz groupBy direto sobre uma relação aninhada.
  const contagemPorDepartamento = new Map<string, number>();
  for (const j of ocorrenciasPorDepartamento) {
    const nome = j.employee.departamento?.nome ?? 'Sem unidade';
    contagemPorDepartamento.set(nome, (contagemPorDepartamento.get(nome) ?? 0) + 1);
  }
  const topDepartamentos = Array.from(contagemPorDepartamento.entries())
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  // Funcionários com pendência recorrente (≥3 ocorrências no período) — busca
  // nome/unidade dos que passaram do filtro.
  const recorrentes = pendenciaRecorrente.filter((p) => p._count >= 3);
  const employeeIdsRecorrentes = recorrentes.map((p) => p.employeeId);
  const employeesRecorrentes = await prisma.employee.findMany({
    where: { id: { in: employeeIdsRecorrentes } },
    select: { id: true, nome: true, unidade: true },
  });
  const employeeById = new Map(employeesRecorrentes.map((e) => [e.id, e]));
  const funcionariosRecorrentes = recorrentes
    .map((p) => ({
      employeeId: p.employeeId,
      nome: employeeById.get(p.employeeId)?.nome ?? '—',
      unidade: employeeById.get(p.employeeId)?.unidade ?? null,
      quantidade: p._count,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // Confirmações da folha do período vigente (não do filtro de período do
  // dashboard — a folha tem seu próprio período de fechamento configurado).
  const diaFechamento = folhaConfig?.diaFechamento ?? 20;
  const { ano, mes } = periodoReferencia(diaFechamento);
  const periodoFolha = calcularPeriodo(ano, mes, diaFechamento);
  const assinaturasFolha = await prisma.assinaturaFolha.count({ where: { ano, mes } });

  return NextResponse.json({
    periodo,
    intervalo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    justificativasPorStatus: justificativasPorStatus.map((s) => ({ status: s.status, quantidade: s._count })),
    justificativasPorTipo: justificativasPorTipo.map((t) => ({
      tipo: labelPorTipoId.get(t.tipoId) ?? t.tipoId,
      quantidade: t._count,
    })),
    chamadosPorStatus: chamadosPorStatus.map((s) => ({ status: s.status, quantidade: s._count })),
    tempoMedioRespostaHoras,
    chamadosRespondidosNoPeriodo: chamadosRespondidos.length,
    topDepartamentos,
    funcionariosRecorrentes,
    folha: {
      periodo: periodoFolha,
      assinados: assinaturasFolha,
      total: funcionariosAtivos,
    },
  });
}
