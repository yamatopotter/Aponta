import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json(justificativas);
  }

  // ADMIN
  const status = searchParams.get('status');
  const unidade = searchParams.get('unidade');
  const q = searchParams.get('q');

  const justificativas = await prisma.justificativa.findMany({
    where: {
      status: status && status !== 'Todos' ? (status as any) : undefined,
      employee: {
        unidade: unidade && unidade !== 'Todas' ? unidade : undefined,
        nome: q ? { contains: q, mode: 'insensitive' } : undefined,
      },
    },
    include: { employee: true, anexos: true, decididoPor: true },
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
