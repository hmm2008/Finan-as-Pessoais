import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { usePrivacy } from '../../contexts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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
        <div className="bg-popover text-popover-foreground border border-border shadow-md p-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">{payload[0].name}</p>
          <p className="text-primary font-medium">{maskValue(payload[0].value, formatter.format)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Expenses Pie Chart */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg">Despesas por Categoria (Distribuição)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses Bar Chart */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg">Despesas por Categoria (Valores)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incomes Pie Chart */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg">Receitas por Categoria (Distribuição)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incomes Bar Chart */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg">Receitas por Categoria (Valores)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
