'use client';

import { useEffect, useState } from 'react';

// Lista de unidades (nomes de Departamento sincronizados do RHiD) pros
// filtros em Justificativas/Chamados/Funcionários — sempre com "Todas" na frente.
export function useUnidades() {
  const [unidades, setUnidades] = useState<string[]>(['Todas']);

  useEffect(() => {
    fetch('/api/admin/departamentos')
      .then((res) => (res.ok ? res.json() : []))
      .then((deps: { nome: string }[]) => setUnidades(['Todas', ...deps.map((d) => d.nome)]))
      .catch(() => {});
  }, []);

  return unidades;
}
