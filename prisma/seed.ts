import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin padrão — login: admin / senha: admin
  // mustChangePassword=true força a troca no primeiro acesso (ver /login e middleware).
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: await bcrypt.hash('admin', 10),
        name: 'Administrador RH',
        mustChangePassword: true,
      },
    });
    console.log('✔ Usuário admin/admin criado (troca de senha obrigatória no 1º login).');
  } else {
    console.log('— Usuário admin já existia, nada a fazer.');
  }

  // Categorias de chamado padrão (RH pode editar/adicionar depois em
  // /admin/configuracoes/categorias)
  const categorias = [
    'Solicitar declaração de horas trabalhadas',
    'Dúvida sobre pagamento ou holerite',
    'Atualizar dados cadastrais (endereço, banco, dependentes)',
    'Solicitar férias ou folga',
    'Problema com crachá ou acesso',
    'Outro assunto',
  ];

  for (const [i, label] of categorias.entries()) {
    await prisma.categoriaChamado.upsert({
      where: { label },
      update: {},
      create: { label, ordem: i },
    });
  }
  console.log(`✔ ${categorias.length} categorias de chamado garantidas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
