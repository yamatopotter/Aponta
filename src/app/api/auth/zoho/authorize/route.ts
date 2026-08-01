import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { buildZohoLoginAuthorizeUrl } from '@/lib/zoho';

// Sem cookies()/headers() explícitos, o Next tenta pré-renderizar essa rota
// como estática no build — e falha, porque ela consulta o banco. Precisa
// ficar sempre dinâmica (roda por request).
export const dynamic = 'force-dynamic';

// GET /api/auth/zoho/authorize — público (é o próprio início do login), não
// exige sessão. Redireciona pro consentimento do Zoho; a identidade que
// volta no callback é conferida contra AdminUser.email.
export async function GET(req: NextRequest) {
  const config = await prisma.zohoConfig.findUnique({ where: { id: 1 } });
  if (!config?.clientId) {
    const url = new URL('/login', req.url);
    url.searchParams.set('erroZoho', 'nao_configurado');
    return NextResponse.redirect(url);
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = new URL('/api/auth/zoho/callback', req.url).toString();
  const authorizeUrl = buildZohoLoginAuthorizeUrl(config.clientId, redirectUri, state);

  const res = NextResponse.redirect(authorizeUrl);
  // Cookie de curta duração só pra validar o "state" no callback (anti-CSRF)
  // — não dá pra usar sessão porque a pessoa ainda não está logada.
  res.cookies.set('zoho_login_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });
  return res;
}
