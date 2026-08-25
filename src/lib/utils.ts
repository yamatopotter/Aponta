import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function excerpt(text: string, max = 90) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// yyyy-MM-dd, sem depender de fuso horário — usado pra comparar datas de
// apuração (que vêm do RHiD) com o dia de hoje.
export function paraDataCurta(iso: string) {
  return iso.slice(0, 10);
}

export function hojeCurto() {
  return new Date().toLocaleDateString('en-CA'); // yyyy-MM-dd em horário local
}

// Formata uma data "de calendário" (ex.: Justificativa.dataOcorrencia,
// salva como meia-noite UTC) pro padrão brasileiro sem risco de cair um dia
// por causa do fuso — nunca usar `new Date(iso).toLocaleDateString()` direto
// pra isso: interpretado em UTC e formatado no fuso local (ex. UTC-3 no
// Brasil), o dia 12 vira 11 na tela. Aqui é só manipulação de string, sem
// passar por Date nenhuma.
export function formatDataCurta(iso: string) {
  const [ano, mes, dia] = paraDataCurta(iso).split('-');
  return `${dia}/${mes}/${ano}`;
}

// Campos que já vêm em CADA dia de GET /apuracao_ponto (motor ACJEF do
// RHiD) mas que o app não usava — não documentados no swagger, achados
// inspecionando uma resposta real. `strHorarioContratualSimples` é o
// horário contratual esperado do dia, formato "HH:mm-HH:mm" por turno,
// separados por "\r\n" quando tem intervalo (ex.: "08:00-12:00\r\n13:00-17:48").
export type ApuracaoAlertaFields = {
  atrasoEntrada?: number; // minutos
  saidaAntecipada?: number; // minutos
  strHorarioContratualSimples?: string | null;
  toolTipAlert?: string | null;
  faltaDiaInteiro?: boolean;
};

function primeiroHorarioEsperado(str?: string | null): string | null {
  if (!str) return null;
  const primeiraLinha = str.split(/\r?\n/)[0];
  return primeiraLinha?.split('-')[0]?.trim() || null;
}

// Descreve POR QUE um dia está com pendência, com o máximo de precisão que
// os dados permitem. Importante: isso só formata a explicação — quem decide
// SE o dia é uma divergência continua sendo `possuiPendencias`/
// `faltaDiaInteiro`, calculados pelo RHiD (ele já aplica a tolerância
// configurada da empresa; recalcular isso aqui poderia divergir do valor
// oficial usado na folha de pagamento).
export function descreverDivergencia(dia: ApuracaoAlertaFields): string {
  if (dia.faltaDiaInteiro) return 'Falta no dia';

  const partes: string[] = [];
  if (dia.atrasoEntrada && dia.atrasoEntrada > 0) {
    const esperado = primeiroHorarioEsperado(dia.strHorarioContratualSimples);
    partes.push(`Atraso de ${dia.atrasoEntrada}min${esperado ? ` (esperado ${esperado})` : ''}`);
  }
  if (dia.saidaAntecipada && dia.saidaAntecipada > 0) {
    partes.push(`Saída ${dia.saidaAntecipada}min antes do esperado`);
  }
  if (partes.length > 0) return partes.join(' · ');

  return dia.toolTipAlert || 'Pendência de apuração';
}

// "08:00-12:00\r\n13:00-17:48" -> "08:00–12:00 e 13:00–17:48"
export function formatHorarioContratual(str?: string | null): string | null {
  if (!str) return null;
  return str
    .split(/\r?\n/)
    .map((turno) => turno.trim().replace('-', '–'))
    .filter(Boolean)
    .join(' e ');
}
