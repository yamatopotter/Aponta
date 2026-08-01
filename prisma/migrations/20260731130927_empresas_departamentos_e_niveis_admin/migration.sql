-- CreateEnum
CREATE TYPE "NivelAdmin" AS ENUM ('RH', 'ADMIN');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nivel" "NivelAdmin" NOT NULL DEFAULT 'RH';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "departamentoId" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "rhidCompanyId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "rhidDepartmentId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "empresaId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_rhidCompanyId_key" ON "Empresa"("rhidCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_rhidDepartmentId_key" ON "Departamento"("rhidDepartmentId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
