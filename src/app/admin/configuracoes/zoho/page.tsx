'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ZohoConfigPage() {
  const search = useSearchParams();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [scope, setScope] = useState('');
  const [conectado, setConectado] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/settings/zoho');
    const data = await res.json();
    setClientId(data.clientId ?? '');
    setRedirectUri(data.redirectUri || `${window.location.origin}/api/integrations/zoho/callback`);
    setScope(data.scope || 'ZohoMail.messages.CREATE,ZohoMail.accounts.READ');
    setConectado(data.conectado);
    setConnectedEmail(data.connectedEmail);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (search.get('conectado')) setMsg('Conta Zoho conectada com sucesso.');
    if (search.get('erro')) setMsg(`Erro ao conectar: ${search.get('erro')}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings/zoho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, redirectUri, scope }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? 'Não foi possível salvar.');
        return;
      }
      setMsg('Configurações salvas. Agora clique em "Conectar com Zoho".');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-inksoft">Carregando...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="font-bold text-xl">Integração com o Zoho</h1>
      <p className="text-[13.5px] text-inksoft mt-1 mb-6">
        Usado para enviar e-mails de notificação (ex.: aprovação/reprovação de justificativa,
        resposta de chamado) a partir da conta Zoho Mail da empresa.
      </p>

      {msg && (
        <div className={`text-sm rounded-lg px-3 py-2.5 mb-5 ${conectado ? 'bg-primary-soft text-primary' : 'bg-info-soft text-info'}`}>
          {msg}
        </div>
      )}

      <div className="bg-white border border-line rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-bold text-sm">Status da conexão</div>
            <div className="text-xs text-inksoft mt-0.5">
              {conectado ? `Conectado${connectedEmail ? ` como ${connectedEmail}` : ''}` : 'Não conectado'}
            </div>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${conectado ? 'bg-primary-soft text-primary' : 'bg-warn-soft text-warn'}`}>
            {conectado ? 'Ativo' : 'Pendente'}
          </span>
        </div>

        <form onSubmit={salvar} className="flex flex-col gap-4">
          <Field label="Client ID">
            <input className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} required />
          </Field>
          <Field label="Client Secret">
            <input
              className="input"
              type="password"
              placeholder={conectado ? '•••••••• (definido)' : ''}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required={!conectado}
            />
          </Field>
          <Field label="Redirect URI">
            <input className="input" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} required />
            <p className="text-[11px] text-inksoft mt-1">
              Cadastre exatamente esta URL como "Redirect URI" no app criado em{' '}
              <span className="font-semibold">api-console.zoho.com</span>.
            </p>
          </Field>
          <Field label="Escopos (scope)">
            <input className="input" value={scope} onChange={(e) => setScope(e.target.value)} />
          </Field>

          <div className="flex gap-3 mt-2">
            <button disabled={saving} className="flex-1 border border-line rounded-lg py-3 text-sm font-bold disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
            <a
              href="/api/integrations/zoho/authorize"
              className="flex-1 text-center bg-primary text-white rounded-lg py-3 text-sm font-bold"
            >
              Conectar com Zoho
            </a>
          </div>
        </form>
      </div>

      <div className="text-[12px] text-inksoft mt-4 leading-relaxed">
        Passo a passo: crie um app "Server-based Applications" em api-console.zoho.com, copie o
        Client ID/Secret para os campos acima, salve, e só então clique em "Conectar com Zoho" —
        isso abre a tela de consentimento do Zoho e, ao aceitar, volta para cá com a conta ligada.
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-inksoft uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
