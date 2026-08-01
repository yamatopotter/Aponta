-- AlterTable: Anexo passa a poder pertencer a uma mensagem específica da
-- conversa (chamadoInteracaoId), além do chamado/justificativa como um todo.
-- mimeType/tamanhoBytes são novos porque agora existe upload de verdade
-- (antes o campo `url` nunca era populado por nenhuma tela).
ALTER TABLE "Anexo" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "Anexo" ADD COLUMN "tamanhoBytes" INTEGER;
ALTER TABLE "Anexo" ADD COLUMN "chamadoInteracaoId" TEXT;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_chamadoInteracaoId_fkey" FOREIGN KEY ("chamadoInteracaoId") REFERENCES "ChamadoInteracao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
