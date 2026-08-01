import { NextResponse } from 'next/server';
import { requireNivelAdmin } from '@/lib/auth';
import { syncTudoDoRhid } from '@/lib/rhid';

export async function POST() {
  const session = await requireNivelAdmin();
  if (!session) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  try {
    const result = await syncTudoDoRhid();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Falha ao sincronizar com o RHiD.' }, { status: 502 });
  }
}
