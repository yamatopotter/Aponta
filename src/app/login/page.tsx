'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'funcionario' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next');

  const [tab, setTab] = useState<Tab>('funcionario');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cpf, setCpf] = useState('');
  const [senhaFuncionario, setSenhaFuncionario] = useState('');

  const [username, setUsername] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === 'funcionario' ? '/api/auth/login-cpf' : '/api/auth/login-admin';
      const body =
        tab === 'funcionario'
          ? { cpf, senha: senhaFuncionario }
          : { username, senha: senhaAdmin };

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
      <div className="w-full max-w-sm bg-white border border-line rounded-xl2 p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary text-white font-bold flex items-center justify-center text-sm">
            EF
          </div>
          <div>
            <div className="font-bold text-[15px]">Evora Farma</div>
            <div className="text-xs text-inksoft">Ponto e chamados com o RH</div>
          </div>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
          <button
            className={`flex-1 text-sm font-semibold py-2 rounded-md transition ${
              tab === 'funcionario' ? 'bg-white shadow-sm text-ink' : 'text-inksoft'
            }`}
            onClick={() => setTab('funcionario')}
            type="button"
          >
            Sou funcionário
          </button>
          <button
            className={`flex-1 text-sm font-semibold py-2 rounded-md transition ${
              tab === 'admin' ? 'bg-white shadow-sm text-ink' : 'text-inksoft'
            }`}
            onClick={() => setTab('admin')}
            type="button"
          >
            Sou do RH
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === 'funcionario' ? (
            <>
              <Field label="CPF">
                <input
                  className="input"
                  inputMode="numeric"
                  placeholder="Somente números"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
              </Field>
              <Field label="Senha">
                <input
                  className="input"
                  type="password"
                  placeholder="No 1º acesso, use seu CPF"
                  value={senhaFuncionario}
                  onChange={(e) => setSenhaFuncionario(e.target.value)}
                  required
                />
              </Field>
              <p className="text-[11.5px] text-inksoft -mt-1">
                No primeiro acesso, a senha provisória é o seu CPF (só números). Você vai trocar
                assim que entrar.
              </p>
            </>
          ) : (
            <>
              <Field label="Usuário">
                <input
                  className="input"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field>
              <Field label="Senha">
                <input
                  className="input"
                  type="password"
                  value={senhaAdmin}
                  onChange={(e) => setSenhaAdmin(e.target.value)}
                  required
                />
              </Field>
            </>
          )}

          {error && <div className="text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-primary text-white font-bold text-sm rounded-lg py-3 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-inksoft uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
