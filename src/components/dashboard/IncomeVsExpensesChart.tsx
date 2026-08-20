import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useExpenses, useIncomes } from '../../hooks/queries';

export function IncomeVsExpensesChart() {
  const { privacyMode } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();

  const { currentMonth } = useDashboard();
  const [year, month] = currentMonth.split('-').map(Number);
  const baseDate = new Date(year, month - 1, 1);

  // Compute last 6 months real data
  const data = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(baseDate, 5 - i);
    const monthKey = format(date, 'yyyy-MM');

    const totalIncomes = incomes
      .filter((inc: any) => typeof inc.date === 'string' && inc.date.startsWith(monthKey))
      .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

    const totalExpenses = expenses
      .filter((exp: any) => typeof exp.date === 'string' && exp.date.startsWith(monthKey))
      .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

    return {
      name: format(date, 'MMM yy', { locale: pt }),
      receitas: Math.round(totalIncomes),
      despesas: Math.round(totalExpenses)
    };
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Receitas vs Despesas (Últimos 6 meses)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => privacyMode ? '€••••' : `€${value}`}
              axisLine={false}
              tickLine={false}
            />
            {!privacyMode && <Tooltip formatter={(value: number) => formatter.format(value)} />}
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
