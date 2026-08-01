import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  categoriaId: z.string().min(1),
  descricao: z.string().min(1, 'Descreva o que você precisa.'),
  anexos: z.array(z.object({ nomeArquivo: z.string(), url: z.string() })).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (session.role === 'EMPLOYEE') {
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 10));
    const where: Prisma.ChamadoWhereInput = { employeeId: session.employeeId };
    const [total, chamados] = await prisma.$transaction([
      prisma.chamado.count({ where }),
      prisma.chamado.findMany({
        where,
        include: { categoria: true, anexos: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const items = chamados.map((c) => ({
      ...c,
      // Concluído não conta — mesmo critério do badge (ver GET
      // /api/employee/pendencias): só chamado em andamento sinaliza.
      novaResposta:
        c.status === 'ANDAMENTO' &&
        !!c.respondidoEm &&
        (!c.visualizadoPeloFuncionarioEm || c.respondidoEm > c.visualizadoPeloFuncionarioEm),
    }));
    return NextResponse.json({ items, total, page, pageSize });
  }

  const status = searchParams.get('status');
  const unidade = searchParams.get('unidade');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');
  const temFiltroData = Boolean(dataInicio || dataFim);

  let statusWhere: Prisma.ChamadoWhereInput['status'];
  if (status && status !== 'Todos') {
    // Status escolhido explicitamente (inclusive "Concluído") sempre vale,
    // com ou sem filtro de data.
    statusWhere = status as Prisma.EnumChamadoStatusFilter['equals'];
  } else if (!temFiltroData) {
    // Sem status explícito e sem filtro de data: esconde CONCLUIDO por
    // padrão — sem isso a lista só cresce (nunca "some" nada) e fica pesada
    // com o tempo. Aplicar um filtro de data revela o histórico completo.
    statusWhere = { not: 'CONCLUIDO' };
  }

  const chamados = await prisma.chamado.findMany({
    where: {
      status: statusWhere,
      employee: { unidade: unidade && unidade !== 'Todas' ? unidade : undefined },
      createdAt: temFiltroData
        ? {
            gte: dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined,
            lte: dataFim ? new Date(`${dataFim}T23:59:59`) : undefined,
          }
        : undefined,
    },
    include: {
      employee: true,
      categoria: true,
      anexos: true,
      respondidoPor: { select: { id: true, name: true } },
      // Só a última mensagem da conversa — o card/linha da lista mostra um
      // excerto dela (ou da descrição original, se ninguém respondeu ainda),
      // não a `descricao` fixa de quando o chamado foi aberto.
      interacoes: {
        where: { tipo: 'MENSAGEM' },
        orderBy: { criadoEm: 'desc' },
        take: 1,
        select: { mensagem: true, autorTipo: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // "Aguardando resposta do RH" = a última mensagem da conversa (ou a
  // abertura, se ainda não tem nenhuma) foi do funcionário, e o chamado
  // ainda não foi concluído.
  const comIndicadores = chamados.map(({ interacoes, ...c }) => {
    const ultima = interacoes[0];
    return {
      ...c,
      ultimaMensagem: ultima?.mensagem ?? null,
      aguardandoResposta: c.status !== 'CONCLUIDO' && (!ultima || ultima.autorTipo === 'FUNCIONARIO'),
    };
  });

  return NextResponse.json(comIndicadores);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Apenas funcionários podem abrir chamados.' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const chamado = await prisma.chamado.create({
    data: {
      employeeId: session.employeeId,
      categoriaId: parsed.data.categoriaId,
      descricao: parsed.data.descricao,
      anexos: parsed.data.anexos?.length ? { create: parsed.data.anexos } : undefined,
    },
    include: { categoria: true, anexos: true },
  });

  return NextResponse.json(chamado, { status: 201 });
}
