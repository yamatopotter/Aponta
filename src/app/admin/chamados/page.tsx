'use client';

import { useEffect, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react';

import ViewToggle, { ViewMode } from '@/components/admin/ViewToggle';
import ChamadosTable from '@/components/admin/ChamadosTable';
import ChamadosKanban from '@/components/admin/ChamadosKanban';
import ChamadoDetailModal, { ChamadoAdmin } from '@/components/admin/ChamadoDetailModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUnidades } from '@/lib/useUnidades';

export default function AdminChamadosPage() {
  const unidades = useUnidades();
  const [items, setItems] = useState<ChamadoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [view, setView] = useState<ViewMode>('kanban');
  const [selected, setSelected] = useState<ChamadoAdmin | null>(null);

  const temFiltroData = Boolean(dataInicio || dataFim);

  useEffect(() => {
    const saved = localStorage.getItem('admin-view-chamados') as ViewMode | null;
    if (saved) setView(saved);
  }, []);

  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem('admin-view-chamados', v);
  }

  function limparFiltroData() {
    setDataInicio('');
    setDataFim('');
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ unidade, status, dataInicio, dataFim });
    const res = await fetch(`/api/chamados?${params.toString()}`);
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidade, status, dataInicio, dataFim]);

  const abertos = items.filter((i) => i.status !== 'CONCLUIDO').length;

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-bold text-xl">Chamados com o RH</h1>
          <p className="text-[13.5px] text-inksoft mt-1">{abertos} chamados aguardando andamento ou resposta.</p>
        </div>
        <ViewToggle value={view} onChange={changeView} />
      </div>

      <div className="flex gap-2 flex-wrap my-5">
        {unidades.map((u) => (
          <Button
            key={u}
            size="sm"
            variant={unidade === u ? 'secondary' : 'outline'}
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
            <SelectItem value="ABERTO">Aberto</SelectItem>
            <SelectItem value="ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
          </SelectContent>
        </Select>

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
          ? 'Filtro de data ativo — mostrando todos os status no período, inclusive concluídos.'
          : 'Chamados concluídos ficam ocultos por padrão. Use o filtro de data acima pra ver o histórico.'}
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
          <ChamadosTable items={items} onOpen={setSelected} />
        ) : (
          <ChamadosKanban items={items} onOpen={setSelected} />
        )}
      </Card>

      {selected && (
        <ChamadoDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
