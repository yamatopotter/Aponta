'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (novaSenha !== confirmacao) {
      setError('As senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível trocar a senha.');
        return;
      }
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-line rounded-xl2 p-7 shadow-sm flex flex-col gap-4">
        <div>
          <h1 className="font-bold text-lg">Defina sua nova senha</h1>
          <p className="text-[13px] text-inksoft mt-1">
            Por segurança, é preciso trocar a senha provisória antes de continuar.
          </p>
        </div>
        <input
          className="input"
          type="password"
          placeholder="Nova senha (mín. 6 caracteres)"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Confirme a nova senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          required
        />
        {error && <div className="text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">{error}</div>}
        <button disabled={loading} className="bg-primary text-white font-bold text-sm rounded-lg py-3 disabled:opacity-60">
          {loading ? 'Salvando...' : 'Salvar e continuar'}
        </button>
      </form>
    </div>
  );
}
