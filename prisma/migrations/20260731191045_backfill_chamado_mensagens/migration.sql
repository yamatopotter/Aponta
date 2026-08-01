-- Backfill: transforma o Chamado.resposta (campo único antigo) na primeira
-- mensagem da conversa, pra chamados já respondidos não ficarem com thread
-- vazia. Usa respondidoEm quando existe; senão cai pro createdAt do chamado.
INSERT INTO "ChamadoInteracao" ("id", "chamadoId", "autorTipo", "autorAdminId", "tipo", "mensagem", "criadoEm")
SELECT
  'legacy_' || c."id",
  c."id",
  'ADMIN',
  c."respondidoPorId",
  'MENSAGEM',
  c."resposta",
  COALESCE(c."respondidoEm", c."createdAt")
FROM "Chamado" c
WHERE c."resposta" IS NOT NULL AND c."respondidoPorId" IS NOT NULL;
