'use client';

import type { JustificativaAdmin } from './JustificativaDetailModal';

const TIPO_LABEL = { FALTA: 'Falta', ATRASO: 'Atraso', SEM_SAIDA: 'Sem saída', AJUSTE: 'Ajuste' };
const STATUS_LABEL = { PENDENTE: 'Pendente', EM_ANALISE: 'Pendente', APROVADO: 'Aprovado', REPROVADO: 'Reprovado' };
const STATUS_STYLE = {
  PENDENTE: 'bg-warn-soft text-warn',
  EM_ANALISE: 'bg-warn-soft text-warn',
  APROVADO: 'bg-primary-soft text-primary',
  REPROVADO: 'bg-danger-soft text-danger',
};

export default function JustificativasTable({
  items,
  onOpen,
}: {
  items: JustificativaAdmin[];
  onOpen: (item: JustificativaAdmin) => void;
}) {
  if (items.length === 0) {
    return <div className="text-center text-inksoft text-sm py-16">Nenhum registro com esses filtros.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-inksoft border-b border-line">
            <th className="pb-2.5">Funcionário</th>
            <th className="pb-2.5">Tipo</th>
            <th className="pb-2.5">Data</th>
            <th className="pb-2.5">Motivo</th>
            <th className="pb-2.5">Unidade</th>
            <th className="pb-2.5">Status</th>
            <th className="pb-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((j) => (
            <tr key={j.id} className="border-b border-line hover:bg-muted cursor-pointer" onClick={() => onOpen(j)}>
              <td className="py-3">
                <div className="font-bold">{j.employee.nome}</div>
                <div className="text-xs text-inksoft">{j.employee.cargo}</div>
              </td>
              <td>{TIPO_LABEL[j.tipo]}</td>
              <td>{new Date(j.dataOcorrencia).toLocaleDateString('pt-BR')}</td>
              <td className="max-w-[220px] truncate">{j.motivo}</td>
              <td>{j.employee.unidade}</td>
              <td>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[j.status]}`}>
                  {STATUS_LABEL[j.status]}
                </span>
              </td>
              <td className="text-right text-info text-xs font-bold">Ver detalhes →</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
