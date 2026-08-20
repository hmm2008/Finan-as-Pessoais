import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';
import { PieChart as PieIcon } from 'lucide-react';

interface PatrimonioDistributionChartProps {
  assets: Asset[];
}

const CATEGORY_COLORS: Record<string, string> = {
  imovel: '#10b981', // Emerald
  financeiro: '#3b82f6', // Blue
  outros: '#f59e0b' // Amber
};

const CATEGORY_NAMES: Record<string, string> = {
  imovel: 'Imóveis',
  financeiro: 'Ativos Financeiros',
  outros: 'Outros Ativos'
};

export function PatrimonioDistributionChart({ assets }: PatrimonioDistributionChartProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Group by category
  const categoryData = Object.keys(CATEGORY_NAMES).map(catKey => {
    const total = assets
      .filter(a => a.category === catKey)
      .reduce((sum, a) => sum + a.currentValue, 0);
    return {
      name: CATEGORY_NAMES[catKey],
      value: total,
      key: catKey,
      color: CATEGORY_COLORS[catKey]
    };
  }).filter(item => item.value > 0);

  const totalPortfolioValue = categoryData.reduce((sum, item) => sum + item.value, 0);

  if (assets.length === 0 || totalPortfolioValue === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Sem dados suficientes para gerar o gráfico de distribuição de património.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-primary" />
          Distribuição do Património por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => [maskValue(val, formatter.format), 'Valor']}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-1/2 space-y-3">
            {categoryData.map(item => {
              const pct = totalPortfolioValue > 0 ? (item.value / totalPortfolioValue) * 100 : 0;
              return (
                <div key={item.key} className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% do Total</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm">
                    {maskValue(item.value, formatter.format)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
