'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin/justificativas', label: 'Justificativas' },
  { href: '/admin/chamados', label: 'Chamados RH' },
  { href: '/admin/configuracoes/zoho', label: 'Configurações · Zoho' },
];

export default function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-[230px] shrink-0 bg-sidebar text-white flex flex-col p-5 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 pb-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-extrabold text-sm">
            RH
          </div>
          <div>
            <div className="font-bold text-[14.5px]">Evora Farma</div>
            <div className="text-[10.5px] text-white/55">Painel de gestão de ponto</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2.5 rounded-lg text-[13.5px] font-semibold ${
                pathname.startsWith(item.href) ? 'bg-white/10 text-white' : 'text-white/70'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="text-[12.5px] font-semibold">{name}</div>
          <button onClick={logout} className="text-[11.5px] text-white/60 mt-1">
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
