'use client';

import { useEffect, useState } from 'react';
import ViewToggle, { ViewMode } from '@/components/admin/ViewToggle';
import ChamadosTable from '@/components/admin/ChamadosTable';
import ChamadosKanban from '@/components/admin/ChamadosKanban';
import ChamadoDetailModal, { ChamadoAdmin } from '@/components/admin/ChamadoDetailModal';

const UNIDADES = ['Todas', 'Barra da Tijuca', 'Itaguaí', 'Botafogo'];

export default function AdminChamadosPage() {
  const [items, setItems] = useState<ChamadoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const [view, setView] = useState<ViewMode>('kanban');
  const [selected, setSelected] = useState<ChamadoAdmin | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin-view-chamados') as ViewMode | null;
    if (saved) setView(saved);
  }, []);

  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem('admin-view-chamados', v);
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ unidade, status });
    const res = await fetch(`/api/chamados?${params.toString()}`);
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidade, status]);

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
        {UNIDADES.map((u) => (
          <button
            key={u}
            onClick={() => setUnidade(u)}
            className={`text-xs font-bold px-3.5 py-2 rounded-full border ${
              unidade === u ? 'bg-primary border-primary text-white' : 'border-line text-inksoft bg-white'
            }`}
          >
            {u}
          </button>
        ))}
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input !w-auto text-xs">
          <option value="Todos">Todos os status</option>
          <option value="ABERTO">Aberto</option>
          <option value="ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDO">Concluído</option>
        </select>
      </div>

      <div className="bg-white border border-line rounded-2xl p-5">
        {loading ? (
          <p className="text-sm text-inksoft py-10 text-center">Carregando...</p>
        ) : view === 'tabela' ? (
          <ChamadosTable items={items} onOpen={setSelected} />
        ) : (
          <ChamadosKanban items={items} onOpen={setSelected} />
        )}
      </div>

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
