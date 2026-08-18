'use client';

import { useRef } from 'react';
import { Paperclip, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

// Seletor de anexos reutilizável (botão "Anexar arquivo" + chips com o nome
// de cada arquivo escolhido, removíveis) — mesmo padrão visual já usado no
// composer de mensagens de chamado, extraído aqui pra reaproveitar na
// abertura de justificativa e na abertura de chamado.
export default function AnexoPicker({
  arquivos,
  onChange,
  max = 5,
}: {
  arquivos: File[];
  onChange: (files: File[]) => void;
  max?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function adicionar(files: FileList | null) {
    if (!files) return;
    onChange([...arquivos, ...Array.from(files)].slice(0, max));
  }

  function remover(idx: number) {
    onChange(arquivos.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          adicionar(e.target.files);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start bg-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={arquivos.length >= max}
      >
        <Paperclip className="h-3.5 w-3.5" />
        Anexar arquivo
      </Button>

      {arquivos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {arquivos.map((f, idx) => (
            <span key={`${f.name}-${idx}`} className="flex items-center gap-1 text-[11px] bg-muted rounded-full pl-2 pr-1 py-0.5">
              <Paperclip className="h-3 w-3" /> {f.name}
              <button
                type="button"
                onClick={() => remover(idx)}
                className="hover:bg-white rounded-full p-0.5"
                title="Remover anexo"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
