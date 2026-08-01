'use client';

import { useEffect, useState } from 'react';
import { Plus, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import DivergenciasFolha from '@/components/DivergenciasFolha';
import FolhaAssinatura from '@/components/FolhaAssinatura';

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

const STATUS_VARIANT: Record<Justificativa['status'], 'warn' | 'info' | 'default' | 'destructive'> = {
  PENDENTE: 'warn',
  EM_ANALISE: 'info',
  APROVADO: 'default',
  REPROVADO: 'destructive',
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
  const [dataPreenchida, setDataPreenchida] = useState<string | undefined>(undefined);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/justificativas');
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function abrirForm(data?: string) {
    setDataPreenchida(data);
    setShowForm(true);
  }

  return (
    <div className="px-5 pt-4">
      <h1 className="font-bold text-lg mb-4">Minha folha de ponto</h1>

      <Tabs defaultValue="justificativas">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="justificativas">Justificativas</TabsTrigger>
          <TabsTrigger value="folha">Espelho da folha</TabsTrigger>
        </TabsList>

        <TabsContent value="folha" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
          <FolhaAssinatura />
        </TabsContent>

        <TabsContent value="justificativas" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
          <div className="flex items-center justify-end mb-3">
            <Button size="sm" className="rounded-full" onClick={() => abrirForm()}>
              <Plus className="h-3.5 w-3.5" />
              Justificar / ajustar
            </Button>
          </div>

          <DivergenciasFolha
            datasJaJustificadas={items.map((j) => j.dataOcorrencia.slice(0, 10))}
            onJustificar={abrirForm}
          />

          {loading ? (
            <div role="status" aria-live="polite" className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-line rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-3/5" />
                </div>
              ))}
              <p className="text-center text-xs text-inksoft mt-1 animate-pulse">Carregando...</p>
            </div>
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
                    <Badge variant={STATUS_VARIANT[j.status]}>{STATUS_LABEL[j.status]}</Badge>
                  </div>
                  <div className="text-sm font-semibold">{j.motivo}</div>
                  {j.comentario && <div className="text-xs text-inksoft mt-1">{j.comentario}</div>}
                  {j.status === 'REPROVADO' && j.motivoReprovacao && (
                    <div className="flex items-start gap-1.5 text-xs text-danger mt-2 bg-danger-soft rounded-lg px-2 py-1.5">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Motivo da reprovação: {j.motivoReprovacao}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {showForm && (
        <NovaJustificativaModal
          dataInicial={dataPreenchida}
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

function NovaJustificativaModal({
  dataInicial,
  onClose,
  onCreated,
}: {
  dataInicial?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [dataOcorrencia, setDataOcorrencia] = useState(dataInicial ?? '');
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

        <Label>Data</Label>
        <Input type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} required />

        <Label>Tipo</Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as Justificativa['tipo'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FALTA">Falta</SelectItem>
            <SelectItem value="ATRASO">Atraso</SelectItem>
            <SelectItem value="SEM_SAIDA">Sem marcação de saída</SelectItem>
            <SelectItem value="AJUSTE">Ajuste em dia já preenchido</SelectItem>
          </SelectContent>
        </Select>

        <Label>Motivo</Label>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Atestado médico" required />

        <Label>Comentário (opcional)</Label>
        <Textarea className="min-h-[70px]" value={comentario} onChange={(e) => setComentario(e.target.value)} />

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
          <Button disabled={loading} className="flex-1">
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
