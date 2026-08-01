import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireNivelAdmin } from '@/lib/auth';

const updateSchema = z.object({
  nivel: z.enum(['RH', 'ADMIN']).optional(),
  ativo: z.boolean().optional(),
  resetarSenha: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const alvo = await prisma.adminUser.findUnique({ where: { id: params.id } });
  if (!alvo) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });

  // Não deixa remover o último administrador de nível ADMIN ativo — trancaria
  // o sistema, ninguém mais conseguiria mexer em Configurações.
  const vaiPerderNivelAdmin =
    alvo.nivel === 'ADMIN' &&
    alvo.ativo &&
    ((parsed.data.nivel && parsed.data.nivel !== 'ADMIN') || parsed.data.ativo === false);

  if (vaiPerderNivelAdmin) {
    const outrosAdminsAtivos = await prisma.adminUser.count({
      where: { nivel: 'ADMIN', ativo: true, id: { not: alvo.id } },
    });
    if (outrosAdminsAtivos === 0) {
      return NextResponse.json(
        { error: 'Não é possível remover o último administrador com nível Admin ativo.' },
        { status: 400 }
      );
    }
  }

  if (parsed.data.resetarSenha && !alvo.username) {
    return NextResponse.json(
      { error: 'Essa conta acessa só via Zoho, não tem senha pra resetar.' },
      { status: 400 }
    );
  }

  const data: { nivel?: 'RH' | 'ADMIN'; ativo?: boolean; passwordHash?: string; mustChangePassword?: boolean } = {};
  if (parsed.data.nivel) data.nivel = parsed.data.nivel;
  if (parsed.data.ativo !== undefined) data.ativo = parsed.data.ativo;

  let novaSenha: string | undefined;
  if (parsed.data.resetarSenha) {
    novaSenha = crypto.randomBytes(6).toString('base64url'); // curta, só pra repassar uma vez
    data.passwordHash = await bcrypt.hash(novaSenha, 10);
    data.mustChangePassword = true;
  }

  const atualizado = await prisma.adminUser.update({
    where: { id: alvo.id },
    data,
    select: { id: true, username: true, email: true, name: true, nivel: true, ativo: true },
  });

  return NextResponse.json({ ...atualizado, novaSenha });
}
