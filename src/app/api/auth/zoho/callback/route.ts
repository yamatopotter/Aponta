import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, getPublicOrigin } from '@/lib/auth';
import { exchangeZohoLoginCode } from '@/lib/zoho';

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
    const identidade = await exchangeZohoLoginCode(code, redirectUri);

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
  } catch {
    return recusar('falha');
  }
}
