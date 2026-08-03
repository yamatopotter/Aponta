'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';

import LogoMark from '@/components/LogoMark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Tab = 'funcionario' | 'admin';

const ERRO_ZOHO_MENSAGEM: Record<string, string> = {
  nao_configurado: 'Login via Zoho ainda não foi configurado. Fale com um Admin.',
  nao_cadastrado: 'Esse e-mail não tem acesso a este sistema. Fale com o RH.',
  estado_invalido: 'A sessão do login expirou, tenta de novo.',
  falha: 'Não foi possível entrar com o Zoho.',
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next');
  const erroZoho = search.get('erroZoho');

  const [tab, setTab] = useState<Tab>(erroZoho ? 'admin' : 'funcionario');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(erroZoho ? (ERRO_ZOHO_MENSAGEM[erroZoho] ?? ERRO_ZOHO_MENSAGEM.falha) : null);

  const [cpf, setCpf] = useState('');

  const [username, setUsername] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');

  useEffect(() => {
    if (erroZoho) {
      setTab('admin');
      setError(ERRO_ZOHO_MENSAGEM[erroZoho] ?? ERRO_ZOHO_MENSAGEM.falha);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erroZoho]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === 'funcionario' ? '/api/auth/login-cpf' : '/api/auth/login-admin';
      const body = tab === 'funcionario' ? { cpf } : { username, senha: senhaAdmin };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Não foi possível entrar.');
        return;
      }

      if (data.mustChangePassword) {
        router.push('/trocar-senha');
        return;
      }

      router.push(next ?? (tab === 'funcionario' ? '/ponto' : '/admin/justificativas'));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center p-1.5">
            <LogoMark className="w-full h-full" />
          </div>
          <div>
            <div className="font-bold text-[15px]">Aponta</div>
            <div className="text-xs text-inksoft">Ponto e chamados com o RH</div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="funcionario">Sou funcionário</TabsTrigger>
            <TabsTrigger value="admin">Sou do RH</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TabsContent value="funcionario" className="flex flex-col gap-4 mt-0">
              <Field label="CPF">
                <Input
                  inputMode="numeric"
                  placeholder="Somente números"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
              </Field>
              <p className="text-[11.5px] text-inksoft -mt-1">
                Basta o seu CPF, sem senha.
              </p>
            </TabsContent>

            <TabsContent value="admin" className="flex flex-col gap-4 mt-0">
              <Field label="Usuário">
                <Input placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </Field>
              <Field label="Senha">
                <Input type="password" value={senhaAdmin} onChange={(e) => setSenhaAdmin(e.target.value)} required />
              </Field>
            </TabsContent>

            {error && (
              <div className="flex items-center gap-2 text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {tab === 'admin' ? (
              <>
                <Button type="submit" disabled={loading} size="lg" className="mt-1">
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                <div className="flex items-center gap-3 -my-1">
                  <Separator className="flex-1" />
                  <span className="text-[11px] font-semibold text-inksoft uppercase tracking-wide">ou</span>
                  <Separator className="flex-1" />
                </div>
                <Button type="button" variant="outline" size="lg" className="bg-white" asChild>
                  <a href="/api/auth/zoho/authorize">Entrar com Zoho</a>
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={loading} size="lg" className="mt-1">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            )}
          </form>
        </Tabs>
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
