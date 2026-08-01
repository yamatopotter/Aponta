'use client';

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

// Barra horizontal genérica pra distribuições de uma categoria (status, tipo).
// Cada item já traz sua própria cor — usada tanto pra "status" (cores fixas e
// reservadas, reaproveitando as mesmas de src/components/ui/badge.tsx) quanto
// pra categorias neutras (uma única cor repetida em todos os itens).
export default function BreakdownBarChart({ items, height = 44 }: { items: BreakdownItem[]; height?: number }) {
  const total = items.reduce((soma, i) => soma + i.value, 0);

  if (total === 0) {
    return <p className="text-[12.5px] text-inksoft py-8 text-center">Sem dados no período selecionado.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={items.length * height}>
      <BarChart data={items} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }} barCategoryGap={10}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#5C6456', fontSize: 12.5, fontWeight: 600 }}
        />
        <Tooltip
          cursor={{ fill: '#E2E1D3', opacity: 0.4 }}
          contentStyle={{ borderRadius: 10, borderColor: '#E2E1D3', fontSize: 12.5 }}
          formatter={(value) => [`${value} (${Math.round((Number(value) / total) * 100)}%)`, 'Quantidade']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
          {items.map((item) => (
            <Cell key={item.label} fill={item.color} />
          ))}
          <LabelList dataKey="value" position="right" style={{ fill: '#1E241D', fontSize: 12.5, fontWeight: 700 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
