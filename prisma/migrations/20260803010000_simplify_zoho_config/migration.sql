-- ZohoConfig só serve pro login de admin via Zoho OAuth (src/lib/zoho.ts) —
-- o envio de e-mail pelo Zoho Mail nunca chegou a ser usado (sendZohoEmail
-- não tinha nenhum chamador), então essas colunas nunca guardaram nada além
-- do preenchimento vazio/opcional da tela antiga.
ALTER TABLE "ZohoConfig"
  DROP COLUMN "redirectUri",
  DROP COLUMN "scope",
  DROP COLUMN "refreshTokenEnc",
  DROP COLUMN "accessTokenEnc",
  DROP COLUMN "accessTokenExpiresAt",
  DROP COLUMN "connectedEmail";
