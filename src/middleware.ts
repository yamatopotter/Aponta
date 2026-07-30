import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'evora_session';

async function readSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  const isAdminRoute = pathname.startsWith('/admin');
  const isEmployeeRoute = pathname.startsWith('/ponto') || pathname.startsWith('/chamados');

  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?next=' + pathname, req.url));
  }
  if (isEmployeeRoute && session?.role !== 'EMPLOYEE') {
    return NextResponse.redirect(new URL('/login?next=' + pathname, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ponto/:path*', '/chamados/:path*'],
};
