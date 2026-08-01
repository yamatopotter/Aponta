export interface RankingRow {
  key: string;
  label: string;
  sublabel?: string | null;
  quantidade: number;
}

// Tabela de ranking reutilizável — "top departamentos" e "funcionários com
// pendência recorrente" têm a mesma forma (rótulo + contador), então uma
// tabela genérica evita duplicar markup entre as duas seções do dashboard.
export default function RankingTable({ rows, vazio }: { rows: RankingRow[]; vazio: string }) {
  if (rows.length === 0) {
    return <p className="text-[12.5px] text-inksoft py-6 text-center">{vazio}</p>;
  }

  return (
    <table className="w-full text-[13px]">
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-line last:border-0">
            <td className="py-2.5 pr-3">
              <div className="font-semibold text-ink">{row.label}</div>
              {row.sublabel && <div className="text-[11.5px] text-inksoft">{row.sublabel}</div>}
            </td>
            <td className="py-2.5 text-right font-bold text-ink tabular-nums">{row.quantidade}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
