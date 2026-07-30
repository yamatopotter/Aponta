import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { findRhidPersonByCpf } from '@/lib/rhid';

const schema = z.object({
  cpf: z.string().min(11),
  senha: z.string().min(1),
});

function onlyDigits(v: string) {
  return v.replace(/\D/g, '');
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'CPF e senha são obrigatórios.' }, { status: 400 });
  }

  const cpf = onlyDigits(parsed.data.cpf);
  const senha = parsed.data.senha;

  let employee = await prisma.employee.findUnique({ where: { cpf } });

  // Não achou localmente? Confirma direto no RHiD antes de recusar — cobre o
  // caso de alguém recém-admitido cujo cadastro ainda não foi sincronizado.
  if (!employee) {
    const rhidPerson = await findRhidPersonByCpf(cpf).catch(() => null);
    if (!rhidPerson) {
      return NextResponse.json({ error: 'CPF não encontrado no cadastro do RHiD.' }, { status: 401 });
    }
    employee = await prisma.employee.create({
      data: { rhidPersonId: rhidPerson.id, cpf, nome: rhidPerson.name, ativo: rhidPerson.status === 1 },
    });
  }

  if (!employee.ativo) {
    return NextResponse.json({ error: 'Cadastro inativo. Fale com o RH.' }, { status: 403 });
  }

  // Primeiro acesso: ainda não existe senha local. Padrão = CPF (só dígitos).
  // Isso força troca de senha no primeiro login (ver mustChangePassword).
  if (!employee.passwordHash) {
    if (senha !== cpf) {
      return NextResponse.json(
        { error: 'No primeiro acesso, a senha provisória é o seu CPF (somente números).' },
        { status: 401 }
      );
    }
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: { passwordHash: await bcrypt.hash(cpf, 10), mustChangePassword: true },
    });
  } else {
    const ok = await bcrypt.compare(senha, employee.passwordHash);
    if (!ok) return NextResponse.json({ error: 'CPF ou senha incorretos.' }, { status: 401 });
  }

  await createSession({
    role: 'EMPLOYEE',
    employeeId: employee.id,
    cpf: employee.cpf,
    nome: employee.nome,
    unidade: employee.unidade,
  });

  return NextResponse.json({ mustChangePassword: employee.mustChangePassword });
}
