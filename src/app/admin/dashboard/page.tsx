'use client';

import { useEffect, useState } from 'react';

import StatCard from '@/components/admin/dashboard/StatCard';
import BreakdownBarChart, { BreakdownItem } from '@/components/admin/dashboard/BreakdownBarChart';
import RankingTable, { RankingRow } from '@/components/admin/dashboard/RankingTable';
import PeriodoSelector, { Periodo } from '@/components/admin/dashboard/PeriodoSelector';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Cores de status reaproveitadas de src/components/ui/badge.tsx (mesmos tokens
// usados nos badges de Justificativas/Chamados) — status é uma paleta fixa e
// reservada, nunca deve variar tela a tela.
const COR_WARN = '#745425';
const COR_PRIMARY = '#546e4e';
const COR_SECONDARY = '#6a2f4c';
const COR_DANGER = '#a3402e';
// Cor neutra única pra "tipo de justificativa" — categorias sem carga de
// bom/ruim, então é um único hue (não uma cor por categoria) com rótulo direto.
const COR_NEUTRA = '#3E6B7A';

type DashboardData = {
  justificativasPorStatus: { status: string; quantidade: number }[];
  justificativasPorTipo: { tipo: string; quantidade: number }[];
  chamadosPorStatus: { status: string; quantidade: number }[];
  tempoMedioRespostaHoras: number | null;
  chamadosRespondidosNoPeriodo: number;
  topDepartamentos: { nome: string; quantidade: number }[];
  funcionariosRecorrentes: { employeeId: string; nome: string; unidade: string | null; quantidade: number }[];
  folha: { periodo: { ano: number; mes: number }; assinados: number; total: number };
};

const LABEL_JUSTIFICATIVA_STATUS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Pendente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
};
const COR_JUSTIFICATIVA_STATUS: Record<string, string> = {
  PENDENTE: COR_WARN,
  EM_ANALISE: COR_WARN,
  APROVADO: COR_PRIMARY,
  REPROVADO: COR_DANGER,
};

const LABEL_TIPO: Record<string, string> = {
  FALTA: 'Falta',
  ATRASO: 'Atraso',
  SEM_SAIDA: 'Sem saída',
  AJUSTE: 'Ajuste',
};

const LABEL_CHAMADO_STATUS: Record<string, string> = {
  ABERTO: 'Aberto',
  ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
};
const COR_CHAMADO_STATUS: Record<string, string> = {
  ABERTO: COR_WARN,
  ANDAMENTO: COR_SECONDARY,
  CONCLUIDO: COR_PRIMARY,
};

// Junta status equivalentes (PENDENTE + EM_ANALISE, ambos exibidos como
// "Pendente" nas telas de Justificativas — ver src/components/admin/JustificativasTable.tsx)
// somando as quantidades em vez de listar a mesma cor duas vezes no gráfico.
function agruparPorLabel(
  itens: { status: string; quantidade: number }[],
  labelMap: Record<string, string>,
  corMap: Record<string, string>
): BreakdownItem[] {
  const somaPorLabel = new Map<string, { quantidade: number; color: string }>();
  for (const item of itens) {
    const label = labelMap[item.status] ?? item.status;
    const atual = somaPorLabel.get(label);
    somaPorLabel.set(label, {
      quantidade: (atual?.quantidade ?? 0) + item.quantidade,
      color: corMap[item.status] ?? COR_NEUTRA,
    });
  }
  return Array.from(somaPorLabel.entries()).map(([label, v]) => ({ label, value: v.quantidade, color: v.color }));
}

function formatHoras(horas: number | null): string {
  if (horas === null) return '—';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas.toFixed(1)} h`;
  return `${Math.round(horas / 24)} dias`;
}

export default function AdminDashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('30d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/admin/dashboard?periodo=${periodo}`);
      if (cancelled) return;
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [periodo]);

  const justificativasStatusItems = data
    ? agruparPorLabel(data.justificativasPorStatus, LABEL_JUSTIFICATIVA_STATUS, COR_JUSTIFICATIVA_STATUS)
    : [];
  const justificativasTipoItems: BreakdownItem[] = data
    ? data.justificativasPorTipo.map((t) => ({ label: LABEL_TIPO[t.tipo] ?? t.tipo, value: t.quantidade, color: COR_NEUTRA }))
    : [];
  const chamadosStatusItems = data ? agruparPorLabel(data.chamadosPorStatus, LABEL_CHAMADO_STATUS, COR_CHAMADO_STATUS) : [];

  const topDepartamentosRows: RankingRow[] =
    data?.topDepartamentos.map((d) => ({ key: d.nome, label: d.nome, quantidade: d.quantidade })) ?? [];
  const funcionariosRecorrentesRows: RankingRow[] =
    data?.funcionariosRecorrentes.map((f) => ({
      key: f.employeeId,
      label: f.nome,
      sublabel: f.unidade,
      quantidade: f.quantidade,
    })) ?? [];

  const totalJustificativas = data ? data.justificativasPorStatus.reduce((s, i) => s + i.quantidade, 0) : 0;
  const totalChamados = data ? data.chamadosPorStatus.reduce((s, i) => s + i.quantidade, 0) : 0;
  const pctFolha = data && data.folha.total > 0 ? Math.round((data.folha.assinados / data.folha.total) * 100) : 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-bold text-xl">Dashboard</h1>
          <p className="text-[13.5px] text-inksoft mt-1">Visão geral de justificativas, chamados e folha.</p>
        </div>
        <PeriodoSelector value={periodo} onChange={setPeriodo} />
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl2" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <StatCard label="Justificativas no período" value={String(totalJustificativas)} />
            <StatCard label="Chamados no período" value={String(totalChamados)} />
            <StatCard
              label="Tempo médio de resposta"
              value={formatHoras(data.tempoMedioRespostaHoras)}
              hint={`${data.chamadosRespondidosNoPeriodo} chamados respondidos no período`}
            />
            <StatCard
              label="Folha confirmada"
              value={`${pctFolha}%`}
              hint={`${data.folha.assinados} de ${data.folha.total} funcionários — período ${String(data.folha.periodo.mes).padStart(2, '0')}/${data.folha.periodo.ano}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Justificativas por status</CardTitle>
                <CardDescription>Volume por status no período selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBarChart items={justificativasStatusItems} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chamados por status</CardTitle>
                <CardDescription>Volume por status no período selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBarChart items={chamadosStatusItems} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Justificativas por tipo</CardTitle>
                <CardDescription>O que mais gera justificativa no período.</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBarChart items={justificativasTipoItems} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top departamentos</CardTitle>
                <CardDescription>Mais ocorrências de falta/atraso no período.</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingTable rows={topDepartamentosRows} vazio="Sem ocorrências de falta/atraso no período." />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Funcionários com pendência recorrente</CardTitle>
                <CardDescription>3 ou mais faltas/atrasos/dias sem saída no período.</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingTable rows={funcionariosRecorrentesRows} vazio="Nenhum funcionário com pendência recorrente no período." />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
