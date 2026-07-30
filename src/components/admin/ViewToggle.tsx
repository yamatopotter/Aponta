'use client';

export type ViewMode = 'tabela' | 'kanban';

export default function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      <button
        onClick={() => onChange('tabela')}
        className={`px-3 py-1.5 rounded-md text-xs font-bold ${
          value === 'tabela' ? 'bg-white shadow-sm text-ink' : 'text-inksoft'
        }`}
      >
        Tabela
      </button>
      <button
        onClick={() => onChange('kanban')}
        className={`px-3 py-1.5 rounded-md text-xs font-bold ${
          value === 'kanban' ? 'bg-white shadow-sm text-ink' : 'text-inksoft'
        }`}
      >
        Kanban
      </button>
    </div>
  );
}
