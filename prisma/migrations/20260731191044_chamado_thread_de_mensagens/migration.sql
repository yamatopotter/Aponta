-- CreateEnum
CREATE TYPE "ChamadoInteracaoAutorTipo" AS ENUM ('ADMIN', 'FUNCIONARIO');

-- AlterEnum (novo valor pra mensagens de conversa, além de nota/status).
-- Fica numa migration própria porque o Postgres não deixa usar um valor de
-- enum recém-criado na mesma transação que o adiciona — o backfill que usa
-- 'MENSAGEM' está na migration seguinte.
ALTER TYPE "ChamadoInteracaoTipo" ADD VALUE 'MENSAGEM';

-- AlterTable: ChamadoInteracao passa a aceitar autor ADMIN ou FUNCIONARIO
ALTER TABLE "ChamadoInteracao" DROP CONSTRAINT "ChamadoInteracao_autorId_fkey";
ALTER TABLE "ChamadoInteracao" RENAME COLUMN "autorId" TO "autorAdminId";
ALTER TABLE "ChamadoInteracao" ALTER COLUMN "autorAdminId" DROP NOT NULL;
ALTER TABLE "ChamadoInteracao" ADD COLUMN "autorEmployeeId" TEXT;
ALTER TABLE "ChamadoInteracao" ADD COLUMN "autorTipo" "ChamadoInteracaoAutorTipo" NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "ChamadoInteracao" ALTER COLUMN "autorTipo" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "ChamadoInteracao" ADD CONSTRAINT "ChamadoInteracao_autorAdminId_fkey" FOREIGN KEY ("autorAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChamadoInteracao" ADD CONSTRAINT "ChamadoInteracao_autorEmployeeId_fkey" FOREIGN KEY ("autorEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
