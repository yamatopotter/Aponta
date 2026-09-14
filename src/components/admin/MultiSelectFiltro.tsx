'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Opcao {
  value: string;
  label: string;
}

// Dropdown com checkboxes pra filtros de múltipla escolha (ex.: funcionários,
// tipos de justificativa a ignorar) — não existe componente assim no design
// system do app ainda (Select do Radix é single-select), então é um popover
// simples com clique fora pra fechar, sem lib nova.
export default function MultiSelectFiltro({
  label,
  placeholderTodos,
  opcoes,
  selecionados,
  onChange,
}: {
  label: string;
  placeholderTodos: string;
  opcoes: Opcao[];
  selecionados: string[];
  onChange: (valores: string[]) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  function alternar(value: string) {
    onChange(selecionados.includes(value) ? selecionados.filter((v) => v !== value) : [...selecionados, value]);
  }

  const textoBotao =
    selecionados.length === 0
      ? placeholderTodos
      : selecionados.length === 1
        ? (opcoes.find((o) => o.value === selecionados[0])?.label ?? '1 selecionado')
        : `${selecionados.length} selecionados`;

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 bg-white text-xs gap-2"
        onClick={() => setAberto((a) => !a)}
      >
        {textoBotao}
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {aberto && (
        <div className="absolute z-20 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border border-line bg-card shadow-md p-2">
          <div className="flex items-center justify-between px-1 pb-1.5 mb-1 border-b border-line">
            <span className="text-[11px] font-semibold text-inksoft">{label}</span>
            {selecionados.length > 0 && (
              <button
                type="button"
                className="text-[11px] text-primary font-semibold"
                onClick={() => onChange([])}
              >
                Limpar
              </button>
            )}
          </div>
          {opcoes.length === 0 && <p className="text-xs text-inksoft px-1 py-2">Nenhuma opção disponível.</p>}
          {opcoes.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-muted text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selecionados.includes(o.value)}
                onChange={() => alternar(o.value)}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span className="flex-1">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
