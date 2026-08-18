'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type TipoJustificativa = {
  id: string;
  label: string;
  ativo: boolean;
  ordem: number;
  contaTopDepartamentos: boolean;
  contaPendenciaRecorrente: boolean;
};
type CategoriaChamado = { id: string; label: string; ativo: boolean; ordem: number };

export default function TiposSection() {
  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <p className="text-[13.5px] text-inksoft -mt-1">
        Cadastro dos tipos que aparecem no formulário de justificativa e no de abertura de
        chamado. Desativar um tipo/categoria some com ele dos formulários novos, sem apagar o
        histórico de quem já usou.
      </p>
      <TiposJustificativaCard />
      <CategoriasChamadoCard />
    </div>
  );
}

function TiposJustificativaCard() {
  const [tipos, setTipos] = useState<TipoJustificativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoLabel, setNovoLabel] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/tipos-justificativa?todos=true');
    setTipos(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLabel.trim()) return;
    setCriando(true);
    setErro(null);
    try {
      const res = await fetch('/api/tipos-justificativa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: novoLabel.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNovoLabel('');
        await load();
      } else {
        setErro(data.error ?? 'Não foi possível criar.');
      }
    } finally {
      setCriando(false);
    }
  }

  async function patch(id: string, data: Partial<TipoJustificativa>) {
    await fetch(`/api/tipos-justificativa/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async function atualizar(id: string, data: Partial<TipoJustificativa>) {
    await patch(id, data);
    await load();
  }

  async function mover(idx: number, dir: -1 | 1) {
    const alvo = tipos[idx + dir];
    const atual = tipos[idx];
    if (!alvo) return;
    await Promise.all([patch(atual.id, { ordem: alvo.ordem }), patch(alvo.id, { ordem: atual.ordem })]);
    await load();
  }

  return (
    <Card className="p-6">
      <div className="font-bold text-sm mb-1">Tipos de justificativa</div>
      <p className="text-[12px] text-inksoft mb-4">
        Os dois interruptores controlam se ocorrências desse tipo entram nas contagens de "Top
        departamentos" e "Funcionários com pendência recorrente" do Dashboard.
      </p>

      {loading ? (
        <p className="text-sm text-inksoft">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {tipos.map((t, idx) => (
            <div key={t.id} className="flex flex-col gap-2 border border-line rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => mover(idx, -1)}
                    className="text-inksoft disabled:opacity-30 hover:text-ink"
                    title="Mover pra cima"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tipos.length - 1}
                    onClick={() => mover(idx, 1)}
                    className="text-inksoft disabled:opacity-30 hover:text-ink"
                    title="Mover pra baixo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="flex-1 font-semibold text-sm">{t.label}</span>
                <Badge
                  variant={t.ativo ? 'default' : 'outline'}
                  className="cursor-pointer shrink-0"
                  onClick={() => atualizar(t.id, { ativo: !t.ativo })}
                >
                  {t.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pl-[22px]">
                <label className="flex items-center gap-1.5 text-[11.5px] text-inksoft">
                  <input
                    type="checkbox"
                    checked={t.contaTopDepartamentos}
                    onChange={(e) => atualizar(t.id, { contaTopDepartamentos: e.target.checked })}
                  />
                  Conta em "Top departamentos"
                </label>
                <label className="flex items-center gap-1.5 text-[11.5px] text-inksoft">
                  <input
                    type="checkbox"
                    checked={t.contaPendenciaRecorrente}
                    onChange={(e) => atualizar(t.id, { contaPendenciaRecorrente: e.target.checked })}
                  />
                  Conta em "Pendência recorrente"
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={criar} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={novoLabel}
            onChange={(e) => setNovoLabel(e.target.value)}
            placeholder="Ex.: Home office"
            className="flex-1"
          />
          <Button type="submit" disabled={criando || !novoLabel.trim()}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
        {erro && <p className="text-[11.5px] text-danger">{erro}</p>}
      </form>
    </Card>
  );
}

function CategoriasChamadoCard() {
  const [categorias, setCategorias] = useState<CategoriaChamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoLabel, setNovoLabel] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/categorias-chamado?todos=true');
    setCategorias(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLabel.trim()) return;
    setErro(null);
    setCriando(true);
    try {
      const res = await fetch('/api/categorias-chamado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: novoLabel.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNovoLabel('');
        await load();
      } else {
        setErro(data.error ?? 'Não foi possível criar.');
      }
    } finally {
      setCriando(false);
    }
  }

  async function patch(id: string, data: Partial<CategoriaChamado>) {
    await fetch(`/api/categorias-chamado/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async function atualizar(id: string, data: Partial<CategoriaChamado>) {
    await patch(id, data);
    await load();
  }

  async function mover(idx: number, dir: -1 | 1) {
    const alvo = categorias[idx + dir];
    const atual = categorias[idx];
    if (!alvo) return;
    await Promise.all([patch(atual.id, { ordem: alvo.ordem }), patch(alvo.id, { ordem: atual.ordem })]);
    await load();
  }

  return (
    <Card className="p-6">
      <div className="font-bold text-sm mb-4">Categorias de chamado</div>

      {loading ? (
        <p className="text-sm text-inksoft">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {categorias.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-2 border border-line rounded-lg p-3">
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => mover(idx, -1)}
                  className="text-inksoft disabled:opacity-30 hover:text-ink"
                  title="Mover pra cima"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === categorias.length - 1}
                  onClick={() => mover(idx, 1)}
                  className="text-inksoft disabled:opacity-30 hover:text-ink"
                  title="Mover pra baixo"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="flex-1 font-semibold text-sm">{c.label}</span>
              <Badge
                variant={c.ativo ? 'default' : 'outline'}
                className="cursor-pointer shrink-0"
                onClick={() => atualizar(c.id, { ativo: !c.ativo })}
              >
                {c.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={criar} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={novoLabel}
            onChange={(e) => setNovoLabel(e.target.value)}
            placeholder="Ex.: Benefícios"
            className="flex-1"
          />
          <Button type="submit" disabled={criando || !novoLabel.trim()}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
        {erro && <p className="text-[11.5px] text-danger">{erro}</p>}
      </form>
    </Card>
  );
}
