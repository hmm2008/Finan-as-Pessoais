import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';


export function ComparativeAnalysis({ expenses, incomes }: { expenses: any[], incomes: any[] }) {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });


  const current = currentMonth || new Date().toISOString().slice(0, 7);
  
  // Previous month calculation
  const [year, month] = current.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const categories = useMemo(() => {
    const map = new Map<string, { current: number, previous: number, type: 'expense' | 'income' }>();

    // Process expenses
    expenses.forEach((e: any) => {
      const isCurrent = e.date.startsWith(current);
      const isPrev = e.date.startsWith(prevMonthStr);
      if (isCurrent || isPrev) {
        const val = parseFloat(e.amount) || 0;
        const key = e.category;
        const entry = map.get(key) || { current: 0, previous: 0, type: 'expense' };
        if (isCurrent) entry.current += val;
        if (isPrev) entry.previous += val;
        map.set(key, entry);
      }
    });

    // Process incomes
    incomes.forEach((i: any) => {
      const isCurrent = i.date.startsWith(current);
      const isPrev = i.date.startsWith(prevMonthStr);
      if (isCurrent || isPrev) {
        const val = parseFloat(i.amount) || 0;
        const key = i.category;
        const entry = map.get(key) || { current: 0, previous: 0, type: 'income' };
        if (isCurrent) entry.current += val;
        if (isPrev) entry.previous += val;
        map.set(key, entry);
      }
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.current - a.current);
  }, [expenses, incomes, current, prevMonthStr]);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Comparação com o Mês Anterior</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Categoria</th>
                  <th className="px-4 py-3">Mês Atual</th>
                  <th className="px-4 py-3">Mês Anterior</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Variação</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, i) => {
                  const diff = cat.current - cat.previous;
                  const percent = cat.previous > 0 ? (diff / cat.previous) * 100 : 0;
                  
                  let isGood = false;
                  if (cat.type === 'expense' && diff < 0) isGood = true;
                  if (cat.type === 'income' && diff > 0) isGood = true;
                  
                  let isBad = false;
                  if (cat.type === 'expense' && diff > 0) isBad = true;
                  if (cat.type === 'income' && diff < 0) isBad = true;

  return (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-4 font-medium flex items-center gap-2">
                        {cat.name}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                          {cat.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="px-4 py-4">{maskValue(cat.current, formatter.format)}</td>
                      <td className="px-4 py-4 text-muted-foreground">{maskValue(cat.previous, formatter.format)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-semibold ${isGood ? 'text-emerald-500' : isBad ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {diff > 0 ? '+' : ''}{maskValue(diff, formatter.format)}
                          </span>
                          <div className={`flex items-center text-xs px-1.5 py-0.5 rounded-full ${isGood ? 'bg-emerald-500/10 text-emerald-500' : isBad ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
                            {diff > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : diff < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                            {cat.previous > 0 ? `${Math.abs(percent).toFixed(1)}%` : 'Novo'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Sem dados para comparar neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
