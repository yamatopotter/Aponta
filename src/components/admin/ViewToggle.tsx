'use client';

import { List, LayoutGrid } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ViewMode = 'tabela' | 'kanban';

export default function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      <button
        onClick={() => onChange('tabela')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold',
          value === 'tabela' ? 'bg-white shadow-sm text-ink' : 'text-inksoft'
        )}
      >
        <List className="h-3.5 w-3.5" />
        Tabela
      </button>
      <button
        onClick={() => onChange('kanban')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold',
          value === 'kanban' ? 'bg-white shadow-sm text-ink' : 'text-inksoft'
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  );
}
