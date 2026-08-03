import { prisma } from './prisma';
import { decryptSecret } from './crypto';

// Endpoint de contas Zoho — ajuste o domínio (.com/.eu/.com.br etc.) conforme
// a região da conta Zoho da empresa. Padrão .com abaixo.
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';

/**
 * --- Login de admin via Zoho OAuth (identidade, não envio de e-mail) ---
 *
 * Único uso do Zoho no app hoje: autenticar administradores pelo e-mail da
 * conta Zoho da empresa, em vez de usuário/senha. O app criado em
 * api-console.zoho.com precisa ter `{origem}/api/auth/zoho/callback`
 * cadastrado como Redirect URI (ver aba Zoho de /admin/configuracoes).
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
