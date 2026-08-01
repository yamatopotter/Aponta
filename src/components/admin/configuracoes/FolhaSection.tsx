'use client';

import { useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FolhaSection() {
  const [diaFechamento, setDiaFechamento] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/settings/folha');
    const data = await res.json();
    setDiaFechamento(data.diaFechamento ?? 20);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings/folha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diaFechamento }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? 'Não foi possível salvar.');
        return;
      }
      setMsg('Configuração salva.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-inksoft">Carregando...</p>;

  const exemploFim = new Date(2026, 6, diaFechamento).toLocaleDateString('pt-BR');
  const exemploInicio = new Date(2026, 5, diaFechamento + 1).toLocaleDateString('pt-BR');

  return (
    <div className="max-w-xl">
      <p className="text-[13.5px] text-inksoft mb-5">
        Define em que dia do mês a folha fecha. A folha de um mês cobre do dia seguinte ao
        fechamento anterior até esse dia — é o período mostrado para o funcionário conferir e
        confirmar em "Meu Ponto".
      </p>

      {msg && (
        <div className="flex items-center gap-2 text-sm bg-primary-soft text-primary rounded-lg px-3 py-2.5 mb-5">
          <CircleCheck className="h-4 w-4 shrink-0" />
          {msg}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Dia de fechamento</Label>
            <Input
              type="number"
              min={1}
              max={28}
              value={diaFechamento}
              onChange={(e) => setDiaFechamento(Number(e.target.value))}
              className="max-w-[120px]"
              required
            />
            <p className="text-[11px] text-inksoft mt-1">
              Exemplo com dia {diaFechamento}: a folha de julho vai de {exemploInicio} a {exemploFim}.
            </p>
          </div>

          <Button type="submit" disabled={saving} className="self-start">
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
