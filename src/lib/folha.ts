// Cálculo do período de uma "folha" a partir do dia de fechamento configurado
// em FolhaConfig (ex.: RH → Configurações → Folha). O período é identificado
// pelo ano/mês em que ele FECHA — ex.: diaFechamento=20 → a folha "de julho"
// cobre 21/06 a 20/07.

export interface PeriodoFolha {
  ano: number;
  mes: number; // 1–12, mês em que o período fecha
  inicio: string; // yyyy-MM-dd
  fim: string; // yyyy-MM-dd
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function calcularPeriodo(ano: number, mes: number, diaFechamento: number): PeriodoFolha {
  const fim = new Date(ano, mes - 1, diaFechamento);
  const inicio = new Date(ano, mes - 2, diaFechamento + 1);
  return { ano, mes, inicio: formatDate(inicio), fim: formatDate(fim) };
}

// Confirmação da folha só é permitida no dia de fechamento do período —
// antes disso a apuração do mês ainda não fechou (dias faltando), então
// "confirmar que está tudo certo" não faz sentido ainda.
export function podeAssinarHoje(periodo: PeriodoFolha, referencia = new Date()): boolean {
  return formatDate(referencia) === periodo.fim;
}

// Em qual período (ano/mês de fechamento) a data de referência (padrão: hoje) cai.
export function periodoReferencia(diaFechamento: number, referencia = new Date()): { ano: number; mes: number } {
  let ano = referencia.getFullYear();
  let mes = referencia.getMonth() + 1;
  if (referencia.getDate() > diaFechamento) {
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return { ano, mes };
}
