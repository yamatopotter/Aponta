import { NextResponse } from 'next/server';
import { requireNivelAdmin } from '@/lib/auth';
import { testRhidConnection } from '@/lib/rhid';

export async function POST() {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  try {
    const { totalPessoas } = await testRhidConnection();
    return NextResponse.json({ ok: true, totalPessoas });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Falha ao conectar no RHiD.' }, { status: 502 });
  }
}
