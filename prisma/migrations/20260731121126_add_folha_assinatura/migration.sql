-- CreateTable
CREATE TABLE "FolhaConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "diaFechamento" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FolhaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaFolha" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "assinadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssinaturaFolha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssinaturaFolha_ano_mes_idx" ON "AssinaturaFolha"("ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaFolha_employeeId_ano_mes_key" ON "AssinaturaFolha"("employeeId", "ano", "mes");

-- AddForeignKey
ALTER TABLE "AssinaturaFolha" ADD CONSTRAINT "AssinaturaFolha_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
