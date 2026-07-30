'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function EmployeeShell({ nome, children }: { nome: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const isPonto = pathname.startsWith('/ponto');

  return (
    <div className="min-h-screen flex justify-center bg-muted">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-sm">
        <header className="px-5 pt-5 pb-3 border-b border-line flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            {nome
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="flex-1">
            <div className="font-bold text-[16px]">Olá, {nome.split(' ')[0]}</div>
          </div>
          <button onClick={logout} className="text-xs text-inksoft font-semibold">
            Sair
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-4">{children}</main>

        <nav className="border-t border-line bg-white flex sticky bottom-0">
          <Link
            href="/ponto"
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold ${
              isPonto ? 'text-primary' : 'text-inksoft'
            }`}
          >
            Meu Ponto
          </Link>
          <Link
            href="/chamados"
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold ${
              !isPonto ? 'text-primary' : 'text-inksoft'
            }`}
          >
            Chamados RH
          </Link>
        </nav>
      </div>
    </div>
  );
}
