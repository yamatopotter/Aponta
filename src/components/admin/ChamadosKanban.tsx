'use client';

import type { ChamadoAdmin } from './ChamadoDetailModal';

const COLUMNS: { status: ChamadoAdmin['status']; title: string; dot: string }[] = [
  { status: 'ABERTO', title: 'Aberto', dot: 'bg-warn' },
  { status: 'ANDAMENTO', title: 'Em andamento', dot: 'bg-info' },
  { status: 'CONCLUIDO', title: 'Concluído', dot: 'bg-primary' },
];

export default function ChamadosKanban({ items, onOpen }: { items: ChamadoAdmin[]; onOpen: (item: ChamadoAdmin) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.status);
        return (
          <div key={col.status} className="flex-1 min-w-[280px] bg-muted rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="font-bold text-[13.5px]">{col.title}</span>
              <span className="ml-auto bg-white rounded-full px-2 py-0.5 text-[11px] font-bold text-inksoft">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {colItems.length === 0 && <div className="text-center text-xs text-inksoft py-6">Nenhum item aqui</div>}
              {colItems.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onOpen(c)}
                  className="text-left bg-white border border-line rounded-xl p-3 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {c.employee.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                    </div>
                    <div className="font-bold text-[13px] truncate">{c.employee.nome}</div>
                  </div>
                  <div className="text-xs font-semibold">{c.categoria.label}</div>
                  <div className="text-[11px] text-inksoft mt-1 line-clamp-2">{c.descricao}</div>
                  <div className="text-[11px] text-inksoft mt-1">{c.employee.unidade}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
