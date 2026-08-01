import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { lerAnexo } from '@/lib/storage';

// GET /api/anexos/:id — serve o arquivo de um anexo (mensagem de chamado,
// chamado ou justificativa). Nunca fica em `public/`: passa por aqui pra
// checar permissão antes — funcionário só acessa anexo de algo que é dele;
// admin acessa qualquer um.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const anexo = await prisma.anexo.findUnique({
    where: { id: params.id },
    include: {
      chamado: { select: { employeeId: true } },
      chamadoInteracao: { select: { chamado: { select: { employeeId: true } } } },
      justificativa: { select: { employeeId: true } },
    },
  });
  if (!anexo) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });

  const donoEmployeeId =
    anexo.chamado?.employeeId ?? anexo.chamadoInteracao?.chamado.employeeId ?? anexo.justificativa?.employeeId;

  if (session.role === 'EMPLOYEE' && donoEmployeeId !== session.employeeId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  const conteudo = await lerAnexo(anexo.url);
  const nomeCodificado = encodeURIComponent(anexo.nomeArquivo);

  return new NextResponse(conteudo, {
    headers: {
      'Content-Type': anexo.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="anexo"; filename*=UTF-8''${nomeCodificado}`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
