'use client';

import { useState } from 'react';

export type JustificativaAdmin = {
  id: string;
  dataOcorrencia: string;
  tipo: 'FALTA' | 'ATRASO' | 'SEM_SAIDA' | 'AJUSTE';
  motivo: string;
  comentario: string | null;
  cid: string | null;
  gestorNome: string | null;
  horaEntradaCorreta: string | null;
  horaSaidaCorreta: string | null;
  issueDetectado: string | null;
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REPROVADO';
  employee: { nome: string; cargo: string | null; unidade: string | null };
  anexos: { id: string; nomeArquivo: string; url: string }[];
};

const TIPO_LABEL = { FALTA: 'Falta', ATRASO: 'Atraso', SEM_SAIDA: 'Sem saída', AJUSTE: 'Ajuste' };

export default function JustificativaDetailModal({
  item,
  onClose,
  onDecided,
}: {
  item: JustificativaAdmin;
  onClose: () => void;
  onDecided: () => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [loading, setLoading] = useState(false);
  const podeDecidir = item.status === 'EM_ANALISE' || item.status === 'PENDENTE';

  async function decidir(decisao: 'APROVADO' | 'REPROVADO') {
    setLoading(true);
    try {
      const res = await fetch(`/api/justificativas/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisao, motivoReprovacao: decisao === 'REPROVADO' ? motivoReprovacao : undefined }),
      });
      if (res.ok) onDecided();
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

        <Label>Ocorrência</Label>
        <Box>
          <b>{TIPO_LABEL[item.tipo]}</b> — {new Date(item.dataOcorrencia).toLocaleDateString('pt-BR')}
          {item.issueDetectado && <div className="mt-1">{item.issueDetectado}</div>}
        </Box>

        <Label>Motivo informado</Label>
        <Box>
          <b>{item.motivo}</b>
          {item.comentario && <div className="mt-2">"{item.comentario}"</div>}
          {item.cid && <div className="mt-1 text-xs">CID: {item.cid}</div>}
          {item.gestorNome && <div className="mt-1 text-xs">Gestor: {item.gestorNome}</div>}
          {(item.horaEntradaCorreta || item.horaSaidaCorreta) && (
            <div className="mt-1 text-xs">
              Horário correto: {item.horaEntradaCorreta ?? '—'} – {item.horaSaidaCorreta ?? '—'}
            </div>
          )}
          {item.anexos.map((a) => (
            <div key={a.id} className="mt-1 text-xs text-info">
              📎 {a.nomeArquivo}
            </div>
          ))}
        </Box>

        {podeDecidir ? (
          <>
            {!showReject ? (
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowReject(true)}
                  className="flex-1 border border-danger/40 text-danger rounded-xl py-3 text-sm font-bold"
                >
                  Reprovar
                </button>
                <button
                  onClick={() => decidir('APROVADO')}
                  disabled={loading}
                  className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60"
                >
                  Aprovar
                </button>
              </div>
            ) : (
              <div className="mt-5 bg-danger-soft rounded-xl p-3">
                <textarea
                  className="input min-h-[70px] bg-white"
                  placeholder="Explique por que está reprovando"
                  value={motivoReprovacao}
                  onChange={(e) => setMotivoReprovacao(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setShowReject(false)} className="flex-1 border border-line bg-white rounded-lg py-2 text-xs font-bold">
                    Cancelar
                  </button>
                  <button
                    onClick={() => decidir('REPROVADO')}
                    disabled={loading || !motivoReprovacao}
                    className="flex-1 bg-danger text-white rounded-lg py-2 text-xs font-bold disabled:opacity-60"
                  >
                    Confirmar reprovação
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Box>
            Status atual: <b>{item.status === 'APROVADO' ? 'Aprovado' : 'Reprovado'}</b>
          </Box>
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
