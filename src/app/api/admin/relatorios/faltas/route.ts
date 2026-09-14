import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { gerarRelatorioFaltas } from '@/lib/relatorioFaltas';
import { gerarPdfRelatorioFaltas } from '@/lib/pdf/relatorioFaltasPdf';
import { paraCsv } from '@/lib/csv';
import { formatDataCurta } from '@/lib/utils';

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const RANGE_MAXIMO_DIAS = 366;

function diasEntre(dataInicio: string, dataFim: string): number {
  const ini = new Date(`${dataInicio}T00:00:00`);
  const fim = new Date(`${dataFim}T00:00:00`);
  return Math.round((fim.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMesAno(anoMes: string): string {
  const [ano, mes] = anoMes.split('-');
  return `${mes}/${ano}`;
}

// GET /api/admin/relatorios/faltas?dataInicio=&dataFim=&unidade=&funcionarioIds=&ignorarJustificativas=&formato=json|csv|pdf
// `funcionarioIds` e `ignorarJustificativas` aceitam múltiplos valores
// (repita o parâmetro ou separe por vírgula).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const dataInicio = searchParams.get('dataInicio') ?? '';
  const dataFim = searchParams.get('dataFim') ?? '';
  const unidade = searchParams.get('unidade') ?? undefined;
  const formato = searchParams.get('formato') ?? 'json';
  const funcionarioIds = searchParams
    .getAll('funcionarioIds')
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);
  const ignorarJustificativas = searchParams
    .getAll('ignorarJustificativas')
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);

  if (!DATA_REGEX.test(dataInicio) || !DATA_REGEX.test(dataFim)) {
    return NextResponse.json({ error: 'Informe dataInicio e dataFim no formato yyyy-MM-dd.' }, { status: 400 });
  }
  if (dataInicio > dataFim) {
    return NextResponse.json({ error: 'dataInicio não pode ser depois de dataFim.' }, { status: 400 });
  }
  if (diasEntre(dataInicio, dataFim) > RANGE_MAXIMO_DIAS) {
    return NextResponse.json({ error: `Período máximo de ${RANGE_MAXIMO_DIAS} dias.` }, { status: 400 });
  }

  const { funcionarios, tiposJustificativaEncontrados } = await gerarRelatorioFaltas({
    dataInicio,
    dataFim,
    unidade,
    funcionarioIds,
    ignorarJustificativas,
  });

  if (formato === 'csv') {
    const linhas: string[][] = [
      ['Funcionário', 'Unidade', 'Cargo', 'Data da Falta', 'Mês/Ano', 'Faltas no Mês', 'Faltas no Período'],
    ];
    for (const f of funcionarios) {
      if (f.datasFalta.length === 0) {
        linhas.push([f.nome, f.unidade ?? '', f.cargo ?? '', '', '', '', String(f.totalPeriodo)]);
        continue;
      }
      const quantidadePorMes = new Map(f.porMes.map((m) => [m.anoMes, m.quantidade]));
      for (const data of f.datasFalta) {
        const anoMes = data.slice(0, 7);
        linhas.push([
          f.nome,
          f.unidade ?? '',
          f.cargo ?? '',
          formatDataCurta(data),
          formatMesAno(anoMes),
          String(quantidadePorMes.get(anoMes) ?? ''),
          String(f.totalPeriodo),
        ]);
      }
    }

    const csv = '﻿' + paraCsv(linhas);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-faltas-${dataInicio}-a-${dataFim}.csv"`,
      },
    });
  }

  if (formato === 'pdf') {
    const buffer = await gerarPdfRelatorioFaltas({ periodo: { dataInicio, dataFim }, unidade, funcionarios });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-faltas-${dataInicio}-a-${dataFim}.pdf"`,
      },
    });
  }

  return NextResponse.json({
    periodo: { dataInicio, dataFim, unidade },
    funcionarios,
    tiposJustificativaEncontrados,
  });
}
