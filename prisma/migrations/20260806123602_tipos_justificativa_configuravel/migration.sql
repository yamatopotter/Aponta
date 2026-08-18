-- Tipos de justificativa deixam de ser o enum fixo TipoOcorrencia
-- (FALTA/ATRASO/SEM_SAIDA/AJUSTE) e passam a ser um cadastro configurável
-- (tela /admin/configuracoes, aba Tipos), no mesmo espírito de
-- CategoriaChamado. Como já existem justificativas reais no banco, o valor
-- antigo do enum é migrado (backfill) pros 4 tipos "de origem" abaixo, com
-- os flags de contagem do Dashboard reproduzindo exatamente o filtro
-- hardcoded que existia antes (ver src/app/api/admin/dashboard/route.ts):
-- Falta/Atraso contavam em "Top departamentos" E "Pendência recorrente";
-- Sem saída só em "Pendência recorrente"; Ajuste em nenhuma das duas.

-- CreateTable
CREATE TABLE "TipoJustificativa" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "contaTopDepartamentos" BOOLEAN NOT NULL DEFAULT true,
    "contaPendenciaRecorrente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoJustificativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoJustificativa_label_key" ON "TipoJustificativa"("label");

-- Seed dos 4 tipos originais, preservando o comportamento atual do dashboard.
INSERT INTO "TipoJustificativa" ("id", "label", "ordem", "contaTopDepartamentos", "contaPendenciaRecorrente") VALUES
  ('tipo_falta',     'Falta',      0, true,  true),
  ('tipo_atraso',    'Atraso',     1, true,  true),
  ('tipo_sem_saida', 'Sem saída',  2, false, true),
  ('tipo_ajuste',    'Ajuste',     3, false, false);

-- AlterTable: coluna nova, nullable por enquanto pra dar tempo do backfill.
ALTER TABLE "Justificativa" ADD COLUMN "tipoId" TEXT;

-- Backfill: cada justificativa existente aponta pro tipo equivalente ao
-- valor antigo do enum.
UPDATE "Justificativa" SET "tipoId" = CASE "tipo"
  WHEN 'FALTA' THEN 'tipo_falta'
  WHEN 'ATRASO' THEN 'tipo_atraso'
  WHEN 'SEM_SAIDA' THEN 'tipo_sem_saida'
  WHEN 'AJUSTE' THEN 'tipo_ajuste'
END;

-- Agora que todo mundo tem tipoId, torna obrigatório e derruba a coluna/enum antigos.
ALTER TABLE "Justificativa" ALTER COLUMN "tipoId" SET NOT NULL;
ALTER TABLE "Justificativa" DROP COLUMN "tipo";
DROP TYPE "TipoOcorrencia";

-- CreateIndex
CREATE INDEX "Justificativa_tipoId_idx" ON "Justificativa"("tipoId");

-- AddForeignKey
ALTER TABLE "Justificativa" ADD CONSTRAINT "Justificativa_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoJustificativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
