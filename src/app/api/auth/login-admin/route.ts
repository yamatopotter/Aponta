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

  const ok = await bcrypt.compare(parsed.data.senha, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });

  await createSession({ role: 'ADMIN', adminId: admin.id, username: admin.username, name: admin.name });

  return NextResponse.json({ mustChangePassword: admin.mustChangePassword });
}
