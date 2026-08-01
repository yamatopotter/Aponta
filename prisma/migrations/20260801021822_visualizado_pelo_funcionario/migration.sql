-- Rastreio de "visto pelo funcionário" — só pros badges de notificação
-- (resposta nova de chamado / decisão nova de justificativa), não é
-- controle de leitura por item.
ALTER TABLE "Chamado" ADD COLUMN "visualizadoPeloFuncionarioEm" TIMESTAMP(3);
ALTER TABLE "Justificativa" ADD COLUMN "visualizadoPeloFuncionarioEm" TIMESTAMP(3);
