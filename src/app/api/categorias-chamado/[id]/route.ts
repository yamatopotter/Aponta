import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const patchSchema = z.object({
  label: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
});

// PATCH /api/categorias-chamado/:id — editar label, ativar/desativar ou
// reordenar. Mesmo nível de acesso do POST (qualquer ADMIN, RH incluído).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  try {
    const categoria = await prisma.categoriaChamado.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(categoria);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome.' }, { status: 400 });
    }
    throw e;
  }
}
