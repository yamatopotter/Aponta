'use client';

import { useState } from 'react';

export type ChamadoAdmin = {
  id: string;
  categoria: { label: string };
  descricao: string;
  status: 'ABERTO' | 'ANDAMENTO' | 'CONCLUIDO';
  resposta: string | null;
  createdAt: string;
  employee: { nome: string; cargo: string | null; unidade: string | null };
  anexos: { id: string; nomeArquivo: string }[];
};

export default function ChamadoDetailModal({
  item,
  onClose,
  onUpdated,
}: {
  item: ChamadoAdmin;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [resposta, setResposta] = useState(item.resposta ?? '');
  const [loading, setLoading] = useState(false);

  async function atualizar(status: 'ANDAMENTO' | 'CONCLUIDO') {
    setLoading(true);
    try {
      const res = await fetch(`/api/chamados/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resposta }),
      });
      if (res.ok) onUpdated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 max-h-[88vh] overflow-y-auto">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
            {item.employee.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="font-bold">{item.employee.nome}</div>
            <div className="text-xs text-inksoft">
              {item.employee.cargo} · {item.employee.unidade}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-line text-inksoft">
            ✕
          </button>
        </div>

        <Label>Assunto</Label>
        <Box>
          <b>{item.categoria.label}</b>
        </Box>

        <Label>Mensagem</Label>
        <Box>
          {item.descricao}
          {item.anexos.map((a) => (
            <div key={a.id} className="mt-1 text-xs text-info">
              📎 {a.nomeArquivo}
            </div>
          ))}
        </Box>

        {item.status === 'CONCLUIDO' ? (
          <>
            <Label>Resposta enviada</Label>
            <Box>{item.resposta}</Box>
          </>
        ) : (
          <>
            <Label>Responder</Label>
            <textarea
              className="input min-h-[80px]"
              placeholder={`Escreva a resposta para ${item.employee.nome.split(' ')[0]}...`}
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => atualizar('ANDAMENTO')}
                disabled={loading}
                className="flex-1 border border-info/40 text-info rounded-xl py-3 text-sm font-bold disabled:opacity-60"
              >
                Marcar em andamento
              </button>
              <button
                onClick={() => atualizar('CONCLUIDO')}
                disabled={loading || !resposta}
                className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60"
              >
                Responder e concluir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold text-inksoft uppercase tracking-wide mt-4 mb-1.5">{children}</div>;
}
function Box({ children }: { children: React.ReactNode }) {
  return <div className="bg-muted rounded-xl p-3.5 text-sm leading-relaxed">{children}</div>;
}
