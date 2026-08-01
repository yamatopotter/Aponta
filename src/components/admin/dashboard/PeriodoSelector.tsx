import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type Periodo = '30d' | '90d' | 'mes_atual';

const OPCOES: { value: Periodo; label: string }[] = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'mes_atual', label: 'Mês corrente' },
];

export default function PeriodoSelector({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Periodo)}>
      <SelectTrigger className="w-auto h-9 text-xs gap-2" aria-label="Filtrar por período">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPCOES.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
