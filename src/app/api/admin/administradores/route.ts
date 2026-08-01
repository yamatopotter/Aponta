import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireNivelAdmin } from '@/lib/auth';

// Uma conta usa um dos dois caminhos de login (ver comentário em
// prisma/schema.prisma): usuário+senha, OU e-mail (login via Zoho OAuth).
const senhaSchema = z.object({
  modo: z.literal('senha'),
  name: z.string().min(1),
  nivel: z.enum(['RH', 'ADMIN']),
  username: z.string().min(3, 'Usuário precisa ter pelo menos 3 caracteres.'),
  senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
});
const zohoSchema = z.object({
  modo: z.literal('zoho'),
  name: z.string().min(1),
  nivel: z.enum(['RH', 'ADMIN']),
  email: z.string().email('E-mail inválido.'),
});
const createSchema = z.union([senhaSchema, zohoSchema]);

export async function GET() {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      nivel: true,
      ativo: true,
      mustChangePassword: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  // passwordHash nunca vai pro front — só um booleano dizendo se a conta
  // tem senha (usuário+senha) ou não (login só via Zoho).
  return NextResponse.json(
    admins.map(({ passwordHash, ...admin }) => ({ ...admin, temSenha: Boolean(passwordHash) }))
  );
}

export async function POST(req: NextRequest) {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  if (parsed.data.modo === 'senha') {
    const existing = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
    if (existing) return NextResponse.json({ error: 'Já existe um usuário com esse username.' }, { status: 409 });

    const admin = await prisma.adminUser.create({
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        nivel: parsed.data.nivel,
        passwordHash: await bcrypt.hash(parsed.data.senha, 10),
        mustChangePassword: true,
      },
      select: { id: true, username: true, email: true, name: true, nivel: true, ativo: true, createdAt: true },
    });
    return NextResponse.json(admin, { status: 201 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Já existe um usuário com esse e-mail.' }, { status: 409 });

  const admin = await prisma.adminUser.create({
    data: {
      email,
      name: parsed.data.name,
      nivel: parsed.data.nivel,
      mustChangePassword: false, // não tem senha pra trocar — login é via Zoho
    },
    select: { id: true, username: true, email: true, name: true, nivel: true, ativo: true, createdAt: true },
  });
  return NextResponse.json(admin, { status: 201 });
}
