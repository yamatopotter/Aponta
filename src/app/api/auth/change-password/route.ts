import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const schema = z.object({ novaSenha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.') });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  // Funcionário não tem senha (login é só por CPF) — só o RH troca senha por aqui.
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Não aplicável a este perfil.' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const hash = await bcrypt.hash(parsed.data.novaSenha, 10);

  await prisma.adminUser.update({
    where: { id: session.adminId },
    data: { passwordHash: hash, mustChangePassword: false },
  });

  return NextResponse.json({ ok: true });
}
