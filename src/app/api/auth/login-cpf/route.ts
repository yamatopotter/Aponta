import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { findRhidPersonByCpf } from '@/lib/rhid';

const schema = z.object({
  cpf: z.string().min(11),
});

function onlyDigits(v: string) {
  return v.replace(/\D/g, '');
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'CPF é obrigatório.' }, { status: 400 });
  }

  const cpf = onlyDigits(parsed.data.cpf);

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

  await createSession({
    role: 'EMPLOYEE',
    employeeId: employee.id,
    cpf: employee.cpf,
    nome: employee.nome,
    unidade: employee.unidade,
  });

  return NextResponse.json({ ok: true });
}
