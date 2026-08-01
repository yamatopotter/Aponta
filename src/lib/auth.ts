import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'evora_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 10; // 10h

export type NivelAdmin = 'RH' | 'ADMIN';

export type SessionPayload =
  | { role: 'ADMIN'; adminId: string; username: string; name: string; nivel: NivelAdmin }
  | { role: 'EMPLOYEE'; employeeId: string; cpf: string; nome: string; unidade: string | null };

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET ausente no .env — gere com `openssl rand -base64 32`.');
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
