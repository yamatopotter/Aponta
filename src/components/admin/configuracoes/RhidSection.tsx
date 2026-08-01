'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Info, Loader2, RefreshCw, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RhidSection() {
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [integrationEmail, setIntegrationEmail] = useState('');
  const [integrationPassword, setIntegrationPassword] = useState('');
  const [conectado, setConectado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/settings/rhid');
    const data = await res.json();
    setApiBaseUrl(data.apiBaseUrl ?? '');
    setIntegrationEmail(data.integrationEmail ?? '');
    setConectado(data.conectado);
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
      const res = await fetch('/api/admin/settings/rhid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiBaseUrl, integrationEmail, integrationPassword: integrationPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ tipo: 'erro', texto: data.error ?? 'Não foi possível salvar.' });
        return;
      }
      setIntegrationPassword('');
      setMsg({ tipo: 'ok', texto: 'Configurações salvas. Use "Testar conexão" para confirmar o login no RHiD.' });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function testarConexao() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/rhid/test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ tipo: 'erro', texto: data.error ?? 'Falha ao conectar no RHiD.' });
        return;
      }
      setMsg({ tipo: 'ok', texto: `Conectado! ${data.totalPessoas} pessoa(s) encontrada(s) no RHiD.` });
    } finally {
      setTesting(false);
    }
  }

  async function sincronizarAgora() {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/rhid/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ tipo: 'erro', texto: data.error ?? 'Falha ao sincronizar com o RHiD.' });
        return;
      }
      const resumo = `Sincronizado: ${data.empresas.total} empresa(s), ${data.departamentos.total} departamento(s), ${data.funcionarios.total} funcionário(s) (${data.funcionarios.criados} novo(s), ${data.funcionarios.atualizados} atualizado(s)).`;
      if (data.estruturaErro) {
        setMsg({
          tipo: 'erro',
          texto: `Funcionários sincronizados, mas empresas/departamentos falharam: ${data.estruturaErro}`,
        });
      } else {
        setMsg({ tipo: 'ok', texto: resumo });
      }
    } finally {
      setSyncing(false);
    }
  }

  if (loading) return <p className="text-sm text-inksoft">Carregando...</p>;

  return (
    <div className="max-w-xl">
      <p className="text-[13.5px] text-inksoft mb-5">
        Credencial do usuário de integração usado para logar no RHiD e puxar o cadastro de
        pessoas e a apuração de ponto. Peça ao suporte RHiD/Control iD um usuário dedicado a
        isso — não use o login pessoal de um administrador.
      </p>

      {msg && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 mb-5 ${
            msg.tipo === 'ok' ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger'
          }`}
        >
          {msg.tipo === 'ok' ? <CircleCheck className="h-4 w-4 shrink-0" /> : <Info className="h-4 w-4 shrink-0" />}
          {msg.texto}
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-bold text-sm">Status da credencial</div>
            <div className="text-xs text-inksoft mt-0.5">
              {conectado ? 'E-mail e senha de integração configurados' : 'Ainda não configurada'}
            </div>
          </div>
          <Badge variant={conectado ? 'default' : 'warn'}>{conectado ? 'Configurada' : 'Pendente'}</Badge>
        </div>

        <form onSubmit={salvar} className="flex flex-col gap-4">
          <Field label="URL base da API">
            <Input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://www.rhid.com.br/v2/api.svc"
              required
            />
          </Field>
          <Field label="E-mail de integração">
            <Input
              type="email"
              value={integrationEmail}
              onChange={(e) => setIntegrationEmail(e.target.value)}
              placeholder="integracao@evorafarma.com.br"
              required
            />
          </Field>
          <Field label="Senha de integração">
            <Input
              type="password"
              placeholder={conectado ? '•••••••• (definida)' : ''}
              value={integrationPassword}
              onChange={(e) => setIntegrationPassword(e.target.value)}
              required={!conectado}
            />
            <p className="text-[11px] text-inksoft mt-1">
              Deixe em branco para manter a senha já salva. Fica criptografada em repouso.
            </p>
          </Field>

          <div className="flex gap-3 mt-2">
            <Button type="submit" variant="outline" disabled={saving} className="flex-1 bg-white">
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </Button>
            <Button type="button" onClick={testarConexao} disabled={testing || !conectado} className="flex-1">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {testing ? 'Testando...' : 'Testar conexão'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-sm">Sincronizar empresas, departamentos e funcionários</div>
            <div className="text-xs text-inksoft mt-0.5">
              Puxa empresas e departamentos primeiro (viram as opções de "unidade"), depois o
              cadastro de pessoas. Roda automaticamente também pelo worker — veja o resultado em{' '}
              <span className="font-semibold">Funcionários</span>.
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={sincronizarAgora} disabled={syncing || !conectado} className="shrink-0">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </Button>
        </div>
      </Card>
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
