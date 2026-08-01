import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="text-[12.5px] font-semibold text-inksoft">{label}</div>
      <div className="mt-1.5 text-[26px] font-bold text-ink leading-none">{value}</div>
      {hint && <div className="mt-1.5 text-[11.5px] text-inksoft">{hint}</div>}
    </Card>
  );
}
