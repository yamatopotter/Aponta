-- CreateEnum
CREATE TYPE "ChamadoInteracaoTipo" AS ENUM ('NOTA', 'STATUS_ALTERADO');

-- CreateTable
CREATE TABLE "ChamadoInteracao" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" "ChamadoInteracaoTipo" NOT NULL,
    "statusNovo" "ChamadoStatus",
    "mensagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChamadoInteracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChamadoInteracao_chamadoId_idx" ON "ChamadoInteracao"("chamadoId");

-- AddForeignKey
ALTER TABLE "ChamadoInteracao" ADD CONSTRAINT "ChamadoInteracao_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamadoInteracao" ADD CONSTRAINT "ChamadoInteracao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
