import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const schema = z.object({ novaSenha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.') });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const hash = await bcrypt.hash(parsed.data.novaSenha, 10);

  if (session.role === 'ADMIN') {
    await prisma.adminUser.update({
      where: { id: session.adminId },
      data: { passwordHash: hash, mustChangePassword: false },
    });
  } else {
    await prisma.employee.update({
      where: { id: session.employeeId },
      data: { passwordHash: hash, mustChangePassword: false },
    });
  }

  return NextResponse.json({ ok: true });
}
