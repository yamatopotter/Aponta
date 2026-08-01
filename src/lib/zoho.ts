import { prisma } from './prisma';
import { encryptSecret, decryptSecret } from './crypto';

// Endpoint de contas Zoho — ajuste o domínio (.com/.eu/.com.br etc.) conforme
// a região da conta Zoho da empresa. Padrão .com abaixo.
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';
const ZOHO_MAIL_API_URL = 'https://mail.zoho.com/api';

export function buildZohoAuthorizeUrl(clientId: string, redirectUri: string, scope: string, state: string) {
  const params = new URLSearchParams({
    scope,
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    access_type: 'offline', // necessário para receber refresh_token
    prompt: 'consent',
    state,
  });
  return `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params.toString()}`;
}

export async function exchangeZohoCode(code: string) {
  const config = await prisma.zohoConfig.findUnique({ where: { id: 1 } });
  if (!config?.clientId || !config.clientSecretEnc || !config.redirectUri) {
    throw new Error('Configuração do Zoho incompleta. Preencha Client ID/Secret antes de conectar.');
  }

  const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: decryptSecret(config.clientSecretEnc),
      redirect_uri: config.redirectUri,
      code,
    }),
  });

  if (!res.ok) throw new Error(`Falha ao trocar código Zoho por token (${res.status}): ${await res.text()}`);
  const data = await res.json();

  await prisma.zohoConfig.update({
    where: { id: 1 },
    data: {
      refreshTokenEnc: encryptSecret(data.refresh_token),
      accessTokenEnc: encryptSecret(data.access_token),
      accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data;
}

async function refreshZohoAccessToken() {
  const config = await prisma.zohoConfig.findUnique({ where: { id: 1 } });
  if (!config?.clientId || !config.clientSecretEnc || !config.refreshTokenEnc) {
    throw new Error('Zoho ainda não está conectado. Configure em /admin/configuracoes (aba Zoho).');
  }

  const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: decryptSecret(config.clientSecretEnc),
      refresh_token: decryptSecret(config.refreshTokenEnc),
    }),
  });

  if (!res.ok) throw new Error(`Falha ao renovar token Zoho (${res.status}): ${await res.text()}`);
  const data = await res.json();

  await prisma.zohoConfig.update({
    where: { id: 1 },
    data: {
      accessTokenEnc: encryptSecret(data.access_token),
      accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token as string;
}

async function getValidAccessToken(): Promise<string> {
  const config = await prisma.zohoConfig.findUnique({ where: { id: 1 } });
  if (config?.accessTokenEnc && config.accessTokenExpiresAt && config.accessTokenExpiresAt > new Date()) {
    return decryptSecret(config.accessTokenEnc);
  }
  return refreshZohoAccessToken();
}

/**
 * --- Login de admin via Zoho OAuth (identidade, não envio de e-mail) ---
 *
 * Usa o MESMO app Zoho (Client ID/Secret em ZohoConfig) já cadastrado pra
 * envio de e-mail, só que com outro redirect_uri e outro escopo — o app
 * criado em api-console.zoho.com precisa ter as DUAS URLs de redirect
 * registradas: a de envio de e-mail (`/api/integrations/zoho/callback`) e a
 * de login (`/api/auth/zoho/callback`).
 *
 * ⚠️ Diferente do RHiD (onde validei o formato exato contra
 * docs/integrations/rhid-swagger.json e uma conta real), o endpoint de
 * identidade abaixo (`/oauth/v2/userinfo`) e os nomes dos campos
 * (`Email`/`Display_Name`) foram implementados a partir do conhecimento
 * geral da API do Zoho, sem uma conta real pra testar o round-trip
 * completo. Teste com uma conta Zoho de verdade antes de confiar nisso em
 * produção — se os campos vierem diferentes, é só ajustar
 * `exchangeZohoLoginCode` abaixo.
 */

export function buildZohoLoginAuthorizeUrl(clientId: string, redirectUri: string, state: string) {
  const params = new URLSearchParams({
    scope: 'AaaServer.profile.Read',
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    prompt: 'consent',
    state,
  });
  return `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params.toString()}`;
}

export interface ZohoIdentidade {
  email: string;
  nome: string;
}

export async function exchangeZohoLoginCode(code: string, redirectUri: string): Promise<ZohoIdentidade> {
  const config = await prisma.zohoConfig.findUnique({ where: { id: 1 } });
  if (!config?.clientId || !config.clientSecretEnc) {
    throw new Error('Configuração do Zoho incompleta. Peça pra um Admin preencher em Configurações → Zoho.');
  }

  const tokenRes = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: decryptSecret(config.clientSecretEnc),
      redirect_uri: redirectUri,
      code,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Falha ao trocar código Zoho por token (${tokenRes.status}): ${await tokenRes.text()}`);
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Zoho não retornou access_token.');

  const infoRes = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/userinfo`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!infoRes.ok) throw new Error(`Falha ao obter identidade do Zoho (${infoRes.status}): ${await infoRes.text()}`);
  const info = await infoRes.json();

  const email: string | undefined = info.Email ?? info.email;
  const nome: string = info.Display_Name ?? info.name ?? email ?? 'Sem nome';
  if (!email) throw new Error('O Zoho não retornou um e-mail pra essa conta.');

  return { email: email.toLowerCase(), nome };
}

/**
 * Envia um e-mail via Zoho Mail API (ex.: notificar aprovação/reprovação de
 * justificativa, ou resposta de chamado). Requer conta Zoho Mail configurada
 * e o accountId — normalmente obtido em GET {ZOHO_MAIL_API_URL}/accounts.
 */
export async function sendZohoEmail(params: {
  accountId: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  content: string;
}) {
  const token = await getValidAccessToken();
  const res = await fetch(`${ZOHO_MAIL_API_URL}/accounts/${params.accountId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      subject: params.subject,
      content: params.content,
    }),
  });
  if (!res.ok) throw new Error(`Falha ao enviar e-mail via Zoho (${res.status}): ${await res.text()}`);
  return res.json();
}
