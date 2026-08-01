'use client';

import { ArrowRight, MessageCircleWarning } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { excerpt } from '@/lib/utils';
import type { ChamadoAdmin } from './ChamadoDetailModal';

const STATUS_LABEL = { ABERTO: 'Aberto', ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído' };
const STATUS_VARIANT: Record<ChamadoAdmin['status'], 'warn' | 'secondary' | 'default'> = {
  ABERTO: 'warn',
  ANDAMENTO: 'secondary',
  CONCLUIDO: 'default',
};

export default function ChamadosTable({ items, onOpen }: { items: ChamadoAdmin[]; onOpen: (item: ChamadoAdmin) => void }) {
  if (items.length === 0) {
    return <div className="text-center text-inksoft text-sm py-16">Nenhum chamado com esses filtros.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Funcionário</TableHead>
          <TableHead>Assunto</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead>Anexos</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((c) => (
          <TableRow key={c.id} className="cursor-pointer" onClick={() => onOpen(c)}>
            <TableCell>
              <div className="font-bold">{c.employee.nome}</div>
              <div className="text-xs text-inksoft">{c.employee.cargo}</div>
            </TableCell>
            <TableCell className="max-w-[260px]">
              <div className="font-semibold">{c.categoria.label}</div>
              <div className="text-xs text-inksoft truncate">{excerpt(c.ultimaMensagem ?? c.descricao)}</div>
            </TableCell>
            <TableCell>{c.employee.unidade}</TableCell>
            <TableCell>{c.anexos.length ? `📎 ${c.anexos.length}` : '—'}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
              {c.aguardandoResposta ? (
                <div className="flex items-center gap-1 text-[11px] text-warn font-semibold mt-1">
                  <MessageCircleWarning className="h-3 w-3 shrink-0" /> Aguardando resposta
                </div>
              ) : (
                c.respondidoPor && <div className="text-[11px] text-inksoft mt-1">por {c.respondidoPor.name}</div>
              )}
            </TableCell>
            <TableCell className="text-right text-secondary text-xs font-bold">
              <span className="inline-flex items-center gap-1">
                Responder <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
