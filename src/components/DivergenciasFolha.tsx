'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { descreverDivergencia, hojeCurto, paraDataCurta, type ApuracaoAlertaFields } from '@/lib/utils';

type ApuracaoDia = ApuracaoAlertaFields & {
  date: string;
  possuiPendencias?: boolean;
};

export default function DivergenciasFolha({
  datasJaJustificadas,
  onJustificar,
}: {
  datasJaJustificadas: string[]; // yyyy-MM-dd
  onJustificar: (data: string) => void;
}) {
  const [dias, setDias] = useState<ApuracaoDia[] | null>(null);

  useEffect(() => {
    fetch('/api/folha/minha')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDias(data?.apuracao ?? []))
      .catch(() => setDias([]));
  }, []);

  if (!dias) return null;

  const hoje = hojeCurto();
  const justificadas = new Set(datasJaJustificadas);

  const divergencias = dias
    .filter((d) => paraDataCurta(d.date) <= hoje) // só até a data atual — não faz sentido cobrar dia futuro do período aberto
    .filter((d) => d.possuiPendencias || d.faltaDiaInteiro)
    .filter((d) => !justificadas.has(paraDataCurta(d.date)));

  if (divergencias.length === 0) return null;

  return (
    <div className="border border-warn/40 bg-warn-soft rounded-xl p-3.5 mb-3">
      <div className="flex items-center gap-1.5 text-warn font-bold text-xs mb-2">
        <TriangleAlert className="h-3.5 w-3.5" />
        {divergencias.length} dia(s) com divergência — sem justificativa ainda
      </div>
      <div className="flex flex-col gap-2">
        {divergencias.map((d) => {
          const dataCurta = paraDataCurta(d.date);
          return (
            <div key={dataCurta} className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2">
              <div className="text-xs">
                <div className="font-semibold">
                  {new Date(dataCurta + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}
                </div>
                <div className="text-inksoft">{descreverDivergencia(d)}</div>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 bg-white" onClick={() => onJustificar(dataCurta)}>
                Justificar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
