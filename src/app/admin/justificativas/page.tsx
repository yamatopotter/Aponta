'use client';

import { useEffect, useState } from 'react';
import { CalendarRange, Search, X } from 'lucide-react';

import ViewToggle, { ViewMode } from '@/components/admin/ViewToggle';
import JustificativasTable from '@/components/admin/JustificativasTable';
import JustificativasKanban from '@/components/admin/JustificativasKanban';
import JustificativaDetailModal, { JustificativaAdmin } from '@/components/admin/JustificativaDetailModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUnidades } from '@/lib/useUnidades';

export default function AdminJustificativasPage() {
  const unidades = useUnidades();
  const [items, setItems] = useState<JustificativaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const [q, setQ] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [view, setView] = useState<ViewMode>('tabela');
  const [selected, setSelected] = useState<JustificativaAdmin | null>(null);

  const temFiltroData = Boolean(dataInicio || dataFim);

  useEffect(() => {
    const saved = localStorage.getItem('admin-view-justificativas') as ViewMode | null;
    if (saved) setView(saved);
  }, []);

  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem('admin-view-justificativas', v);
  }

  function limparFiltroData() {
    setDataInicio('');
    setDataFim('');
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ unidade, status, q, dataInicio, dataFim });
    const res = await fetch(`/api/justificativas?${params.toString()}`);
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidade, status, dataInicio, dataFim]);

  const pendentes = items.filter((i) => i.status === 'PENDENTE' || i.status === 'EM_ANALISE').length;

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-bold text-xl">Justificativas de ponto</h1>
          <p className="text-[13.5px] text-inksoft mt-1">
            {pendentes} aguardando decisão. Aprovar/reprovar aqui não lança automaticamente no RHiD —
            o lançamento final continua manual (ver README).
          </p>
        </div>
        <ViewToggle value={view} onChange={changeView} />
      </div>

      <div className="flex gap-2 flex-wrap my-5">
        {unidades.map((u) => (
          <Button
            key={u}
            size="sm"
            variant={unidade === u ? 'default' : 'outline'}
            className={cn('rounded-full', unidade !== u && 'bg-white')}
            onClick={() => setUnidade(u)}
          >
            {u}
          </Button>
        ))}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-auto h-9 text-xs gap-2" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="EM_ANALISE">Aguardando aprovação</SelectItem>
            <SelectItem value="APROVADO">Aprovado</SelectItem>
            <SelectItem value="REPROVADO">Reprovado</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-inksoft" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Buscar funcionário..."
            className="h-9 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 text-inksoft shrink-0" />
          <Input
            type="date"
            aria-label="De"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-9 w-[142px] text-xs"
          />
          <span className="text-xs text-inksoft">até</span>
          <Input
            type="date"
            aria-label="Até"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-9 w-[142px] text-xs"
          />
          {temFiltroData && (
            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={limparFiltroData} title="Limpar filtro de data">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-inksoft -mt-3 mb-4">
        {temFiltroData
          ? 'Filtro de data ativo — mostrando todos os status no período, inclusive aprovadas/reprovadas.'
          : 'Justificativas já decididas (aprovadas/reprovadas) ficam ocultas por padrão. Use o filtro de data acima pra ver o histórico.'}
      </p>

      <Card className="p-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : view === 'tabela' ? (
          <JustificativasTable items={items} onOpen={setSelected} />
        ) : (
          <JustificativasKanban items={items} onOpen={setSelected} />
        )}
      </Card>

      {selected && (
        <JustificativaDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onDecided={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
