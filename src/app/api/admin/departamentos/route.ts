import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/departamentos — lista pra popular os filtros de unidade em
// Justificativas/Chamados/Funcionários. Acessível a qualquer ADMIN (RH ou
// nível ADMIN), já que essas telas são de atendimento (nível RH já vê elas).
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const departamentos = await prisma.departamento.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true },
  });

  return NextResponse.json(departamentos);
}
