'use client';

import { useEffect, useState } from 'react';
import { Info, TriangleAlert } from 'lucide-react';

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

  // Hoje nunca entra na lista de divergências confirmadas — o dia ainda não
  // terminou, então "possuiPendencias"/"faltaDiaInteiro" do RHiD pra hoje é
  // só provisório (ex.: ainda não bateu a saída porque o expediente não
  // acabou). Mostrado à parte, com tom mais leve, logo abaixo.
  const divergencias = dias
    .filter((d) => paraDataCurta(d.date) < hoje)
    .filter((d) => d.possuiPendencias || d.faltaDiaInteiro)
    .filter((d) => !justificadas.has(paraDataCurta(d.date)));

  const diaHoje = dias.find(
    (d) => paraDataCurta(d.date) === hoje && (d.possuiPendencias || d.faltaDiaInteiro) && !justificadas.has(hoje)
  );

  // Avisos informativos (ex.: "Extra acima de 10 min") que o RHiD manda em
  // toolTipAlert sem marcar possuiPendencias/faltaDiaInteiro — não é um
  // problema a corrigir, então não entra na lista de divergências nem tem
  // botão de "Justificar". Já aparece com o mesmo dado no Espelho da folha
  // (ver src/components/FolhaAssinatura.tsx); aqui é só um espelho leve pra
  // quem está na aba Justificativas não deixar de ver.
  const avisos = dias.filter(
    (d) => paraDataCurta(d.date) < hoje && d.toolTipAlert && !d.possuiPendencias && !d.faltaDiaInteiro
  );

  if (divergencias.length === 0 && !diaHoje && avisos.length === 0) return null;

  return (
    <>
      {divergencias.length > 0 && (
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
      )}

      {diaHoje && (
        <div className="flex items-center justify-between gap-2 border border-info/30 bg-info-soft rounded-xl px-3.5 py-2.5 mb-3">
          <div className="flex items-start gap-1.5 text-info text-xs">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>O dia de hoje ainda está em andamento. Se teve algum problema pra bater o ponto, dá pra registrar agora mesmo.</span>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 bg-white" onClick={() => onJustificar(hoje)}>
            Justificar mesmo assim
          </Button>
        </div>
      )}

      {avisos.length > 0 && (
        <div className="border border-info/30 bg-info-soft rounded-xl p-3.5 mb-3">
          <div className="flex items-center gap-1.5 text-info font-bold text-xs mb-2">
            <Info className="h-3.5 w-3.5" />
            {avisos.length} dia(s) com aviso — sem ação necessária
          </div>
          <div className="flex flex-col gap-2">
            {avisos.map((d) => {
              const dataCurta = paraDataCurta(d.date);
              return (
                <div key={dataCurta} className="bg-white rounded-lg px-3 py-2 text-xs">
                  <span className="font-semibold">
                    {new Date(dataCurta + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}
                  </span>{' '}
                  <span className="text-inksoft">— {d.toolTipAlert}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
