'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, LayoutDashboard, Menu, MessagesSquare, Settings, Shield, Signature, Users, LogOut, X } from 'lucide-react';

import LogoMark from '@/components/LogoMark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ATENDIMENTO = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/justificativas', label: 'Justificativas', icon: ClipboardList },
  { href: '/admin/chamados', label: 'Chamados RH', icon: MessagesSquare },
  { href: '/admin/folha', label: 'Folha de Ponto', icon: Signature },
  { href: '/admin/funcionarios', label: 'Funcionários', icon: Users },
];

// Só nível ADMIN — ver enum NivelAdmin e requireNivelAdmin() em src/lib/auth.ts.
const NAV_ADMIN = [
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/admin/administradores', label: 'Administradores', icon: Shield },
];

type Pendencias = { justificativasPendentes: number; chamadosAbertos: number };

const BADGE_POR_HREF: Record<string, keyof Pendencias> = {
  '/admin/justificativas': 'justificativasPendentes',
  '/admin/chamados': 'chamadosAbertos',
};

export default function AdminShell({
  name,
  nivel,
  children,
}: {
  name: string;
  nivel: 'RH' | 'ADMIN';
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendencias, setPendencias] = useState<Pendencias | null>(null);

  const nav = nivel === 'ADMIN' ? [...NAV_ATENDIMENTO, ...NAV_ADMIN] : NAV_ATENDIMENTO;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    async function loadPendencias() {
      const res = await fetch('/api/admin/pendencias');
      if (!res.ok || cancelled) return;
      setPendencias(await res.json());
    }
    loadPendencias();
    // Atualiza periodicamente pra refletir aprovações/respostas dadas em
    // outra aba ou por outro admin, sem precisar recarregar a página.
    const interval = setInterval(loadPendencias, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:flex">
      <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 bg-sidebar text-white px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="admin-sidebar"
          className="p-2 -ml-2 rounded-lg hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center p-1.5 shrink-0">
          <LogoMark className="w-full h-full" />
        </div>
        <div className="font-bold text-[14.5px]">Aponta</div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        className={cn(
          'w-[230px] shrink-0 bg-sidebar text-white flex flex-col p-5',
          'fixed inset-y-0 left-0 z-40 -translate-x-full transition-transform duration-200 ease-out',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open && 'translate-x-0'
        )}
      >
        <div className="flex items-center gap-2.5 pb-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center p-1.5">
            <LogoMark className="w-full h-full" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[14.5px]">Aponta</div>
            <div className="text-[10.5px] text-white/55">Painel de gestão de ponto</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 -mr-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const badgeKey = BADGE_POR_HREF[item.href];
            const count = badgeKey ? pendencias?.[badgeKey] ?? 0 : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13.5px] font-semibold',
                  pathname.startsWith(item.href) ? 'bg-white/10 text-white' : 'text-white/70'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="min-w-[19px] h-[19px] px-1 flex items-center justify-center rounded-full bg-danger text-white text-[10.5px] font-bold leading-none shrink-0">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="text-[12.5px] font-semibold">{name}</div>
          <div className="text-[10.5px] text-white/70">{nivel === 'ADMIN' ? 'Administrador' : 'RH'}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="mt-1 h-auto px-0 py-0 text-[11.5px] font-normal text-white/60 hover:bg-transparent hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 lg:p-8">{children}</main>
    </div>
  );
}
