import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExpenses } from '../../hooks/queries';

const CATEGORY_COLORS: Record<string, string> = {
  'Habitação': '#3b82f6',
  'Alimentação': '#f59e0b',
  'Transportes': '#10b981',
  'Combustível': '#10b981',
  'Saúde': '#ef4444',
  'Lazer': '#8b5cf6',
  'Educação': '#ec4899',
  'Vestuário': '#06b6d4',
  'Outros': '#6b7280',
};

export function ExpensesByCategoryReport() {
  const { privacyMode, maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();

  // Filter current month expenses
  const monthExpenses = expenses.filter(
    (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
  );

  // Group by category
  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach((exp: any) => {
    const cat = exp.category || 'Outros';
    const amt = Number(exp.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  });

  const rawData = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#6366f1',
    }))
    .sort((a, b) => b.value - a.value);

  const data = rawData.length > 0 ? rawData : [{ name: 'Sem Despesas', value: 0.01, color: '#9ca3af' }];
  const total = rawData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      if (privacyMode || total === 0) return null;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm">
          <p className="font-semibold text-foreground mb-1">{payload[0].name}</p>
          <p className="text-muted-foreground font-bold">
            {formatter.format(payload[0].value)} ({((payload[0].value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base font-semibold">Despesas por Categoria ({currentMonth})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[260px] sm:min-h-[300px] flex flex-col justify-center p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="h-[180px] sm:h-[220px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={window.innerWidth < 640 ? 50 : 60}
                outerRadius={window.innerWidth < 640 ? 70 : 80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total</span>
            <span className="text-base sm:text-lg font-bold">{maskValue(total, formatter.format)}</span>
          </div>
        </div>
        {rawData.length > 0 && (
          <div className="mt-2 sm:mt-4 grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] sm:text-xs max-h-[120px] overflow-y-auto">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="truncate flex-1" title={item.name}>{item.name}</span>
                <span className="font-medium text-muted-foreground tabular-nums">
                  {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
