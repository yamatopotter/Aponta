import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  dataOcorrencia: z.string(), // yyyy-MM-dd
  tipo: z.enum(['FALTA', 'ATRASO', 'SEM_SAIDA', 'AJUSTE']),
  isAjuste: z.boolean().default(false),
  issueDetectado: z.string().optional(),
  motivo: z.string().min(1),
  cid: z.string().optional(),
  gestorNome: z.string().optional(),
  horaEntradaCorreta: z.string().optional(),
  horaSaidaCorreta: z.string().optional(),
  intervaloInicioCorreto: z.string().optional(),
  intervaloFimCorreto: z.string().optional(),
  comentario: z.string().optional(),
  anexos: z.array(z.object({ nomeArquivo: z.string(), url: z.string() })).optional(),
});

// GET /api/justificativas
//   - funcionário: retorna só as próprias
//   - admin: retorna todas, com filtros ?status=&unidade=&q=
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (session.role === 'EMPLOYEE') {
    const justificativas = await prisma.justificativa.findMany({
      where: { employeeId: session.employeeId },
      include: { anexos: true },
      orderBy: { dataOcorrencia: 'desc' },
    });

    // Abrir a lista marca as decididas como "vistas" — some com o badge de
    // decisão nova (ver GET /api/employee/pendencias). Não é por item (não
    // há tela de detalhe do lado do funcionário); a lista inteira conta.
    await prisma.justificativa.updateMany({
      where: { employeeId: session.employeeId, status: { in: ['APROVADO', 'REPROVADO'] } },
      data: { visualizadoPeloFuncionarioEm: new Date() },
    });

    return NextResponse.json(justificativas);
  }

  // ADMIN
  const status = searchParams.get('status');
  const unidade = searchParams.get('unidade');
  const q = searchParams.get('q');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');
  const temFiltroData = Boolean(dataInicio || dataFim);

  let statusWhere: Prisma.JustificativaWhereInput['status'];
  if (status && status !== 'Todos') {
    // Status escolhido explicitamente (inclusive Aprovado/Reprovado) sempre
    // vale, com ou sem filtro de data.
    statusWhere = status as Prisma.EnumJustificativaStatusFilter['equals'];
  } else if (!temFiltroData) {
    // Sem status explícito e sem filtro de data: esconde já decididas
    // (Aprovado/Reprovado) por padrão — mesma lógica de Chamados, ver
    // src/app/api/chamados/route.ts. Aplicar um filtro de data revela o
    // histórico completo.
    statusWhere = { notIn: ['APROVADO', 'REPROVADO'] };
  }

  const justificativas = await prisma.justificativa.findMany({
    where: {
      status: statusWhere,
      employee: {
        unidade: unidade && unidade !== 'Todas' ? unidade : undefined,
        nome: q ? { contains: q, mode: 'insensitive' } : undefined,
      },
      createdAt: temFiltroData
        ? {
            gte: dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined,
            lte: dataFim ? new Date(`${dataFim}T23:59:59`) : undefined,
          }
        : undefined,
    },
    include: { employee: true, anexos: true, decididoPor: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(justificativas);
}

// POST /api/justificativas — só o funcionário cria (justificativa ou pedido de ajuste)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Apenas funcionários podem enviar justificativas.' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const justificativa = await prisma.justificativa.create({
    data: {
      employeeId: session.employeeId,
      dataOcorrencia: new Date(data.dataOcorrencia),
      tipo: data.tipo,
      isAjuste: data.isAjuste,
      issueDetectado: data.issueDetectado,
      motivo: data.motivo,
      cid: data.cid,
      gestorNome: data.gestorNome,
      horaEntradaCorreta: data.horaEntradaCorreta,
      horaSaidaCorreta: data.horaSaidaCorreta,
      intervaloInicioCorreto: data.intervaloInicioCorreto,
      intervaloFimCorreto: data.intervaloFimCorreto,
      comentario: data.comentario,
      status: 'EM_ANALISE',
      anexos: data.anexos?.length ? { create: data.anexos } : undefined,
    },
    include: { anexos: true },
  });

  return NextResponse.json(justificativa, { status: 201 });
}
