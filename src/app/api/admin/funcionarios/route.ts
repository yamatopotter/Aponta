import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/funcionarios?unidade=&status=&q= — lista o cache local de
// funcionários (sincronizado do RHiD em /admin/configuracoes, aba RHiD).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const unidade = searchParams.get('unidade');
  const status = searchParams.get('status'); // 'ATIVO' | 'INATIVO' | 'Todos'
  const q = searchParams.get('q')?.trim();
  const cpfDigits = q?.replace(/\D/g, '');

  const funcionarios = await prisma.employee.findMany({
    where: {
      unidade: unidade && unidade !== 'Todas' ? unidade : undefined,
      ativo: status === 'ATIVO' ? true : status === 'INATIVO' ? false : undefined,
      ...(q
        ? {
            OR: [
              { nome: { contains: q, mode: 'insensitive' } },
              ...(cpfDigits ? [{ cpf: { contains: cpfDigits } }] : []),
            ],
          }
        : {}),
    },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json({
    total: funcionarios.length,
    ativos: funcionarios.filter((f) => f.ativo).length,
    items: funcionarios,
  });
}
