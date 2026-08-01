import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'evora_session';

async function readSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string; nivel?: string };
  } catch {
    return null;
  }
}

// Rotas de admin que só o nível ADMIN acessa (RH fica de fora — só
// atendimento). Ver enum NivelAdmin e requireNivelAdmin() em src/lib/auth.ts.
const ROTAS_NIVEL_ADMIN = ['/admin/configuracoes', '/admin/administradores'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  const isAdminRoute = pathname.startsWith('/admin');
  const isEmployeeRoute = pathname.startsWith('/ponto') || pathname.startsWith('/chamados');
  const isRotaNivelAdmin = ROTAS_NIVEL_ADMIN.some((r) => pathname.startsWith(r));

  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?next=' + pathname, req.url));
  }
  if (isRotaNivelAdmin && session?.nivel !== 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/justificativas', req.url));
  }
  if (isEmployeeRoute && session?.role !== 'EMPLOYEE') {
    return NextResponse.redirect(new URL('/login?next=' + pathname, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ponto/:path*', '/chamados/:path*'],
};
