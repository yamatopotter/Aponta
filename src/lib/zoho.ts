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
    throw new Error('Zoho ainda não está conectado. Configure em /admin/configuracoes/zoho.');
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
