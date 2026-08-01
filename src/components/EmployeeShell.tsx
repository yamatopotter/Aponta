'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, MessagesSquare, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function EmployeeShell({ nome, children }: { nome: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendencias, setPendencias] = useState<{ chamadosComRespostaNova: number; justificativasComDecisaoNova: number } | null>(
    null
  );

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const isPonto = pathname.startsWith('/ponto');

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      const res = await fetch('/api/employee/pendencias');
      if (!res.ok || cancelled) return;
      setPendencias(await res.json());
    }
    carregar();
    // Refaz ao trocar de aba (visitar a tela marca como visto — o badge
    // precisa sumir) e periodicamente, pra pegar resposta/decisão nova sem
    // precisar recarregar a página.
    const interval = setInterval(carregar, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  return (
    <div className="min-h-screen flex justify-center bg-muted">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-sm">
        <header className="px-5 pt-5 pb-3 border-b border-line flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {nome
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold text-[16px]">Olá, {nome.split(' ')[0]}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-inksoft font-semibold">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </header>

        <main key={pathname} className="flex-1 overflow-y-auto pb-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
          {children}
        </main>

        <nav className="border-t border-line bg-white flex sticky bottom-0">
          <span
            className={cn(
              'absolute top-0 h-[2px] w-1/2 bg-primary transition-transform duration-300 ease-out',
              !isPonto && 'bg-secondary'
            )}
            style={{ transform: isPonto ? 'translateX(0%)' : 'translateX(100%)' }}
          />
          <Link
            href="/ponto"
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors duration-200'
            )}
          >
            <span className="relative">
              <Clock className={cn('h-5 w-5 transition-transform duration-200', isPonto ? 'text-primary scale-110' : 'text-inksoft')} />
              {!!pendencias?.justificativasComDecisaoNova && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full bg-danger text-white text-[9.5px] font-bold leading-none">
                  {pendencias.justificativasComDecisaoNova > 9 ? '9+' : pendencias.justificativasComDecisaoNova}
                </span>
              )}
            </span>
            <span className={isPonto ? 'text-primary' : 'text-inksoft'}>Meu Ponto</span>
          </Link>
          <Link
            href="/chamados"
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors duration-200'
            )}
          >
            <span className="relative">
              <MessagesSquare className={cn('h-5 w-5 transition-transform duration-200', !isPonto ? 'text-secondary scale-110' : 'text-inksoft')} />
              {!!pendencias?.chamadosComRespostaNova && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full bg-danger text-white text-[9.5px] font-bold leading-none">
                  {pendencias.chamadosComRespostaNova > 9 ? '9+' : pendencias.chamadosComRespostaNova}
                </span>
              )}
            </span>
            <span className={!isPonto ? 'text-secondary' : 'text-inksoft'}>Chamados RH</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
