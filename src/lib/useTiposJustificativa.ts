'use client';

import { useEffect, useState } from 'react';

export type TipoJustificativa = { id: string; label: string };

// Lista de tipos de justificativa ativos (cadastrados em /admin/configuracoes,
// aba Tipos) — mesmo padrão de src/lib/useUnidades.ts. Usado no formulário de
// nova justificativa do funcionário.
export function useTiposJustificativa() {
  const [tipos, setTipos] = useState<TipoJustificativa[]>([]);

  useEffect(() => {
    fetch('/api/tipos-justificativa')
      .then((res) => (res.ok ? res.json() : []))
      .then(setTipos)
      .catch(() => {});
  }, []);

  return tipos;
}
