'use client';

import type { JustificativaAdmin } from './JustificativaDetailModal';

const TIPO_LABEL = { FALTA: 'Falta', ATRASO: 'Atraso', SEM_SAIDA: 'Sem saída', AJUSTE: 'Ajuste' };

const COLUMNS: { status: JustificativaAdmin['status'][]; title: string; dot: string }[] = [
  { status: ['PENDENTE', 'EM_ANALISE'], title: 'Aguardando aprovação', dot: 'bg-warn' },
  { status: ['APROVADO'], title: 'Aprovado', dot: 'bg-primary' },
  { status: ['REPROVADO'], title: 'Reprovado', dot: 'bg-danger' },
];

export default function JustificativasKanban({
  items,
  onOpen,
}: {
  items: JustificativaAdmin[];
  onOpen: (item: JustificativaAdmin) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => col.status.includes(i.status));
        return (
          <div key={col.title} className="flex-1 min-w-[280px] bg-muted rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="font-bold text-[13.5px]">{col.title}</span>
              <span className="ml-auto bg-white rounded-full px-2 py-0.5 text-[11px] font-bold text-inksoft">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {colItems.length === 0 && (
                <div className="text-center text-xs text-inksoft py-6">Nenhum item aqui</div>
              )}
              {colItems.map((j) => (
                <button
                  key={j.id}
                  onClick={() => onOpen(j)}
                  className="text-left bg-white border border-line rounded-xl p-3 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {j.employee.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                    </div>
                    <div className="font-bold text-[13px] truncate">{j.employee.nome}</div>
                    <span className="ml-auto text-[10px] font-bold text-inksoft bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {TIPO_LABEL[j.tipo]}
                    </span>
                  </div>
                  <div className="text-xs font-semibold">{j.motivo}</div>
                  <div className="text-[11px] text-inksoft mt-0.5">
                    {new Date(j.dataOcorrencia).toLocaleDateString('pt-BR')} · {j.employee.unidade}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
