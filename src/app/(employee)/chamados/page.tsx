'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Paperclip, Send, TriangleAlert, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import AnexoPicker from '@/components/AnexoPicker';
import { cn, formatBytes } from '@/lib/utils';

type Categoria = { id: string; label: string };
type Chamado = {
  id: string;
  categoria: Categoria;
  descricao: string;
  status: 'ABERTO' | 'ANDAMENTO' | 'CONCLUIDO';
  resposta: string | null;
  novaResposta: boolean;
  createdAt: string;
  anexos: { id: string; nomeArquivo: string }[];
};

type Interacao = {
  id: string;
  tipo: 'NOTA' | 'STATUS_ALTERADO' | 'MENSAGEM';
  autorTipo: 'ADMIN' | 'FUNCIONARIO';
  autorAdmin: { id: string; name: string } | null;
  autorEmployee: { id: string; nome: string } | null;
  statusNovo: Chamado['status'] | null;
  mensagem: string | null;
  criadoEm: string;
  anexos: { id: string; nomeArquivo: string; mimeType: string | null; tamanhoBytes: number | null }[];
};

const STATUS_LABEL = { ABERTO: 'Aberto', ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído' };
const STATUS_VARIANT: Record<Chamado['status'], 'warn' | 'secondary' | 'default'> = {
  ABERTO: 'warn',
  ANDAMENTO: 'secondary',
  CONCLUIDO: 'default',
};

const PAGE_SIZE = 10;

export default function ChamadosPage() {
  const [items, setItems] = useState<Chamado[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Chamado | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function load(targetPage = page) {
    setLoading(true);
    const [chamadosRes, categoriasRes] = await Promise.all([
      fetch(`/api/chamados?page=${targetPage}&pageSize=${PAGE_SIZE}`),
      fetch('/api/categorias-chamado'),
    ]);
    const data = await chamadosRes.json();
    setItems(data.items);
    setTotal(data.total);
    setPage(data.page);
    setCategorias(await categoriasRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-lg">Chamados com o RH</h1>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Novo chamado
        </Button>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-line rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
          <p className="text-center text-xs text-inksoft mt-1 animate-pulse">Carregando...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-inksoft text-sm py-16">
          Nenhum chamado ainda. Use "Novo chamado" para falar com o RH sobre qualquer assunto.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelected(c)}
                className="text-left w-full border border-line rounded-xl p-3 hover:bg-muted"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    {c.novaResposta && <span className="h-2 w-2 rounded-full bg-danger shrink-0" title="Resposta nova" />}
                    {c.categoria.label}
                  </span>
                  <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </div>
                <div className="text-xs text-inksoft">{c.descricao}</div>
                {c.anexos.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-inksoft mt-1">
                    <Paperclip className="h-3 w-3" /> {c.anexos.length} anexo(s)
                  </div>
                )}
                {c.resposta && (
                  <div className="text-xs mt-2 bg-primary-soft text-ink rounded-lg px-2 py-1.5">
                    <b>Última resposta do RH:</b> {c.resposta}
                  </div>
                )}
                <div className="text-[11px] text-secondary font-semibold mt-1.5">Ver conversa →</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pb-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </Button>
          <span className="text-xs text-inksoft">
            Página {page} de {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>
            Próxima
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {showForm && (
        <NovoChamadoModal
          categorias={categorias}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load(1);
          }}
        />
      )}

      {selected && (
        <ChamadoThreadModal
          chamado={selected}
          onClose={() => {
            setSelected(null);
            // Abrir a conversa marca como visto no servidor — recarrega a
            // lista pra sumir com o indicador de resposta nova.
            load(page);
          }}
          onUpdated={() => load(page)}
        />
      )}
    </div>
  );
}

function ChamadoThreadModal({
  chamado,
  onClose,
  onUpdated,
}: {
  chamado: Chamado;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [interacoes, setInteracoes] = useState<Interacao[] | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const res = await fetch(`/api/chamados/${chamado.id}`);
    if (res.ok) {
      const data = await res.json();
      setInteracoes(data.interacoes ?? []);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamado.id]);

  async function enviar() {
    if (!mensagem.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const formData = new FormData();
      formData.set('mensagem', mensagem);
      arquivos.forEach((f) => formData.append('anexos', f));
      const res = await fetch(`/api/chamados/${chamado.id}/mensagens`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setMensagem('');
        setArquivos([]);
        await carregar();
        onUpdated();
      } else {
        setErro(data.error ?? 'Não foi possível enviar.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 animate-in fade-in-0 duration-200">
      <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-3 max-h-[85vh] animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{chamado.categoria.label}</h2>
            <Badge variant={STATUS_VARIANT[chamado.status]} className="mt-1">
              {STATUS_LABEL[chamado.status]}
            </Badge>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-2 py-1">
          <div className="bg-muted rounded-xl p-3 text-sm">{chamado.descricao}</div>

          {interacoes === null && <p className="text-xs text-inksoft animate-pulse">Carregando...</p>}
          {interacoes?.map((i) =>
            i.tipo === 'MENSAGEM' ? (
              <div
                key={i.id}
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-[13px]',
                  i.autorTipo === 'ADMIN' ? 'self-start bg-primary-soft' : 'self-end bg-muted'
                )}
              >
                <div className="text-[11px] font-bold text-inksoft mb-0.5">
                  {i.autorTipo === 'ADMIN' ? i.autorAdmin?.name ?? 'RH' : 'Você'}
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
              <div key={i.id} className="text-[11px] text-inksoft text-center">
                Status alterado para <b>{STATUS_LABEL[i.statusNovo ?? 'ABERTO']}</b> em{' '}
                {new Date(i.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                {i.mensagem && <div className="italic">{i.mensagem}</div>}
              </div>
            )
          )}
        </div>

        {arquivos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
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

        {erro && <p className="text-[11.5px] text-danger mt-1">{erro}</p>}

        <div className="flex gap-2 mt-1">
          <Textarea
            className="min-h-[60px] flex-1"
            placeholder="Escreva uma mensagem para o RH..."
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
              variant="secondary"
              onClick={enviar}
              disabled={enviando || !mensagem.trim()}
              title="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
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
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('categoriaId', categoriaId);
      formData.set('descricao', descricao);
      arquivos.forEach((f) => formData.append('anexos', f));

      const res = await fetch('/api/chamados', { method: 'POST', body: formData });
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

        <Label>Assunto</Label>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label>Descreva o que você precisa</Label>
        <Textarea className="min-h-[90px]" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />

        <Label>Anexo (opcional)</Label>
        <AnexoPicker arquivos={arquivos} onChange={setArquivos} />

        {error && (
          <div className="flex items-center gap-2 text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button disabled={loading} variant="secondary" className="flex-1">
            {loading ? 'Enviando...' : 'Enviar chamado'}
          </Button>
        </div>
      </form>
    </div>
  );
}
