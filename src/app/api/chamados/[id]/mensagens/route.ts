import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { salvarAnexo, ArquivoInvalidoError } from '@/lib/storage';

const MAX_ANEXOS = 5;

// POST /api/chamados/:id/mensagens — envia uma mensagem na conversa do
// chamado, com anexos opcionais (multipart/form-data: campo `mensagem` +
// um ou mais `anexos`). Tanto o RH (qualquer admin) quanto o próprio
// funcionário podem enviar; um chamado pode ter várias mensagens de cada
// lado (ver ChamadoInteracao no schema). Enviar mensagem NÃO muda o status
// sozinho — são ações separadas (ver PATCH /api/chamados/:id) — exceto
// quando o funcionário escreve num chamado já Concluído, que reabre
// automaticamente (volta pra ANDAMENTO), pra não sumir num chamado
// escondido por padrão na lista do admin. Pelo mesmo motivo, a primeira
// mensagem do RH num chamado ainda Aberto também muda o status sozinha pra
// Em andamento — sinaliza que alguém já está cuidando disso.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const chamado = await prisma.chamado.findUnique({ where: { id: params.id } });
  if (!chamado) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });

  if (session.role === 'EMPLOYEE' && chamado.employeeId !== session.employeeId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  const formData = await req.formData();
  const mensagem = String(formData.get('mensagem') ?? '').trim();
  const arquivos = formData.getAll('anexos').filter((v): v is File => v instanceof File && v.size > 0);

  if (!mensagem) return NextResponse.json({ error: 'Escreva uma mensagem.' }, { status: 400 });
  if (arquivos.length > MAX_ANEXOS) {
    return NextResponse.json({ error: `Máximo de ${MAX_ANEXOS} anexos por mensagem.` }, { status: 400 });
  }

  let anexosSalvos;
  try {
    anexosSalvos = await Promise.all(arquivos.map((f) => salvarAnexo(f, chamado.id)));
  } catch (e) {
    if (e instanceof ArquivoInvalidoError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    if (session.role === 'ADMIN') {
      await tx.chamadoInteracao.create({
        data: {
          chamadoId: chamado.id,
          autorTipo: 'ADMIN',
          autorAdminId: session.adminId,
          tipo: 'MENSAGEM',
          mensagem,
          anexos: anexosSalvos.length ? { create: anexosSalvos } : undefined,
        },
      });

      if (chamado.status === 'ABERTO') {
        await tx.chamadoInteracao.create({
          data: {
            chamadoId: chamado.id,
            autorTipo: 'ADMIN',
            autorAdminId: session.adminId,
            tipo: 'STATUS_ALTERADO',
            statusNovo: 'ANDAMENTO',
            mensagem: 'Marcado como Em andamento automaticamente pela primeira mensagem do RH.',
          },
        });
      }

      return tx.chamado.update({
        where: { id: chamado.id },
        data: {
          resposta: mensagem,
          respondidoPorId: session.adminId,
          respondidoEm: new Date(),
          status: chamado.status === 'ABERTO' ? 'ANDAMENTO' : undefined,
        },
        include: { employee: true, categoria: true, anexos: true, respondidoPor: { select: { id: true, name: true } } },
      });
    }

    // EMPLOYEE
    await tx.chamadoInteracao.create({
      data: {
        chamadoId: chamado.id,
        autorTipo: 'FUNCIONARIO',
        autorEmployeeId: session.employeeId,
        tipo: 'MENSAGEM',
        mensagem,
        anexos: anexosSalvos.length ? { create: anexosSalvos } : undefined,
      },
    });

    if (chamado.status === 'CONCLUIDO') {
      await tx.chamadoInteracao.create({
        data: {
          chamadoId: chamado.id,
          autorTipo: 'FUNCIONARIO',
          autorEmployeeId: session.employeeId,
          tipo: 'STATUS_ALTERADO',
          statusNovo: 'ANDAMENTO',
          mensagem: 'Reaberto automaticamente após nova mensagem do funcionário.',
        },
      });
      return tx.chamado.update({
        where: { id: chamado.id },
        data: { status: 'ANDAMENTO' },
        include: { employee: true, categoria: true, anexos: true },
      });
    }

    return tx.chamado.findUniqueOrThrow({
      where: { id: chamado.id },
      include: { employee: true, categoria: true, anexos: true },
    });
  });

  return NextResponse.json(atualizado, { status: 201 });
}
