'use client';

import { useEffect, useState } from 'react';
import ViewToggle, { ViewMode } from '@/components/admin/ViewToggle';
import JustificativasTable from '@/components/admin/JustificativasTable';
import JustificativasKanban from '@/components/admin/JustificativasKanban';
import JustificativaDetailModal, { JustificativaAdmin } from '@/components/admin/JustificativaDetailModal';

const UNIDADES = ['Todas', 'Barra da Tijuca', 'Itaguaí', 'Botafogo'];

export default function AdminJustificativasPage() {
  const [items, setItems] = useState<JustificativaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const [q, setQ] = useState('');
  const [view, setView] = useState<ViewMode>('tabela');
  const [selected, setSelected] = useState<JustificativaAdmin | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin-view-justificativas') as ViewMode | null;
    if (saved) setView(saved);
  }, []);

  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem('admin-view-justificativas', v);
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ unidade, status, q });
    const res = await fetch(`/api/justificativas?${params.toString()}`);
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidade, status]);

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
          <option value="EM_ANALISE">Aguardando aprovação</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REPROVADO">Reprovado</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Buscar funcionário..."
          className="input !w-52 text-xs"
        />
      </div>

      <div className="bg-white border border-line rounded-2xl p-5">
        {loading ? (
          <p className="text-sm text-inksoft py-10 text-center">Carregando...</p>
        ) : view === 'tabela' ? (
          <JustificativasTable items={items} onOpen={setSelected} />
        ) : (
          <JustificativasKanban items={items} onOpen={setSelected} />
        )}
      </div>

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
