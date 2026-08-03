import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'evora_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 10; // 10h

// Cookie "Secure" só faz sentido (e só é aceito pelo navegador) numa conexão
// HTTPS de verdade — não basta checar NODE_ENV, porque o primeiro acesso em
// produção costuma ser via HTTP direto (IP do servidor), antes de configurar
// o reverse proxy com TLS. Sem isso, o navegador descarta o cookie
// silenciosamente e a sessão nunca persiste (login "funciona" mas a
// próxima requisição vem sem cookie, como se não tivesse logado).
export function isSecureRequest(req: NextRequest) {
  return req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
}

// Origem pública real da requisição — não dá pra confiar em req.url/req.nextUrl
// sozinhos atrás de um reverse proxy: vários deles (ex. Apache sem
// ProxyPreserveHost) trocam o header Host pelo endereço interno do container
// (localhost:3000) antes de repassar pro Next.js. X-Forwarded-Host, por outro
// lado, é enviado pela imensa maioria dos proxies mesmo nesse caso — usado
// para montar o redirect_uri do OAuth do Zoho, que precisa bater com o
// domínio real cadastrado no Zoho API Console.
export function getPublicOrigin(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host;
  return `${isSecureRequest(req) ? 'https' : 'http'}://${host}`;
}

export type NivelAdmin = 'RH' | 'ADMIN';

export type SessionPayload =
  | { role: 'ADMIN'; adminId: string; username: string; name: string; nivel: NivelAdmin }
  | { role: 'EMPLOYEE'; employeeId: string; cpf: string; nome: string; unidade: string | null };

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET ausente no .env — gere com `openssl rand -base64 32`.');
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload, req: NextRequest) {
  const token = await new SignJWT({ ...payload } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().delete(COOKIE_NAME);
}

// Helpers de conveniência para usar em Server Components / route handlers
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}

// Nível ADMIN (não RH) — usado nas rotas de Configurações e de gestão de
// administradores. Ver enum NivelAdmin no schema e a explicação no README.
export async function requireNivelAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN' || session.nivel !== 'ADMIN') return null;
  return session;
}

export async function requireEmployee() {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') return null;
  return session;
}
