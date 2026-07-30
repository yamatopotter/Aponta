'use client';

import { useEffect, useState } from 'react';

type Justificativa = {
  id: string;
  dataOcorrencia: string;
  tipo: 'FALTA' | 'ATRASO' | 'SEM_SAIDA' | 'AJUSTE';
  motivo: string;
  comentario: string | null;
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REPROVADO';
  isAjuste: boolean;
  motivoReprovacao: string | null;
};

const TIPO_LABEL: Record<Justificativa['tipo'], string> = {
  FALTA: 'Falta',
  ATRASO: 'Atraso',
  SEM_SAIDA: 'Sem saída',
  AJUSTE: 'Ajuste',
};

const STATUS_STYLE: Record<Justificativa['status'], string> = {
  PENDENTE: 'bg-danger-soft text-danger',
  EM_ANALISE: 'bg-info-soft text-info',
  APROVADO: 'bg-primary-soft text-primary',
  REPROVADO: 'bg-danger-soft text-danger',
};

const STATUS_LABEL: Record<Justificativa['status'], string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em análise',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
};

export default function PontoPage() {
  const [items, setItems] = useState<Justificativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/justificativas');
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-lg">Minha folha de ponto</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-xs font-bold bg-primary text-white rounded-full px-3 py-2"
        >
          + Justificar / ajustar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-inksoft">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="text-center text-inksoft text-sm py-16">
          Nenhuma justificativa enviada ainda. Use o botão acima para justificar uma falta, um
          atraso ou pedir um ajuste em qualquer data.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((j) => (
            <li key={j.id} className="border border-line rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-inksoft">
                  {new Date(j.dataOcorrencia).toLocaleDateString('pt-BR')} · {TIPO_LABEL[j.tipo]}
                </span>
                <span className={`text-[10.5px] font-bold px-2 py-1 rounded-full ${STATUS_STYLE[j.status]}`}>
                  {STATUS_LABEL[j.status]}
                </span>
              </div>
              <div className="text-sm font-semibold">{j.motivo}</div>
              {j.comentario && <div className="text-xs text-inksoft mt-1">{j.comentario}</div>}
              {j.status === 'REPROVADO' && j.motivoReprovacao && (
                <div className="text-xs text-danger mt-2 bg-danger-soft rounded-lg px-2 py-1.5">
                  Motivo da reprovação: {j.motivoReprovacao}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <NovaJustificativaModal
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

function NovaJustificativaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [dataOcorrencia, setDataOcorrencia] = useState('');
  const [tipo, setTipo] = useState<Justificativa['tipo']>('FALTA');
  const [motivo, setMotivo] = useState('');
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/justificativas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataOcorrencia, tipo, motivo, comentario, isAjuste: false }),
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
        <h2 className="font-bold text-lg">Justificar ou ajustar um dia</h2>

        <label className="text-xs font-bold text-inksoft uppercase">Data</label>
        <input className="input" type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} required />

        <label className="text-xs font-bold text-inksoft uppercase">Tipo</label>
        <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as Justificativa['tipo'])}>
          <option value="FALTA">Falta</option>
          <option value="ATRASO">Atraso</option>
          <option value="SEM_SAIDA">Sem marcação de saída</option>
          <option value="AJUSTE">Ajuste em dia já preenchido</option>
        </select>

        <label className="text-xs font-bold text-inksoft uppercase">Motivo</label>
        <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Atestado médico" required />

        <label className="text-xs font-bold text-inksoft uppercase">Comentário (opcional)</label>
        <textarea className="input min-h-[70px]" value={comentario} onChange={(e) => setComentario(e.target.value)} />

        {error && <div className="text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-line rounded-lg py-3 text-sm font-bold">
            Cancelar
          </button>
          <button disabled={loading} className="flex-1 bg-primary text-white rounded-lg py-3 text-sm font-bold disabled:opacity-60">
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
