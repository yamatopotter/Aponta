-- CreateEnum
CREATE TYPE "JustificativaStatus" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "TipoOcorrencia" AS ENUM ('FALTA', 'ATRASO', 'SEM_SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "ChamadoStatus" AS ENUM ('ABERTO', 'ANDAMENTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "rhidPersonId" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "unidade" TEXT,
    "passwordHash" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Justificativa" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dataOcorrencia" DATE NOT NULL,
    "tipo" "TipoOcorrencia" NOT NULL,
    "isAjuste" BOOLEAN NOT NULL DEFAULT false,
    "issueDetectado" TEXT,
    "motivo" TEXT NOT NULL,
    "cid" TEXT,
    "gestorNome" TEXT,
    "horaEntradaCorreta" TEXT,
    "horaSaidaCorreta" TEXT,
    "intervaloInicioCorreto" TEXT,
    "intervaloFimCorreto" TEXT,
    "comentario" TEXT,
    "status" "JustificativaStatus" NOT NULL DEFAULT 'PENDENTE',
    "motivoReprovacao" TEXT,
    "decididoPorId" TEXT,
    "decididoEm" TIMESTAMP(3),
    "exportadoParaRhidEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Justificativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaChamado" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoriaChamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamado" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "ChamadoStatus" NOT NULL DEFAULT 'ABERTO',
    "resposta" TEXT,
    "respondidoPorId" TEXT,
    "respondidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "justificativaId" TEXT,
    "chamadoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZohoConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "clientId" TEXT,
    "clientSecretEnc" TEXT,
    "redirectUri" TEXT,
    "scope" TEXT DEFAULT 'ZohoMail.messages.CREATE,ZohoMail.accounts.READ',
    "refreshTokenEnc" TEXT,
    "accessTokenEnc" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "connectedEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZohoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RhidIntegrationToken" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "accessToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RhidIntegrationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_rhidPersonId_key" ON "Employee"("rhidPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cpf_key" ON "Employee"("cpf");

-- CreateIndex
CREATE INDEX "Justificativa_employeeId_dataOcorrencia_idx" ON "Justificativa"("employeeId", "dataOcorrencia");

-- CreateIndex
CREATE INDEX "Justificativa_status_idx" ON "Justificativa"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaChamado_label_key" ON "CategoriaChamado"("label");

-- CreateIndex
CREATE INDEX "Chamado_status_idx" ON "Chamado"("status");

-- AddForeignKey
ALTER TABLE "Justificativa" ADD CONSTRAINT "Justificativa_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Justificativa" ADD CONSTRAINT "Justificativa_decididoPorId_fkey" FOREIGN KEY ("decididoPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaChamado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_respondidoPorId_fkey" FOREIGN KEY ("respondidoPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_justificativaId_fkey" FOREIGN KEY ("justificativaId") REFERENCES "Justificativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
