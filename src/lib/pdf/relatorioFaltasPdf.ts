import PDFDocument from 'pdfkit';
import type { FuncionarioFaltas } from '@/lib/relatorioFaltas';
import { formatDataCurta } from '@/lib/utils';

function formatMesAno(anoMes: string): string {
  const [ano, mes] = anoMes.split('-');
  return `${mes}/${ano}`;
}

// Agrupa as datas de falta (yyyy-MM-dd) por mês (yyyy-MM), guardando só o
// dia do mês (dd) — a tabela de detalhamento já mostra o mês na própria linha.
function agruparDiasPorMes(datasFalta: string[]): Map<string, string[]> {
  const porMes = new Map<string, string[]>();
  for (const data of datasFalta) {
    const anoMes = data.slice(0, 7);
    const dia = data.slice(8, 10);
    if (!porMes.has(anoMes)) porMes.set(anoMes, []);
    porMes.get(anoMes)!.push(dia);
  }
  return porMes;
}

const MARGEM = 40;
const LARGURA_UTIL = 595.28 - MARGEM * 2; // A4 retrato

function quebrarPaginaSeNecessario(doc: PDFKit.PDFDocument, linhasRestantesEstimadas = 1) {
  const alturaLinha = 14;
  const limite = doc.page.height - MARGEM;
  if (doc.y + linhasRestantesEstimadas * alturaLinha > limite) {
    doc.addPage();
  }
}

export async function gerarPdfRelatorioFaltas(params: {
  periodo: { dataInicio: string; dataFim: string };
  unidade?: string;
  funcionarios: FuncionarioFaltas[];
}): Promise<Buffer> {
  const { periodo, unidade, funcionarios } = params;

  const doc = new PDFDocument({ size: 'A4', margin: MARGEM });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.font('Helvetica-Bold').fontSize(16).text('Relatório de Faltas');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).fillColor('#444');
  doc.text(`Período: ${formatDataCurta(periodo.dataInicio)} a ${formatDataCurta(periodo.dataFim)}`);
  if (unidade && unidade !== 'Todas') doc.text(`Unidade: ${unidade}`);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  doc.fillColor('#000');
  doc.moveDown(1);

  // Tabela-resumo
  doc.font('Helvetica-Bold').fontSize(11).text('Resumo por funcionário');
  doc.moveDown(0.5);

  const colNome = MARGEM;
  const colUnidade = MARGEM + LARGURA_UTIL * 0.45;
  const colTotal = MARGEM + LARGURA_UTIL * 0.8;

  doc.font('Helvetica-Bold').fontSize(9);
  const yCabecalho = doc.y;
  doc.text('Funcionário', colNome, yCabecalho);
  doc.text('Unidade', colUnidade, yCabecalho);
  doc.text('Total no período', colTotal, yCabecalho);
  doc.y = yCabecalho + doc.currentLineHeight() + 4;
  doc.moveDown(0.3);
  doc.moveTo(MARGEM, doc.y).lineTo(MARGEM + LARGURA_UTIL, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(9);
  for (const f of funcionarios) {
    quebrarPaginaSeNecessario(doc);
    const y = doc.y;
    doc.text(f.nome, colNome, y, { width: colUnidade - colNome - 8 });
    doc.text(f.unidade ?? '—', colUnidade, y, { width: colTotal - colUnidade - 8 });
    doc.text(f.erro ? 'Erro RHiD' : String(f.totalPeriodo), colTotal, y);
    doc.y = y + doc.currentLineHeight() + 4;
  }

  // Detalhamento por funcionário com falta
  const comFalta = funcionarios.filter((f) => f.totalPeriodo > 0);
  if (comFalta.length > 0) {
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(11).text('Detalhamento das faltas');
    doc.moveDown(0.5);

    const colMes = MARGEM + 10;
    const colQtd = MARGEM + 110;
    const colDias = MARGEM + 155;
    const larguraDias = MARGEM + LARGURA_UTIL - colDias;

    for (const f of comFalta) {
      quebrarPaginaSeNecessario(doc, 4);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000').text(`${f.nome}${f.unidade ? ` — ${f.unidade}` : ''}`);
      doc.font('Helvetica').fontSize(9).fillColor('#444').text(`Total no período: ${f.totalPeriodo}`);
      doc.fillColor('#000');
      doc.moveDown(0.3);

      // Uma linha por mês — mais legível que uma única linha corrida com
      // todas as datas do período inteiro.
      const diasPorMes = agruparDiasPorMes(f.datasFalta);

      doc.font('Helvetica-Bold').fontSize(8);
      const yCabecalhoMes = doc.y;
      doc.text('Mês', colMes, yCabecalhoMes);
      doc.text('Qtd', colQtd, yCabecalhoMes);
      doc.text('Dias do mês', colDias, yCabecalhoMes);
      doc.y = yCabecalhoMes + doc.currentLineHeight() + 2;

      doc.font('Helvetica').fontSize(8);
      for (const m of f.porMes) {
        quebrarPaginaSeNecessario(doc, 2);
        const y = doc.y;
        doc.text(formatMesAno(m.anoMes), colMes, y, { width: colQtd - colMes - 4 });
        doc.text(String(m.quantidade), colQtd, y, { width: colDias - colQtd - 4 });
        doc.text((diasPorMes.get(m.anoMes) ?? []).join(', '), colDias, y, { width: larguraDias });
      }

      doc.moveDown(0.8);
    }
  }

  doc.end();
  return done;
}
