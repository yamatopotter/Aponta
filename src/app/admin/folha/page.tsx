'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Item = {
  id: string;
  nome: string;
  cargo: string | null;
  unidade: string | null;
  assinadoEm: string | null;
};
type Resposta = {
  periodo: { ano: number; mes: number; inicio: string; fim: string };
  total: number;
  assinados: number;
  items: Item[];
};
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

export default function AdminFolhaPage() {
  const [data, setData] = useState<Resposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [anoMesAtual, setAnoMesAtual] = useState<AnoMes | null>(null);

  async function load(anoMes?: AnoMes) {
    setLoading(true);
    const params = anoMes ? `?ano=${anoMes.ano}&mes=${anoMes.mes}` : '';
    const res = await fetch(`/api/admin/folha/assinaturas${params}`);
    const json: Resposta = await res.json();
    setData(json);
    if (!anoMesAtual) setAnoMesAtual({ ano: json.periodo.ano, mes: json.periodo.mes });
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navegar(delta: number) {
    if (!data) return;
    load(addMeses({ ano: data.periodo.ano, mes: data.periodo.mes }, delta));
  }

  const pendentes = data ? data.total - data.assinados : 0;
  const inicio = data ? new Date(data.periodo.inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const fim = data ? new Date(data.periodo.fim + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const noPeriodoAtual = data && anoMesAtual && data.periodo.ano === anoMesAtual.ano && data.periodo.mes === anoMesAtual.mes;

  return (
    <div>
      <div className="mb-1">
        <h1 className="font-bold text-xl">Folha de ponto</h1>
        <p className="text-[13.5px] text-inksoft mt-1">
          {data && `${data.assinados} de ${data.total} funcionários já confirmaram.`}
        </p>
      </div>

      <div className="flex items-center gap-3 mt-5 mb-3">
        <Button size="icon" variant="outline" onClick={() => navegar(-1)} disabled={loading} title="Período anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-bold min-w-[190px] text-center">
          {data ? `Período ${inicio} a ${fim}` : '—'}
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => navegar(1)}
          disabled={loading || !!noPeriodoAtual}
          title="Próximo período"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!noPeriodoAtual && !loading && (
          <span className="text-[11px] text-inksoft">período anterior — não é o atual</span>
        )}
      </div>

      <Card className="p-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Funcionário</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((item) => (
                <TableRow key={item.id} className="cursor-default">
                  <TableCell>
                    <div className="font-bold">{item.nome}</div>
                    <div className="text-xs text-inksoft">{item.cargo}</div>
                  </TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell>
                    {item.assinadoEm ? (
                      <Badge className="inline-flex items-center gap-1">
                        <CircleCheck className="h-3 w-3" />
                        {new Date(item.assinadoEm).toLocaleDateString('pt-BR')}
                      </Badge>
                    ) : (
                      <Badge variant="warn" className="inline-flex items-center gap-1">
                        <TriangleAlert className="h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {!loading && pendentes > 0 && (
        <p className="text-[12px] text-inksoft mt-3">{pendentes} funcionário(s) ainda não confirmaram a folha deste período.</p>
      )}
    </div>
  );
}
