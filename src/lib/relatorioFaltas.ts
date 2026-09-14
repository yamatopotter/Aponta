import { prisma } from './prisma';
import { getApuracaoPonto, type ApuracaoDia } from './rhid';
import { paraDataCurta, hojeCurto } from './utils';

// Relatório de faltas (RH): quais dias, no período, um funcionário ativo
// ficou com 0 hora trabalhada apesar de ter escala naquele dia.
//
// IMPORTANTE: a fonte é só a apuração do RHiD, não a Justificativa local do
// Aponta. Duas descobertas (inspecionando uma resposta real da API, com o
// funcionário "Matheus Pereira Barreto" e um afastamento de vários dias)
// moldaram o critério abaixo:
//
// 1. `faltaDiaInteiro`/`possuiPendencias` NÃO servem: quando uma falta é
//    abonada no RHiD (ex.: "ABONADO PELO GESTOR"), esses campos são
//    zerados — um critério baseado neles subcontaria faltas já resolvidas.
// 2. `listAfdtManutencao` (as "marcações" do dia) NÃO serve por si só: tanto
//    numa falta em aberto quanto numa já abonada, o RHiD PREENCHE o dia com
//    marcações sintéticas (`_typeRegister: "I"` = inserida pelo motor,
//    contra `"O"` = batida real do relógio; a abonada ainda carrega
//    `idJustification`/`abreviationJustification` explicando o abono). Ou
//    seja, um dia 100% abonado aparece com `listAfdtManutencao.length > 0`
//    mesmo sem nenhuma marcação real — por isso não dá pra usar só a
//    presença de marcações (nem o helper `marcacoesReais` de
//    DivergenciasFolha, que resolve um problema parecido mas só quando
//    `faltaDiaInteiro=true`).
// 3. O sinal que realmente reflete "não trabalhou esse dia", em aberto ou
//    abonado, é `totalHorasTrabalhadas === 0` — inclusive cobre o caso de
//    uma batida real isolada sem par (ex.: entrada sem saída, seguida de
//    abono do resto do dia): o RHiD já zera as horas do dia todo.
// 4. `folga`/`holiday` também NÃO são confiáveis pra excluir fim de
//    semana/feriado (conferido com dados reais: `folga` vem sempre false,
//    inclusive em sábados/domingos). O sinal confiável pra "dia sem escala"
//    é `strHorarioContratualSimples` vir vazio — acontece exatamente nos
//    dias em que o funcionário não tem expediente previsto (fim de semana,
//    feriado, folga configurada).
// 5. Só conta falta a partir do primeiro dia com marcação real (com hora
//    trabalhada) dentro do período consultado — dias antes disso (ex.:
//    funcionário admitido no meio do período, mas com escala já cadastrada
//    retroativamente no RHiD) não têm como ser falta, porque não dá pra
//    saber se ele já tinha começado a trabalhar. Se o funcionário não tiver
//    NENHUM dia com hora trabalhada no período todo, nenhum dia conta como
//    falta (não tem como diferenciar "afastado o período inteiro" de "sem
//    dado de ponto ainda").
// 6. Nem todo dia com 0h é falta de verdade: férias, atestado médico,
//    afastamento INSS etc. usam o MESMO mecanismo do item 2 (marcações
//    sintéticas cobrindo o dia) — o RHiD grava o tipo de justificativa
//    aplicado em `abreviationJustification`. Como isso é configurável por
//    cliente no RHiD (cadastro de tipos de justificativa) e o RH decidiu que
//    quer escolher na hora quais tipos ignorar (em vez de uma lista fixa no
//    código), o candidato a falta guarda os tipos encontrados nesse dia e
//    quem decide o que ignorar é o parâmetro `ignorarJustificativas`.
export interface FuncionarioFaltas {
  employeeId: string;
  nome: string;
  unidade: string | null;
  cargo: string | null;
  datasFalta: string[]; // yyyy-MM-dd, ordenado
  totalPeriodo: number;
  porMes: { anoMes: string; quantidade: number }[]; // "YYYY-MM"
  erro?: string; // falha ao consultar o RHiD pra esse funcionário
}

export interface RelatorioFaltas {
  funcionarios: FuncionarioFaltas[];
  // Tipos de justificativa do RHiD encontrados nos dias candidatos a falta
  // do período (ex.: "Ferias", "Medico", "ABONADO PELO GESTOR") — sempre
  // reflete o universo completo, independente do que já foi marcado pra
  // ignorar, pra alimentar o filtro na tela sem ele "encolher" a cada escolha.
  tiposJustificativaEncontrados: string[];
}

function addDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Divide o período em janelas de até 90 dias (limite do /apuracao_ponto do RHiD).
function janelasDe90Dias(dataInicio: string, dataFim: string): { inicio: string; fim: string }[] {
  const janelas: { inicio: string; fim: string }[] = [];
  let inicio = dataInicio;
  while (inicio <= dataFim) {
    const fimJanela = addDias(inicio, 89);
    const fim = fimJanela < dataFim ? fimJanela : dataFim;
    janelas.push({ inicio, fim });
    inicio = addDias(fim, 1);
  }
  return janelas;
}

// Processa em lotes pra não disparar uma chamada simultânea ao RHiD por
// funcionário — não há endpoint em lote no RHiD para apuração de ponto.
async function emLotes<T, R>(items: T[], tamanhoLote: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = [];
  for (let i = 0; i < items.length; i += tamanhoLote) {
    const lote = items.slice(i, i + tamanhoLote);
    resultados.push(...(await Promise.all(lote.map(fn))));
  }
  return resultados;
}

function ehCandidatoAFalta(dia: ApuracaoDia, hoje: string): boolean {
  const data = paraDataCurta(dia.date);
  // Hoje nunca conta — o dia ainda não terminou (mesmo critério de
  // DivergenciasFolha.tsx pra não marcar um dia em andamento como divergência).
  if (data >= hoje) return false;

  // Dia sem escala (fim de semana/feriado/folga) não conta — ver nota 4 acima.
  const temEscala = Boolean(dia.strHorarioContratualSimples?.trim());
  if (!temEscala) return false;
  if (dia.folga || dia.holiday) return false;

  return (dia.totalHorasTrabalhadas ?? 0) === 0;
}

// Tipos de justificativa do RHiD aplicados nas marcações desse dia (ex.:
// "Ferias", "Medico", "ABONADO PELO GESTOR") — ver nota 6 acima.
function justificativasDoDia(dia: ApuracaoDia): string[] {
  return (dia.listAfdtManutencao ?? [])
    .map((m) => m.abreviationJustification)
    .filter((j): j is string => Boolean(j && j.trim()));
}

// Normaliza pra comparar sem se importar com maiúscula/minúscula ou acento
// (o RH escolhe o tipo a ignorar por nome, digitado como aparece no RHiD).
// Faixa Unicode dos acentos combinantes (0x0300–0x036f) — construída via
// String.fromCharCode pra evitar literal fora do ASCII no código-fonte.
const RANGE_ACENTOS_COMBINANTES = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g'
);

function normalizarTexto(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(RANGE_ACENTOS_COMBINANTES, '');
}

export async function gerarRelatorioFaltas(params: {
  dataInicio: string;
  dataFim: string;
  unidade?: string;
  funcionarioIds?: string[]; // filtro opcional — ex.: excluir coordenadores que não batem ponto
  ignorarJustificativas?: string[]; // ex.: ["Ferias", "Medico"] — não conta falta nesses dias
}): Promise<RelatorioFaltas> {
  const { dataInicio, dataFim, unidade, funcionarioIds, ignorarJustificativas } = params;

  const funcionarios = await prisma.employee.findMany({
    where: {
      ativo: true,
      ...(unidade && unidade !== 'Todas' ? { unidade } : {}),
      ...(funcionarioIds && funcionarioIds.length > 0 ? { id: { in: funcionarioIds } } : {}),
    },
    orderBy: { nome: 'asc' },
  });

  const janelas = janelasDe90Dias(dataInicio, dataFim);
  const hoje = hojeCurto();
  const tiposIgnorar = new Set((ignorarJustificativas ?? []).map(normalizarTexto));
  const tiposEncontrados = new Set<string>();

  const resultados = await emLotes(funcionarios, 5, async (funcionario): Promise<FuncionarioFaltas> => {
    try {
      const dias = (
        await Promise.all(
          janelas.map((janela) =>
            getApuracaoPonto({ idPerson: funcionario.rhidPersonId, dataIni: janela.inicio, dataFinal: janela.fim })
          )
        )
      ).flat();

      // Primeiro dia com hora trabalhada no período — ver nota 5 acima.
      // Antes dele (ou se não existir nenhum), nada conta como falta.
      const diasComMarcacao = dias
        .filter((dia) => (dia.totalHorasTrabalhadas ?? 0) > 0)
        .map((dia) => paraDataCurta(dia.date))
        .sort();
      const primeiroDiaComMarcacao = diasComMarcacao[0];

      const candidatos = primeiroDiaComMarcacao
        ? dias.filter((dia) => ehCandidatoAFalta(dia, hoje) && paraDataCurta(dia.date) >= primeiroDiaComMarcacao)
        : [];

      const datasFalta: string[] = [];
      for (const dia of candidatos) {
        const tipos = justificativasDoDia(dia);
        for (const tipo of tipos) tiposEncontrados.add(tipo);

        const ignorarEsteDia = tipos.some((tipo) => tiposIgnorar.has(normalizarTexto(tipo)));
        if (!ignorarEsteDia) datasFalta.push(paraDataCurta(dia.date));
      }
      datasFalta.sort();

      const contagemPorMes = new Map<string, number>();
      for (const data of datasFalta) {
        const anoMes = data.slice(0, 7);
        contagemPorMes.set(anoMes, (contagemPorMes.get(anoMes) ?? 0) + 1);
      }
      const porMes = Array.from(contagemPorMes.entries())
        .map(([anoMes, quantidade]) => ({ anoMes, quantidade }))
        .sort((a, b) => a.anoMes.localeCompare(b.anoMes));

      return {
        employeeId: funcionario.id,
        nome: funcionario.nome,
        unidade: funcionario.unidade,
        cargo: funcionario.cargo,
        datasFalta,
        totalPeriodo: datasFalta.length,
        porMes,
      };
    } catch (e) {
      return {
        employeeId: funcionario.id,
        nome: funcionario.nome,
        unidade: funcionario.unidade,
        cargo: funcionario.cargo,
        datasFalta: [],
        totalPeriodo: 0,
        porMes: [],
        erro: e instanceof Error ? e.message : 'Falha ao consultar o RHiD.',
      };
    }
  });

  return {
    funcionarios: resultados,
    tiposJustificativaEncontrados: Array.from(tiposEncontrados).sort(),
  };
}
