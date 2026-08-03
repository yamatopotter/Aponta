-- Genericiza o e-mail padrão semeado por
-- 20260803000000_seed_rhid_config_default. Só atualiza se ainda estiver
-- exatamente com o valor antigo (não sobrescreve o que um admin já
-- configurou pela tela).
UPDATE "RhidConfig"
SET "integrationEmail" = 'integracao@suaempresa.com.br'
WHERE "id" = 1 AND "integrationEmail" = 'integracao@evorafarma.com.br';
