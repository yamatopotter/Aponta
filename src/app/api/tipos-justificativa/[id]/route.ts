import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const patchSchema = z.object({
  label: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
  contaTopDepartamentos: z.boolean().optional(),
  contaPendenciaRecorrente: z.boolean().optional(),
});

// PATCH /api/tipos-justificativa/:id — editar label, ativar/desativar,
// reordenar ou ajustar os flags de contagem do Dashboard. Mesmo nível de
// acesso do POST (qualquer ADMIN, RH incluído).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  try {
    const tipo = await prisma.tipoJustificativa.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(tipo);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um tipo com esse nome.' }, { status: 400 });
    }
    throw e;
  }
}
