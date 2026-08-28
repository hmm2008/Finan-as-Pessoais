import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { usePrivacy } from '../../contexts';
import { motion } from 'motion/react';
import { PieChart as PieIcon, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';

const CHART_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

export function FinancasCharts({ expenses, incomes }: { expenses: any[], incomes: any[] }) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Group by Category helper
  const groupByCategory = (items: any[]) => {
    const map = new Map<string, number>();
    items.forEach(item => {
      const val = parseFloat(item.amount) || 0;
      map.set(item.category, (map.get(item.category) || 0) + val);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const expenseData = useMemo(() => groupByCategory(expenses), [expenses]);
  const incomeData = useMemo(() => groupByCategory(incomes), [incomes]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm text-popover-foreground border border-border shadow-xl p-3 rounded-xl text-xs sm:text-sm font-medium animate-in fade-in zoom-in-95 duration-200">
          <p className="text-muted-foreground mb-1 font-bold uppercase tracking-widest text-[10px]">{payload[0].name}</p>
          <p className="text-primary text-base font-black tabular-nums">{maskValue(payload[0].value, formatter.format)}</p>
        </div>
      );
    }
    return null;
  };

  const renderCard = (title: string, icon: any, data: any[], type: 'pie' | 'bar', chartType: 'expense' | 'income') => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="shadow-sm border-border/50 bg-card/50 overflow-hidden group hover:border-primary/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            {React.createElement(icon, { className: `w-4 h-4 ${chartType === 'expense' ? 'text-rose-500' : 'text-emerald-500'}` })}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] pt-2">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {type === 'pie' ? (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-[11px] font-medium text-muted-foreground capitalize">{value}</span>}
                  />
                </PieChart>
              ) : (
                <BarChart 
                  data={data} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  barSize={12}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `€${v}`} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={90} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }} />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 6, 6, 0]}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        className="transition-all duration-300 hover:brightness-110"
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <BarChart3 className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-xs font-medium italic opacity-60">Sem dados para este período</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderCard("Distribuição de Despesas", TrendingDown, expenseData, 'pie', 'expense')}
        {renderCard("Despesas por Valor", BarChart3, expenseData, 'bar', 'expense')}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderCard("Distribuição de Receitas", TrendingUp, incomeData, 'pie', 'income')}
        {renderCard("Receitas por Valor", BarChart3, incomeData, 'bar', 'income')}
      </div>
    </div>
  );
}
