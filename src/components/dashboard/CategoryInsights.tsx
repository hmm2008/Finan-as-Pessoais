import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Lightbulb, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { usePrivacy, useDashboard } from '../../contexts';
import { useExpenses, useBudgets } from '../../hooks/queries';
import { subMonths, format } from 'date-fns';

export function CategoryInsights() {
  const { currentMonth } = useDashboard();
  const { expenses } = useExpenses();
  const { budgets } = useBudgets();

  // Current month vs previous month expenses
  const [yearStr, monthStr] = currentMonth.split('-');
  const prevMonthDate = subMonths(new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1), 1);
  const prevMonthKey = format(prevMonthDate, 'yyyy-MM');

  const currExpenses = expenses.filter((e: any) => typeof e.date === 'string' && e.date.startsWith(currentMonth));
  const prevExpenses = expenses.filter((e: any) => typeof e.date === 'string' && e.date.startsWith(prevMonthKey));

  // Compute category totals
  const currByCat: Record<string, number> = {};
  currExpenses.forEach((e: any) => {
    const cat = e.category || 'Outros';
    currByCat[cat] = (currByCat[cat] || 0) + (Number(e.amount) || 0);
  });

  const prevByCat: Record<string, number> = {};
  prevExpenses.forEach((e: any) => {
    const cat = e.category || 'Outros';
    prevByCat[cat] = (prevByCat[cat] || 0) + (Number(e.amount) || 0);
  });

  const insights: { category: string; message: string; type: 'warning' | 'success' | 'alert' }[] = [];

  // Check budgets
  const activeBudgets = budgets.filter((b: any) => !b.month || b.month === currentMonth);
  activeBudgets.forEach((b: any) => {
    const spent = currByCat[b.category] || Number(b.spent) || 0;
    const limit = Number(b.limit) || 1;
    const ratio = (spent / limit) * 100;
    if (ratio >= 100) {
      insights.push({
        category: b.category,
        message: `Ultrapassou o limite do orçamento fixado em ${b.limit} € (${ratio.toFixed(0)}%).`,
        type: 'alert'
      });
    } else if (ratio >= 85) {
      insights.push({
        category: b.category,
        message: `Atenção, atingiu ${ratio.toFixed(0)}% do orçamento disponível.`,
        type: 'warning'
      });
    }
  });

  // Compare category trends
  Object.keys(currByCat).forEach((cat) => {
    const curr = currByCat[cat];
    const prev = prevByCat[cat];
    if (prev && prev > 0 && curr > prev) {
      const diffPct = Math.round(((curr - prev) / prev) * 100);
      if (diffPct >= 15) {
        insights.push({
          category: cat,
          message: `Gastou ${diffPct}% mais em ${cat} do que no mês anterior.`,
          type: 'warning'
        });
      }
    } else if (prev && prev > 0 && curr < prev) {
      const diffPct = Math.round(((prev - curr) / prev) * 100);
      if (diffPct >= 15) {
        insights.push({
          category: cat,
          message: `Poupou ${diffPct}% em ${cat} comparando com o mês anterior.`,
          type: 'success'
        });
      }
    }
  });

  // Fallback default insight if list empty
  if (insights.length === 0) {
    insights.push({
      category: 'Geral',
      message: 'O seu consumo no mês atual está dentro da média sem desvios significativos.',
      type: 'success'
    });
  }

  return (
    <Card className="h-full flex flex-col bg-primary/5 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
        <CardTitle className="text-sm sm:text-base font-semibold text-primary">Insights Automáticos</CardTitle>
        <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="space-y-3 sm:space-y-4 max-h-[220px] overflow-y-auto">
          {insights.slice(0, 4).map((insight, i) => (
            <div key={i} className="flex gap-2 sm:gap-3 items-start">
              <div className="mt-0.5 shrink-0">
                {insight.type === 'warning' && <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />}
                {insight.type === 'success' && <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />}
                {insight.type === 'alert' && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 mt-1 rounded-full bg-destructive animate-pulse" />}
              </div>
              <p className="text-xs sm:text-sm leading-tight text-muted-foreground">
                <span className="font-semibold text-foreground">{insight.category}: </span>
                {insight.message}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
