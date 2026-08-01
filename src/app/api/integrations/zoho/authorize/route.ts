import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireNivelAdmin } from '@/lib/auth';
import { buildZohoAuthorizeUrl } from '@/lib/zoho';

export async function GET() {
  const session = await requireNivelAdmin();
  if (!session) {
    return NextResponse.redirect(new URL('/login', process.env.ZOHO_REDIRECT_URI ?? 'http://localhost:3000'));
  }

  const config = await prisma.zohoConfig.findUnique({ where: { id: 1 } });
  if (!config?.clientId || !config.redirectUri) {
    return NextResponse.json(
      { error: 'Preencha e salve o Client ID / Redirect URI antes de conectar.' },
      { status: 400 }
    );
  }

  // state simples anti-CSRF; em produção, guarde numa sessão/cookie curto e valide no callback.
  const state = crypto.randomBytes(16).toString('hex');

  const url = buildZohoAuthorizeUrl(
    config.clientId,
    config.redirectUri,
    config.scope ?? 'ZohoMail.messages.CREATE,ZohoMail.accounts.READ',
    state
  );

  return NextResponse.redirect(url);
}
