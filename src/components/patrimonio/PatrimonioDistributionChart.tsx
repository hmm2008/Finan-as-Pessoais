import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';

interface PatrimonioDistributionChartProps {
  assets: Asset[];
  activeTab: 'imovel' | 'financeiro';
}

const COLORS = [
  '#5850ec', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export function PatrimonioDistributionChart({ assets, activeTab }: PatrimonioDistributionChartProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const filteredAssets = assets.filter(a => a.category === activeTab);

  if (filteredAssets.length === 0) {
    return null;
  }

  // Aggregate by subType or name
  const categoryMap: Record<string, number> = {};
  filteredAssets.forEach(a => {
    const key = a.subType || (a.category === 'imovel' ? 'Imóvel' : 'Ativo');
    categoryMap[key] = (categoryMap[key] || 0) + (a.currentValue || 0);
  });

  const pieData = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    value: val
  }));

  const totalVal = pieData.reduce((sum, d) => sum + d.value, 0);

  // Bar data for "Valor por Tipo"
  const barData = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    valor: val
  }));

  const formatShortEuros = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}k`;
    return `€${val}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Distribuição por Tipo */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base font-bold text-foreground">
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col items-center justify-center">
          <div className="w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [maskValue(val, formatter.format), 'Valor']}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Legend */}
          <div className="w-full pt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground font-medium border-t border-border/40">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {pieData.map((item, index) => {
                const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="text-foreground font-medium">
                      {item.name} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="font-bold text-foreground">100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Valor por Tipo */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base font-bold text-foreground">
            Valor por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis 
                  type="number" 
                  tickFormatter={formatShortEuros} 
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(val: number) => [maskValue(val, formatter.format), 'Valor']}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="valor" 
                  radius={[0, 8, 8, 0]} 
                  barSize={40}
                >
                  {barData.map((_, index) => (
                    <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
