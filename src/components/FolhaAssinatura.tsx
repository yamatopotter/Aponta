'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, descreverDivergencia, formatHorarioContratual, hojeCurto, paraDataCurta, type ApuracaoAlertaFields } from '@/lib/utils';

type AnoMes = { ano: number; mes: number };

function addMeses({ ano, mes }: AnoMes, delta: number): AnoMes {
  let m = mes + delta;
  let a = ano;
  while (m < 1) {
    m += 12;
    a -= 1;
  }
  while (m > 12) {
    m -= 12;
    a += 1;
  }
  return { ano: a, mes: m };
}

type Marcacao = { dateTime: string; _typeEntradaSaida: 'E' | 'S' };
type ApuracaoDia = ApuracaoAlertaFields & {
  date: string;
  totalHorasTrabalhadas?: number;
  folga?: boolean;
  holiday?: string | null;
  possuiPendencias?: boolean;
  listAfdtManutencao?: Marcacao[];
};
type FolhaResponse = {
  periodo: { ano: number; mes: number; inicio: string; fim: string };
  apuracao: ApuracaoDia[];
  assinadoEm: string | null;
  podeAssinar: boolean;
};

function formatMinutos(min?: number) {
  if (min == null) return '—';
  const sinal = min < 0 ? '-' : '';
  const abs = Math.abs(min);
  return `${sinal}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, '0')}`;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// O RHiD às vezes já devolve em listAfdtManutencao as marcações PREVISTAS do
// dia (a partir do horário contratual), não só as batidas de verdade — dá
// pra ver isso quando o dia é hoje e alguma marcação tem horário no futuro.
// Soma só pares Entrada→Saída já fechados; se sobrar uma entrada em aberto,
// conta até agora (jornada "em andamento").
function calcularMinutosTrabalhados(marcacoes: Marcacao[], agora: Date): number {
  let total = 0;
  let entradaAberta: Date | null = null;
  for (const m of [...marcacoes].sort((a, b) => a.dateTime.localeCompare(b.dateTime))) {
    const t = new Date(m.dateTime);
    if (m._typeEntradaSaida === 'E') {
      entradaAberta = t;
    } else if (m._typeEntradaSaida === 'S' && entradaAberta) {
      total += (t.getTime() - entradaAberta.getTime()) / 60000;
      entradaAberta = null;
    }
  }
  if (entradaAberta) total += (agora.getTime() - entradaAberta.getTime()) / 60000;
  return Math.round(total);
}

// "Segunda, 27/07" — nome do dia por extenso, mais fácil de ler que a abreviação "seg.".
function formatDataLonga(iso: string) {
  const d = new Date(iso);
  const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const dataCurta = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${diaSemanaCap}, ${dataCurta}`;
}

export default function FolhaAssinatura() {
  const [data, setData] = useState<FolhaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState(false);
  const [anoMesAtual, setAnoMesAtual] = useState<AnoMes | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [erroConfirmar, setErroConfirmar] = useState<string | null>(null);

  async function load(anoMes?: AnoMes) {
    setLoading(true);
    setError(null);
    try {
      const params = anoMes ? `?ano=${anoMes.ano}&mes=${anoMes.mes}` : '';
      const res = await fetch(`/api/folha/minha${params}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Não foi possível carregar a apuração.');
        return;
      }
      setData(json);
      if (!anoMesAtual) setAnoMesAtual({ ano: json.periodo.ano, mes: json.periodo.mes });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Sempre abre no período atual — não guarda o mês visto por último.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navegar(delta: number) {
    if (!data) return;
    load(addMeses({ ano: data.periodo.ano, mes: data.periodo.mes }, delta));
  }

  async function assinar() {
    setAssinando(true);
    setErroConfirmar(null);
    try {
      const res = await fetch('/api/folha/assinar', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, assinadoEm: json.assinadoEm } : prev));
        setShowConfirm(false);
      } else {
        setErroConfirmar(json.error ?? 'Não foi possível confirmar. Tente novamente.');
      }
    } finally {
      setAssinando(false);
    }
  }

  const noPeriodoAtual = data && anoMesAtual && data.periodo.ano === anoMesAtual.ano && data.periodo.mes === anoMesAtual.mes;

  if (loading && !data) {
    return (
      <div className="border border-line rounded-xl p-4" role="status" aria-live="polite">
        <Skeleton className="h-9 w-full rounded-full mb-2" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <p className="text-xs text-inksoft text-center mt-2 animate-pulse">Carregando sua folha de ponto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 border border-danger/40 bg-danger-soft text-danger rounded-xl p-4 text-sm">
        <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { apuracao, assinadoEm, podeAssinar } = data;
  const inicio = new Date(data.periodo.inicio + 'T00:00:00').toLocaleDateString('pt-BR');
  const fim = new Date(data.periodo.fim + 'T00:00:00').toLocaleDateString('pt-BR');

  return (
    <div className="border border-line rounded-xl p-4 mb-4">
      <div className="text-center text-sm font-bold bg-muted rounded-full py-2.5 px-3 mb-2">
        {inicio} — {fim}
      </div>

      <div className="flex gap-2 mb-3">
        <Button variant="outline" className="flex-1 bg-white" onClick={() => navegar(-1)} disabled={loading}>
          <ChevronLeft className="h-4 w-4" />
          Mês anterior
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-white"
          onClick={() => navegar(1)}
          disabled={loading || !!noPeriodoAtual}
        >
          Próximo mês
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-3">
        {assinadoEm ? (
          <Badge>Assinado em {new Date(assinadoEm).toLocaleDateString('pt-BR')}</Badge>
        ) : (
          <Badge variant="warn">Aguardando confirmação</Badge>
        )}
      </div>

      <div className={cn('flex flex-col gap-2 transition-opacity duration-200', loading && 'opacity-50')}>
        {apuracao.length === 0 && <div className="text-xs text-inksoft py-4 text-center">Sem apuração para este período.</div>}
        {apuracao.map((dia) => {
          const dataCurta = paraDataCurta(dia.date);
          const hoje = hojeCurto();
          const éHoje = dataCurta === hoje;
          const agora = new Date();
          // Filtra marcações com horário no futuro — o RHiD chega a devolver aqui
          // o horário contratual previsto do dia, não só o que já foi batido de
          // verdade (ver calcularMinutosTrabalhados acima).
          const marcacoesReais = éHoje
            ? (dia.listAfdtManutencao ?? []).filter((m) => new Date(m.dateTime) <= agora)
            : (dia.listAfdtManutencao ?? []);
          const marcacoes = marcacoesReais.map((m) => formatHora(m.dateTime)).join(' · ');
          const totalMinutos = éHoje ? calcularMinutosTrabalhados(marcacoesReais, agora) : dia.totalHorasTrabalhadas;
          // O RHiD marca dia futuro (e às vezes o de hoje, antes de acabar) como "falta"
          // por não ter marcação ainda — não é uma pendência de verdade, então não alertamos.
          const diaFuturo = dataCurta > hoje;
          const diaEmAberto = diaFuturo || éHoje;
          const alerta = !diaEmAberto && (dia.possuiPendencias || dia.faltaDiaInteiro);
          const situacao = dia.folga
            ? 'Folga'
            : dia.holiday
              ? dia.holiday
              : diaFuturo
                ? 'Ainda não ocorreu'
                : marcacoes
                  ? marcacoes + (éHoje ? ' · Em andamento' : '')
                  : éHoje
                    ? 'Ainda não bateu ponto hoje'
                    : dia.faltaDiaInteiro
                      ? 'Falta'
                      : 'Sem marcação';
          const horarioEsperado = !dia.folga && !dia.holiday ? formatHorarioContratual(dia.strHorarioContratualSimples) : null;
          return (
            <div
              key={dia.date}
              className={cn('border rounded-xl p-3 flex flex-col gap-1', alerta ? 'border-warn/40' : 'border-line')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm">{formatDataLonga(dia.date)}</span>
                <span className="font-bold text-sm tabular-nums shrink-0">{formatMinutos(totalMinutos)}</span>
              </div>
              <span className="text-xs text-inksoft tabular-nums">{situacao}</span>
              {horarioEsperado && (
                <span className="text-[11px] text-inksoft/80">Esperado: {horarioEsperado}</span>
              )}
              {alerta && (
                <div className="flex items-start gap-1.5 text-xs text-warn bg-warn-soft rounded-lg px-2.5 py-1.5 mt-1">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {descreverDivergencia(dia)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!assinadoEm &&
        (podeAssinar ? (
          <Button onClick={() => setShowConfirm(true)} disabled={assinando} className="w-full mt-3">
            <CircleCheck className="h-4 w-4" />
            Confirmo que meu ponto está correto
          </Button>
        ) : (
          <p className="text-[11.5px] text-inksoft mt-3 text-center">
            A confirmação abre no dia de fechamento do período ({fim}).
          </p>
        ))}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-3 animate-in slide-in-from-bottom duration-300 ease-out">
            <h2 className="font-bold text-lg">Confirmar sua folha de ponto?</h2>
            <p className="text-sm text-inksoft">
              Período de {inicio} a {fim}. Depois de confirmada, qualquer ajuste precisa passar pelo
              RH — use a aba <b>&ldquo;Justificativas&rdquo;</b>, no topo, antes de confirmar se achou algo errado.
            </p>
            {erroConfirmar && (
              <div className="flex items-center gap-2 text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {erroConfirmar}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={assinando}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={assinar} disabled={assinando}>
                {assinando ? 'Confirmando...' : 'Sim, confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
