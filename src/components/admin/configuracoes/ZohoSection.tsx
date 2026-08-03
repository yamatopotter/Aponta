'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ZohoSection() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [configurado, setConfigurado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [origem, setOrigem] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/settings/zoho');
    const data = await res.json();
    setClientId(data.clientId ?? '');
    setConfigurado(data.configurado);
    setLoading(false);
  }

  useEffect(() => {
    load();
    setOrigem(window.location.origin);
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings/zoho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? 'Não foi possível salvar.');
        return;
      }
      setMsg('Configurações salvas.');
      setConfigurado(true);
      setClientSecret('');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-inksoft">Carregando...</p>;

  return (
    <div className="max-w-xl">
      <p className="text-[13.5px] text-inksoft mb-5">
        Usado só para o login de administradores via Zoho OAuth (aba &ldquo;Sou do RH&rdquo; →
        &ldquo;Entrar com Zoho&rdquo;, na tela de login) — não envia e-mail.
      </p>

      {msg && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 mb-5 ${
            configurado ? 'bg-primary-soft text-primary' : 'bg-info-soft text-info'
          }`}
        >
          {configurado ? <CircleCheck className="h-4 w-4 shrink-0" /> : <Info className="h-4 w-4 shrink-0" />}
          {msg}
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-bold text-sm">Status</div>
            <div className="text-xs text-inksoft mt-0.5">{configurado ? 'Configurado' : 'Não configurado'}</div>
          </div>
          <Badge variant={configurado ? 'default' : 'warn'}>{configurado ? 'Ativo' : 'Pendente'}</Badge>
        </div>

        <form onSubmit={salvar} className="flex flex-col gap-4">
          <Field label="Client ID">
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} required />
          </Field>
          <Field label="Client Secret">
            <Input
              type="password"
              placeholder={configurado ? '•••••••• (definido)' : ''}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required={!configurado}
            />
          </Field>

          <div className="text-[11px] text-inksoft bg-muted rounded-lg px-3 py-2.5">
            Cadastre exatamente esta URL como &ldquo;Redirect URI&rdquo; no app criado em{' '}
            <span className="font-semibold">api-console.zoho.com</span>:
            <div className="font-mono mt-1 break-all">{origem}/api/auth/zoho/callback</div>
          </div>

          <Button type="submit" variant="outline" disabled={saving} className="bg-white">
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </form>
      </Card>

      <div className="text-[12px] text-inksoft mt-4 leading-relaxed">
        Passo a passo: crie um app &ldquo;Server-based Applications&rdquo; em api-console.zoho.com, cadastre a
        URL de redirecionamento acima, copie o Client ID/Secret para os campos e salve. A partir daí,
        qualquer AdminUser com e-mail cadastrado (ver aba &ldquo;Administradores&rdquo;) pode entrar pelo botão
        &ldquo;Entrar com Zoho&rdquo; na tela de login.
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
