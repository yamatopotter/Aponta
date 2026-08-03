-- Garante que RhidConfig(id=1) já exista com os valores padrão (base URL e
-- e-mail de integração) assim que o sistema sobe pela primeira vez, sem
-- depender de variáveis de ambiente. A senha fica de fora de propósito: é
-- segredo, não tem valor padrão seguro para ser versionado numa migration —
-- precisa ser preenchida em /admin/configuracoes (aba RHiD).
INSERT INTO "RhidConfig" ("id", "apiBaseUrl", "integrationEmail", "updatedAt")
VALUES (1, 'https://www.rhid.com.br/v2/api.svc', 'integracao@evorafarma.com.br', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
