'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useUnidades } from '@/lib/useUnidades';

type Funcionario = {
  id: string;
  rhidPersonId: number;
  cpf: string;
  nome: string;
  cargo: string | null;
  unidade: string | null;
  ativo: boolean;
  updatedAt: string;
};

function formatarCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default function FuncionariosPage() {
  const unidades = useUnidades();
  const [items, setItems] = useState<Funcionario[]>([]);
  const [total, setTotal] = useState(0);
  const [ativos, setAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ unidade, status, q });
    const res = await fetch(`/api/admin/funcionarios?${params.toString()}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setAtivos(data.ativos ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidade, status]);

  return (
    <div>
      <div className="mb-1">
        <h1 className="font-bold text-xl">Funcionários</h1>
        <p className="text-[13.5px] text-inksoft mt-1">
          {total} no cache local ({ativos} ativos) — sincronizado do RHiD em{' '}
          <a href="/admin/configuracoes?tab=rhid" className="font-semibold text-primary">
            Configurações
          </a>
          .
        </p>
      </div>

      <div className="flex gap-2 flex-wrap my-5">
        {unidades.map((u) => (
          <Button
            key={u}
            size="sm"
            variant={unidade === u ? 'default' : 'outline'}
            className={cn('rounded-full', unidade !== u && 'bg-white')}
            onClick={() => setUnidade(u)}
          >
            {u}
          </Button>
        ))}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-auto h-9 text-xs gap-2" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="ATIVO">Ativos</SelectItem>
            <SelectItem value="INATIVO">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-inksoft" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Buscar nome ou CPF..."
            className="h-9 pl-8 text-xs"
          />
        </div>
      </div>

      <Card className="p-5">
        {loading ? (
          <p className="text-sm text-inksoft py-10 text-center">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="text-center text-inksoft text-sm py-16">Nenhum funcionário com esses filtros.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sincronizado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((f) => (
                <TableRow key={f.id} className="cursor-default">
                  <TableCell className="font-bold">{f.nome}</TableCell>
                  <TableCell className="font-mono text-xs">{formatarCpf(f.cpf)}</TableCell>
                  <TableCell>{f.cargo ?? '—'}</TableCell>
                  <TableCell>{f.unidade ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={f.ativo ? 'default' : 'outline'}>{f.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-inksoft">
                    {new Date(f.updatedAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
