'use client';

import { useEffect, useState } from 'react';

type Categoria = { id: string; label: string };
type Chamado = {
  id: string;
  categoria: Categoria;
  descricao: string;
  status: 'ABERTO' | 'ANDAMENTO' | 'CONCLUIDO';
  resposta: string | null;
  createdAt: string;
  anexos: { id: string; nomeArquivo: string }[];
};

const STATUS_LABEL = { ABERTO: 'Aberto', ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído' };
const STATUS_STYLE = {
  ABERTO: 'bg-warn-soft text-warn',
  ANDAMENTO: 'bg-info-soft text-info',
  CONCLUIDO: 'bg-primary-soft text-primary',
};

export default function ChamadosPage() {
  const [items, setItems] = useState<Chamado[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const [chamadosRes, categoriasRes] = await Promise.all([
      fetch('/api/chamados'),
      fetch('/api/categorias-chamado'),
    ]);
    setItems(await chamadosRes.json());
    setCategorias(await categoriasRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-lg">Chamados com o RH</h1>
        <button onClick={() => setShowForm(true)} className="text-xs font-bold bg-info text-white rounded-full px-3 py-2">
          + Novo chamado
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-inksoft">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="text-center text-inksoft text-sm py-16">
          Nenhum chamado ainda. Use "Novo chamado" para falar com o RH sobre qualquer assunto.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id} className="border border-line rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">{c.categoria.label}</span>
                <span className={`text-[10.5px] font-bold px-2 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>
                  {STATUS_LABEL[c.status]}
                </span>
              </div>
              <div className="text-xs text-inksoft">{c.descricao}</div>
              {c.anexos.length > 0 && (
                <div className="text-[11px] text-inksoft mt-1">📎 {c.anexos.length} anexo(s)</div>
              )}
              {c.resposta && (
                <div className="text-xs mt-2 bg-primary-soft text-ink rounded-lg px-2 py-1.5">
                  <b>Resposta do RH:</b> {c.resposta}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <NovoChamadoModal
          categorias={categorias}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function NovoChamadoModal({
  categorias,
  onClose,
  onCreated,
}: {
  categorias: Categoria[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? '');
  const [descricao, setDescricao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoriaId, descricao }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível enviar.');
        return;
      }
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-3">
        <h2 className="font-bold text-lg">Abrir chamado com o RH</h2>

        <label className="text-xs font-bold text-inksoft uppercase">Assunto</label>
        <select className="input" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <label className="text-xs font-bold text-inksoft uppercase">Descreva o que você precisa</label>
        <textarea className="input min-h-[90px]" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />

        <p className="text-[11.5px] text-inksoft">
          Anexos: nesta versão inicial, envie o anexo por e-mail ao RH mencionando o número do
          chamado — upload direto de arquivo é um próximo passo (ver README).
        </p>

        {error && <div className="text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-line rounded-lg py-3 text-sm font-bold">
            Cancelar
          </button>
          <button disabled={loading} className="flex-1 bg-info text-white rounded-lg py-3 text-sm font-bold disabled:opacity-60">
            {loading ? 'Enviando...' : 'Enviar chamado'}
          </button>
        </div>
      </form>
    </div>
  );
}
