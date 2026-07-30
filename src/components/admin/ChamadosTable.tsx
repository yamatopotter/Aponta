'use client';

import type { ChamadoAdmin } from './ChamadoDetailModal';

const STATUS_LABEL = { ABERTO: 'Aberto', ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído' };
const STATUS_STYLE = {
  ABERTO: 'bg-warn-soft text-warn',
  ANDAMENTO: 'bg-info-soft text-info',
  CONCLUIDO: 'bg-primary-soft text-primary',
};

export default function ChamadosTable({ items, onOpen }: { items: ChamadoAdmin[]; onOpen: (item: ChamadoAdmin) => void }) {
  if (items.length === 0) {
    return <div className="text-center text-inksoft text-sm py-16">Nenhum chamado com esses filtros.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-inksoft border-b border-line">
            <th className="pb-2.5">Funcionário</th>
            <th className="pb-2.5">Assunto</th>
            <th className="pb-2.5">Unidade</th>
            <th className="pb-2.5">Anexos</th>
            <th className="pb-2.5">Status</th>
            <th className="pb-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-b border-line hover:bg-muted cursor-pointer" onClick={() => onOpen(c)}>
              <td className="py-3">
                <div className="font-bold">{c.employee.nome}</div>
                <div className="text-xs text-inksoft">{c.employee.cargo}</div>
              </td>
              <td className="max-w-[260px]">
                <div className="font-semibold">{c.categoria.label}</div>
                <div className="text-xs text-inksoft truncate">{c.descricao}</div>
              </td>
              <td>{c.employee.unidade}</td>
              <td>{c.anexos.length ? `📎 ${c.anexos.length}` : '—'}</td>
              <td>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>
                  {STATUS_LABEL[c.status]}
                </span>
              </td>
              <td className="text-right text-info text-xs font-bold">Responder →</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
