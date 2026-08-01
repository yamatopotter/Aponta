import { NextRequest, NextResponse } from 'next/server';
import { exchangeZohoCode } from '@/lib/zoho';

// Sem cookies()/headers() explícitos, o Next tenta pré-renderizar essa rota
// como estática no build — e falha, porque ela consulta o banco (via
// exchangeZohoCode). Precisa ficar sempre dinâmica (roda por request).
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  const settingsUrl = new URL('/admin/configuracoes', req.url);
  settingsUrl.searchParams.set('tab', 'zoho');

  if (error) {
    settingsUrl.searchParams.set('erro', error);
    return NextResponse.redirect(settingsUrl);
  }
  if (!code) {
    settingsUrl.searchParams.set('erro', 'codigo_ausente');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    await exchangeZohoCode(code);
    settingsUrl.searchParams.set('conectado', '1');
  } catch (e) {
    settingsUrl.searchParams.set('erro', e instanceof Error ? e.message : 'falha_desconhecida');
  }

  return NextResponse.redirect(settingsUrl);
}
