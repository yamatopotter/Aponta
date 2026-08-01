'use client';

import { useState } from 'react';
import { Paperclip } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  decididoPor: { id: string; name: string } | null;
  decididoEm: string | null;
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader className="flex-row items-start gap-3 mb-4 space-y-0">
          <Avatar>
            <AvatarFallback>
              {item.employee.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold">{item.employee.nome}</div>
            <div className="text-xs text-inksoft">
              {item.employee.cargo} · {item.employee.unidade}
            </div>
          </div>
        </DialogHeader>

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
            <div key={a.id} className="flex items-center gap-1 mt-1 text-xs text-info">
              <Paperclip className="h-3 w-3" /> {a.nomeArquivo}
            </div>
          ))}
        </Box>

        {podeDecidir ? (
          <>
            {!showReject ? (
              <div className="flex gap-3 mt-5">
                <Button variant="outline" onClick={() => setShowReject(true)} className="flex-1 border-danger/40 text-danger hover:bg-danger-soft">
                  Reprovar
                </Button>
                <Button onClick={() => decidir('APROVADO')} disabled={loading} className="flex-1">
                  Aprovar
                </Button>
              </div>
            ) : (
              <div className="mt-5 bg-danger-soft rounded-xl p-3">
                <Textarea
                  className="min-h-[70px]"
                  placeholder="Explique por que está reprovando"
                  value={motivoReprovacao}
                  onChange={(e) => setMotivoReprovacao(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowReject(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => decidir('REPROVADO')}
                    disabled={loading || !motivoReprovacao}
                    className="flex-1"
                  >
                    Confirmar reprovação
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Box>
            Status atual: <b>{item.status === 'APROVADO' ? 'Aprovado' : 'Reprovado'}</b>
            {item.decididoPor && (
              <div className="mt-2 text-xs text-inksoft">
                Decidido por <b>{item.decididoPor.name}</b>
                {item.decididoEm &&
                  ` em ${new Date(item.decididoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`}
              </div>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold text-inksoft uppercase tracking-wide mt-4 mb-1.5">{children}</div>;
}
function Box({ children }: { children: React.ReactNode }) {
  return <div className="bg-muted rounded-xl p-3.5 text-sm leading-relaxed">{children}</div>;
}
