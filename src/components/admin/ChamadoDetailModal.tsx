'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, History, Send, X } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatBytes } from '@/lib/utils';

export type ChamadoAdmin = {
  id: string;
  categoria: { label: string };
  descricao: string;
  status: 'ABERTO' | 'ANDAMENTO' | 'CONCLUIDO';
  resposta: string | null;
  respondidoPor: { id: string; name: string } | null;
  respondidoEm: string | null;
  ultimaMensagem: string | null;
  aguardandoResposta: boolean;
  createdAt: string;
  employee: { nome: string; cargo: string | null; unidade: string | null };
  anexos: { id: string; nomeArquivo: string }[];
};

type Interacao = {
  id: string;
  tipo: 'NOTA' | 'STATUS_ALTERADO' | 'MENSAGEM';
  autorTipo: 'ADMIN' | 'FUNCIONARIO';
  autorAdmin: { id: string; name: string } | null;
  autorEmployee: { id: string; nome: string } | null;
  statusNovo: ChamadoAdmin['status'] | null;
  mensagem: string | null;
  criadoEm: string;
  anexos: { id: string; nomeArquivo: string; mimeType: string | null; tamanhoBytes: number | null }[];
};

const STATUS_LABEL = { ABERTO: 'Aberto', ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído' };

function autorNome(i: Interacao) {
  return i.autorTipo === 'ADMIN' ? i.autorAdmin?.name ?? 'RH' : i.autorEmployee?.nome ?? 'Funcionário';
}

export default function ChamadoDetailModal({
  item,
  onClose,
  onUpdated,
}: {
  item: ChamadoAdmin;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(item.status);
  const [mensagem, setMensagem] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingMensagem, setLoadingMensagem] = useState(false);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const [interacoes, setInteracoes] = useState<Interacao[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function carregarHistorico() {
    const res = await fetch(`/api/chamados/${item.id}`);
    if (res.ok) {
      const data = await res.json();
      setInteracoes(data.interacoes ?? []);
      setStatus(data.status);
    }
  }

  useEffect(() => {
    carregarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function mudarStatus(novoStatus: 'ANDAMENTO' | 'CONCLUIDO' | 'ABERTO') {
    setLoadingStatus(true);
    try {
      const res = await fetch(`/api/chamados/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (res.ok) {
        await carregarHistorico();
        onUpdated();
      }
    } finally {
      setLoadingStatus(false);
    }
  }

  async function enviarMensagem() {
    if (!mensagem.trim()) return;
    setLoadingMensagem(true);
    setErroMensagem(null);
    try {
      const formData = new FormData();
      formData.set('mensagem', mensagem);
      arquivos.forEach((f) => formData.append('anexos', f));
      const res = await fetch(`/api/chamados/${item.id}/mensagens`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setMensagem('');
        setArquivos([]);
        await carregarHistorico();
        onUpdated();
      } else {
        setErroMensagem(data.error ?? 'Não foi possível enviar.');
      }
    } finally {
      setLoadingMensagem(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader className="flex-row items-start gap-3 mb-4 space-y-0">
          <Avatar>
            <AvatarFallback>{item.employee.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold">{item.employee.nome}</div>
            <div className="text-xs text-inksoft">
              {item.employee.cargo} · {item.employee.unidade}
            </div>
          </div>
        </DialogHeader>

        <Label>Assunto</Label>
        <Box>
          <b>{item.categoria.label}</b>
        </Box>

        <Label>Mensagem original</Label>
        <Box>
          {item.descricao}
          {item.anexos.map((a) => (
            <div key={a.id} className="flex items-center gap-1 mt-1 text-xs text-secondary">
              <Paperclip className="h-3 w-3" /> {a.nomeArquivo}
            </div>
          ))}
        </Box>

        <Label>Conversa</Label>
        <div className="flex flex-col gap-2 mb-1">
          {interacoes === null && <p className="text-xs text-inksoft">Carregando...</p>}
          {interacoes?.length === 0 && <p className="text-xs text-inksoft">Nenhuma mensagem ainda.</p>}
          {interacoes?.map((i) =>
            i.tipo === 'MENSAGEM' ? (
              <div
                key={i.id}
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-[13px]',
                  i.autorTipo === 'ADMIN' ? 'self-start bg-muted' : 'self-end bg-primary-soft'
                )}
              >
                <div className="text-[11px] font-bold text-inksoft mb-0.5">
                  {autorNome(i)} · {i.autorTipo === 'ADMIN' ? 'RH' : 'Funcionário'}
                </div>
                <div>{i.mensagem}</div>
                {i.anexos.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    {i.anexos.map((a) => (
                      <a
                        key={a.id}
                        href={`/api/anexos/${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11.5px] text-secondary underline underline-offset-2"
                      >
                        <Paperclip className="h-3 w-3 shrink-0" />
                        {a.nomeArquivo}
                        {a.tamanhoBytes && <span className="text-inksoft">({formatBytes(a.tamanhoBytes)})</span>}
                      </a>
                    ))}
                  </div>
                )}
                <div className="text-[10.5px] text-inksoft mt-1">
                  {new Date(i.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ) : (
              <div key={i.id} className="flex items-start gap-2 text-xs">
                <History className="h-3.5 w-3.5 text-inksoft shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{autorNome(i)}</span>{' '}
                  <span className="text-inksoft">
                    marcou como <b>{STATUS_LABEL[i.statusNovo ?? 'ABERTO']}</b> em{' '}
                    {new Date(i.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {i.mensagem && <div className="mt-0.5 text-inksoft italic">{i.mensagem}</div>}
                </div>
              </div>
            )
          )}
        </div>

        {arquivos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {arquivos.map((f, idx) => (
              <span
                key={`${f.name}-${idx}`}
                className="flex items-center gap-1 text-[11px] bg-muted rounded-full pl-2 pr-1 py-0.5"
              >
                <Paperclip className="h-3 w-3" /> {f.name}
                <button
                  type="button"
                  onClick={() => setArquivos((prev) => prev.filter((_, i) => i !== idx))}
                  className="hover:bg-white rounded-full p-0.5"
                  title="Remover anexo"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {erroMensagem && <p className="text-[11.5px] text-danger mt-1.5">{erroMensagem}</p>}

        <div className="flex gap-2 mt-2">
          <Textarea
            className="min-h-[60px] flex-1"
            placeholder={`Escreva uma mensagem para ${item.employee.nome.split(' ')[0]}...`}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
          <div className="flex flex-col gap-1.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setArquivos((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar arquivo"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={enviarMensagem}
              disabled={loadingMensagem || !mensagem.trim()}
              title="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Label>Status</Label>
        <div className="flex gap-2">
          {status !== 'ANDAMENTO' && status !== 'CONCLUIDO' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => mudarStatus('ANDAMENTO')}
              disabled={loadingStatus}
              className="flex-1 border-secondary/40 text-secondary hover:bg-secondary-soft"
            >
              Marcar em andamento
            </Button>
          )}
          {status !== 'CONCLUIDO' && (
            <Button size="sm" onClick={() => mudarStatus('CONCLUIDO')} disabled={loadingStatus} className="flex-1">
              Marcar como concluído
            </Button>
          )}
          {status === 'CONCLUIDO' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => mudarStatus('ANDAMENTO')}
              disabled={loadingStatus}
              className="flex-1 border-secondary/40 text-secondary hover:bg-secondary-soft"
            >
              Reabrir
            </Button>
          )}
        </div>
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
