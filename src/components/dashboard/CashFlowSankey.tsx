import React, { useMemo, useRef, useEffect, useState } from 'react';
import { sankey, sankeyLinkHorizontal, sankeyCenter } from 'd3-sankey';
import { select } from 'd3-selection';
import { useExpenses, useIncomes } from '../../hooks/queries';
import { useDashboard } from '../../contexts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { motion } from 'motion/react';

export const CashFlowSankey: React.FC = () => {
  const { currentMonth } = useDashboard();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({ 
          width: entries[0].contentRect.width, 
          height: 400 
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const monthIncomes = incomes.filter((inc: any) => inc.date?.startsWith(currentMonth));
    const monthExpenses = expenses.filter((exp: any) => exp.date?.startsWith(currentMonth));

    if (monthIncomes.length === 0 && monthExpenses.length === 0) return null;

    const nodes: { name: string; id: string }[] = [];
    const links: { source: number; target: number; value: number }[] = [];

    // Nodes
    const incomeCategories = Array.from(new Set(monthIncomes.map((inc: any) => inc.category || 'Outros Rendimentos')));
    const expenseCategories = Array.from(new Set(monthExpenses.map((exp: any) => exp.category || 'Outras Despesas')));

    nodes.push({ name: 'Carteira / Saldo', id: 'wallet' });
    
    incomeCategories.forEach(cat => nodes.push({ name: cat, id: `inc_${cat}` }));
    expenseCategories.forEach(cat => nodes.push({ name: cat, id: `exp_${cat}` }));

    // Links: Incomes -> Wallet
    incomeCategories.forEach(cat => {
      const value = monthIncomes
        .filter((inc: any) => (inc.category || 'Outros Rendimentos') === cat)
        .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
      
      if (value > 0) {
        links.push({
          source: nodes.findIndex(n => n.id === `inc_${cat}`),
          target: nodes.findIndex(n => n.id === 'wallet'),
          value
        });
      }
    });

    // Links: Wallet -> Expenses
    expenseCategories.forEach(cat => {
      const value = monthExpenses
        .filter((exp: any) => (exp.category || 'Outras Despesas') === cat)
        .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
      
      if (value > 0) {
        links.push({
          source: nodes.findIndex(n => n.id === 'wallet'),
          target: nodes.findIndex(n => n.id === `exp_${cat}`),
          value
        });
      }
    });

    return { nodes, links };
  }, [incomes, expenses, currentMonth]);

  if (!data || data.links.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden h-full">
        <CardHeader>
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Fluxo de Caixa (Sankey)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground italic text-xs">
          Sem dados suficientes para este mês.
        </CardContent>
      </Card>
    );
  }

  const { width, height } = dimensions;
  const margin = { top: 20, right: 120, bottom: 20, left: 120 };

  const sankeyGenerator = sankey<any, any>()
    .nodeWidth(15)
    .nodePadding(20)
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .nodeAlign(sankeyCenter);

  const { nodes, links } = sankeyGenerator({
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d }))
  });

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden h-full">
      <CardHeader className="p-6">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Diagrama de Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent className="p-0" ref={containerRef}>
        <svg width={width} height={height} className="overflow-visible">
          <g>
            {links.map((link, i) => (
              <motion.path
                key={i}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.2 }}
                transition={{ duration: 1.5, delay: i * 0.05 }}
                d={sankeyLinkHorizontal()(link) || ''}
                fill="none"
                stroke={link.source.id === 'wallet' ? 'currentColor' : '#10b981'}
                strokeWidth={Math.max(1, link.width || 0)}
                className="text-primary hover:opacity-50 transition-opacity"
              />
            ))}
          </g>
          <g>
            {nodes.map((node, i) => (
              <g key={i} transform={`translate(${node.x0}, ${node.y0})`}>
                <rect
                  width={(node.x1 || 0) - (node.x0 || 0)}
                  height={(node.y1 || 0) - (node.y0 || 0)}
                  fill={node.id === 'wallet' ? '#6366f1' : node.id.startsWith('inc') ? '#10b981' : '#ef4444'}
                  rx={4}
                  className="shadow-lg"
                />
                <text
                  x={node.x0! < width / 2 ? (node.x1! - node.x0!) + 10 : -10}
                  y={(node.y1! - node.y0!) / 2}
                  dy="0.35em"
                  textAnchor={node.x0! < width / 2 ? "start" : "end"}
                  className="text-[10px] font-bold fill-foreground uppercase tracking-tight"
                >
                  {node.name}
                </text>
                <text
                  x={node.x0! < width / 2 ? (node.x1! - node.x0!) + 10 : -10}
                  y={(node.y1! - node.y0!) / 2 + 12}
                  dy="0.35em"
                  textAnchor={node.x0! < width / 2 ? "start" : "end"}
                  className="text-[9px] font-black fill-muted-foreground"
                >
                  {node.value?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </CardContent>
    </Card>
  );
};
