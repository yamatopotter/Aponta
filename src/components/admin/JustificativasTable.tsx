'use client';

import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { JustificativaAdmin } from './JustificativaDetailModal';

const TIPO_LABEL = { FALTA: 'Falta', ATRASO: 'Atraso', SEM_SAIDA: 'Sem saída', AJUSTE: 'Ajuste' };
const STATUS_LABEL = { PENDENTE: 'Pendente', EM_ANALISE: 'Pendente', APROVADO: 'Aprovado', REPROVADO: 'Reprovado' };
const STATUS_VARIANT: Record<JustificativaAdmin['status'], 'warn' | 'default' | 'destructive'> = {
  PENDENTE: 'warn',
  EM_ANALISE: 'warn',
  APROVADO: 'default',
  REPROVADO: 'destructive',
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
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Funcionário</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((j) => (
          <TableRow key={j.id} className="cursor-pointer" onClick={() => onOpen(j)}>
            <TableCell>
              <div className="font-bold">{j.employee.nome}</div>
              <div className="text-xs text-inksoft">{j.employee.cargo}</div>
            </TableCell>
            <TableCell>{TIPO_LABEL[j.tipo]}</TableCell>
            <TableCell>{new Date(j.dataOcorrencia).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell className="max-w-[220px] truncate">{j.motivo}</TableCell>
            <TableCell>{j.employee.unidade}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[j.status]}>{STATUS_LABEL[j.status]}</Badge>
              {j.decididoPor && (
                <div className="text-[11px] text-inksoft mt-1">por {j.decididoPor.name}</div>
              )}
            </TableCell>
            <TableCell className="text-right text-info text-xs font-bold">
              <span className="inline-flex items-center gap-1">
                Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
