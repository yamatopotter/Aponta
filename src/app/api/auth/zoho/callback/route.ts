import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, getPublicOrigin } from '@/lib/auth';
import { exchangeZohoLoginCode, sanitizeZohoAccountsServer } from '@/lib/zoho';

// GET /api/auth/zoho/callback — volta do consentimento do Zoho. Se o e-mail
// retornado não bater com nenhum AdminUser.email ativo, a pessoa é barrada
// (redireciona pro login com erro, nenhuma sessão é criada).
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const stateCookie = req.cookies.get('zoho_login_state')?.value;

  const loginUrl = new URL('/login', getPublicOrigin(req));

  function recusar(motivo: string) {
    loginUrl.searchParams.set('erroZoho', motivo);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('zoho_login_state');
    return res;
  }

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return recusar('estado_invalido');
  }

  try {
    const redirectUri = new URL('/api/auth/zoho/callback', getPublicOrigin(req)).toString();
    const accountsServer = sanitizeZohoAccountsServer(req.nextUrl.searchParams.get('accounts-server'));
    const identidade = await exchangeZohoLoginCode(code, redirectUri, accountsServer);

    const admin = await prisma.adminUser.findUnique({ where: { email: identidade.email } });
    if (!admin || !admin.ativo) {
      return recusar('nao_cadastrado');
    }

    await createSession(
      {
        role: 'ADMIN',
        adminId: admin.id,
        username: admin.username ?? admin.email ?? admin.name,
        name: admin.name,
        nivel: admin.nivel,
      },
      req
    );

    const res = NextResponse.redirect(new URL('/admin/justificativas', getPublicOrigin(req)));
    res.cookies.delete('zoho_login_state');
    return res;
  } catch (e) {
    // Sem isso, um erro no round-trip com o Zoho (token/userinfo) some sem
    // deixar rastro nenhum — "?erroZoho=falha" não diz o motivo real.
    console.error('[zoho/callback] falha no login via Zoho:', e);
    return recusar('falha');
  }
}
