import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

const schema = z.object({
  username: z.string().min(1),
  senha: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
  if (!admin) return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });

  if (!admin.passwordHash) {
    return NextResponse.json({ error: 'Esta conta acessa só via Zoho. Use o botão "Entrar com Zoho".' }, { status: 400 });
  }

  const ok = await bcrypt.compare(parsed.data.senha, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });

  if (!admin.ativo) return NextResponse.json({ error: 'Este usuário está desativado. Fale com um administrador.' }, { status: 403 });

  await createSession({
    role: 'ADMIN',
    adminId: admin.id,
    username: admin.username ?? parsed.data.username,
    name: admin.name,
    nivel: admin.nivel,
  });

  return NextResponse.json({ mustChangePassword: admin.mustChangePassword });
}
