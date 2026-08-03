import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'evora_session';

// Duplicado de src/lib/auth.ts (não dá pra importar de lá — aquele módulo
// puxa next/headers, que não roda no runtime Edge do middleware). Sem isso,
// atrás de um reverse proxy que reescreve o Host (ex. nginx sem
// proxy_set_header Host $host;), req.url resolve pro endereço interno do
// container (localhost:3000) e todo redirect de "faça login" mandava o
// navegador pra lá em vez do domínio real.
function getPublicOrigin(req: NextRequest) {
  const secure = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host;
  return `${secure ? 'https' : 'http'}://${host}`;
}

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

  const origin = getPublicOrigin(req);

  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?next=' + pathname, origin));
  }
  if (isRotaNivelAdmin && session?.nivel !== 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/justificativas', origin));
  }
  if (isEmployeeRoute && session?.role !== 'EMPLOYEE') {
    return NextResponse.redirect(new URL('/login?next=' + pathname, origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ponto/:path*', '/chamados/:path*'],
};
