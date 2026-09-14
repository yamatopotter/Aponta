'use client';

import { Fragment, useEffect, useState } from 'react';
import { CalendarRange, ChevronDown, ChevronRight, Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MultiSelectFiltro from '@/components/admin/MultiSelectFiltro';
import { useUnidades } from '@/lib/useUnidades';
import { formatDataCurta } from '@/lib/utils';

interface FuncionarioFaltas {
  employeeId: string;
  nome: string;
  unidade: string | null;
  cargo: string | null;
  datasFalta: string[];
  totalPeriodo: number;
  porMes: { anoMes: string; quantidade: number }[];
  erro?: string;
}

interface FuncionarioOpcao {
  id: string;
  nome: string;
  cargo: string | null;
}

function primeiroDiaDoMes(): string {
  const d = new Date();
  d.setDate(1);
  return d.toLocaleDateString('en-CA');
}

function hojeCurto(): string {
  return new Date().toLocaleDateString('en-CA');
}

function formatMesAno(anoMes: string): string {
  const [ano, mes] = anoMes.split('-');
  return `${mes}/${ano}`;
}

function construirParams(base: {
  dataInicio: string;
  dataFim: string;
  unidade: string;
  funcionarioIds: string[];
  ignorarJustificativas: string[];
}): URLSearchParams {
  const params = new URLSearchParams({ dataInicio: base.dataInicio, dataFim: base.dataFim, unidade: base.unidade });
  for (const id of base.funcionarioIds) params.append('funcionarioIds', id);
  for (const tipo of base.ignorarJustificativas) params.append('ignorarJustificativas', tipo);
  return params;
}

export default function RelatorioFaltasPage() {
  const unidades = useUnidades();
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes());
  const [dataFim, setDataFim] = useState(hojeCurto());
  const [unidade, setUnidade] = useState('Todas');
  const [funcionarioIds, setFuncionarioIds] = useState<string[]>([]);
  const [ignorarJustificativas, setIgnorarJustificativas] = useState<string[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioFaltas[]>([]);
  const [tiposJustificativaDisponiveis, setTiposJustificativaDisponiveis] = useState<string[]>([]);
  const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<FuncionarioOpcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const params = construirParams({ dataInicio, dataFim, unidade, funcionarioIds, ignorarJustificativas });

  // Lista de funcionários pro seletor — respeita o filtro de unidade, mas é
  // independente do resultado do relatório (senão desmarcar alguém some com
  // a própria opção de marcá-lo de volta).
  useEffect(() => {
    let cancelado = false;
    async function loadFuncionarios() {
      const p = new URLSearchParams({ status: 'ATIVO' });
      if (unidade !== 'Todas') p.set('unidade', unidade);
      const res = await fetch(`/api/admin/funcionarios?${p.toString()}`);
      if (!res.ok || cancelado) return;
      const data = await res.json();
      setFuncionariosDisponiveis(data.items.map((f: { id: string; nome: string; cargo: string | null }) => ({ id: f.id, nome: f.nome, cargo: f.cargo })));
    }
    loadFuncionarios();
    return () => {
      cancelado = true;
    };
  }, [unidade]);

  useEffect(() => {
    let cancelado = false;
    async function load() {
      setLoading(true);
      setErro(null);
      const res = await fetch(`/api/admin/relatorios/faltas?${params.toString()}&formato=json`);
      if (cancelado) return;
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErro(data?.error ?? 'Erro ao gerar relatório.');
        setFuncionarios([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setFuncionarios(data.funcionarios);
      setTiposJustificativaDisponiveis(data.tiposJustificativaEncontrados ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim, unidade, funcionarioIds, ignorarJustificativas]);

  const totalFaltas = funcionarios.reduce((soma, f) => soma + f.totalPeriodo, 0);

  return (
    <div>
      <div className="mb-1">
        <h1 className="font-bold text-xl">Relatório de Faltas</h1>
        <p className="text-[13.5px] text-inksoft mt-1">
          Faltas apuradas direto do RHiD (dias sem nenhuma marcação de ponto) — só funcionários ativos.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap items-center my-5">
        <div className="flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 text-inksoft shrink-0" />
          <Input
            type="date"
            aria-label="De"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-9 w-[142px] text-xs"
          />
          <span className="text-xs text-inksoft">até</span>
          <Input
            type="date"
            aria-label="Até"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-9 w-[142px] text-xs"
          />
        </div>

        <Select value={unidade} onValueChange={setUnidade}>
          <SelectTrigger className="w-auto h-9 text-xs gap-2" aria-label="Filtrar por unidade">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unidades.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <MultiSelectFiltro
          label="Funcionários no relatório"
          placeholderTodos="Todos os funcionários ativos"
          opcoes={funcionariosDisponiveis.map((f) => ({ value: f.id, label: f.cargo ? `${f.nome} — ${f.cargo}` : f.nome }))}
          selecionados={funcionarioIds}
          onChange={setFuncionarioIds}
        />

        <MultiSelectFiltro
          label="Ignorar essas justificativas (não contar como falta)"
          placeholderTodos="Nenhuma justificativa ignorada"
          opcoes={tiposJustificativaDisponiveis.map((t) => ({ value: t, label: t }))}
          selecionados={ignorarJustificativas}
          onChange={setIgnorarJustificativas}
        />

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="bg-white" asChild>
          <a href={`/api/admin/relatorios/faltas?${params.toString()}&formato=csv`}>
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </a>
        </Button>
        <Button variant="outline" size="sm" className="bg-white" asChild>
          <a href={`/api/admin/relatorios/faltas?${params.toString()}&formato=pdf`}>
            <FileText className="h-3.5 w-3.5" />
            Exportar PDF
          </a>
        </Button>
      </div>

      {erro && (
        <div className="border border-danger/40 bg-danger-soft text-danger rounded-xl p-3.5 mb-4 text-xs">{erro}</div>
      )}

      <Card className="p-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-[11.5px] text-inksoft mb-3">
              {funcionarios.length} funcionário(s) ativo(s) · {totalFaltas} falta(s) no período
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Total no período</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => {
                  const aberto = expandido === f.employeeId;
                  return (
                    <Fragment key={f.employeeId}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpandido(aberto ? null : f.employeeId)}
                      >
                        <TableCell>
                          {f.totalPeriodo > 0 &&
                            (aberto ? (
                              <ChevronDown className="h-3.5 w-3.5 text-inksoft" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-inksoft" />
                            ))}
                        </TableCell>
                        <TableCell className="font-semibold">{f.nome}</TableCell>
                        <TableCell>{f.unidade ?? '—'}</TableCell>
                        <TableCell>{f.cargo ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {f.erro ? <span className="text-danger">Erro RHiD</span> : f.totalPeriodo}
                        </TableCell>
                      </TableRow>
                      {aberto && f.totalPeriodo > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/40 py-3">
                            <div className="text-xs flex flex-col gap-2">
                              <div>
                                <span className="font-semibold">Por mês: </span>
                                {f.porMes.map((m) => `${formatMesAno(m.anoMes)}: ${m.quantidade}`).join(' · ')}
                              </div>
                              <div>
                                <span className="font-semibold">Datas: </span>
                                {f.datasFalta.map(formatDataCurta).join(', ')}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {f.erro && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-[11px] text-danger py-1">
                            {f.erro}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </Card>
    </div>
  );
}
