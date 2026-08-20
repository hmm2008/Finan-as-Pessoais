import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useExpenses, useIncomes, useFixedExpenses, useFixedIncomes, useAssets } from '../../hooks/queries';

export function SaldoProjetadoWidget() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { fixedExpenses } = useFixedExpenses();
  const { fixedIncomes } = useFixedIncomes();
  const { assets } = useAssets();

  // 1. Initial starting balance: Liquid bank accounts + historical net cash flow prior to current month
  const liquidAssets = assets
    .filter((a: any) => {
      const type = (a.type || a.category || '').toLowerCase();
      const subType = (a.subType || '').toLowerCase();
      return (
        type === 'checking' ||
        type === 'ordem' ||
        subType.includes('ordem') ||
        subType.includes('poupança') ||
        subType.includes('poupanca')
      );
    })
    .reduce((acc: number, a: any) => acc + (Number(a.balance || a.currentValue || a.value) || 0), 0);

  const priorIncomes = incomes
    .filter((inc: any) => typeof inc.date === 'string' && inc.date < `${currentMonth}-01`)
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const priorExpenses = expenses
    .filter((exp: any) => typeof exp.date === 'string' && exp.date < `${currentMonth}-01`)
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const baseBalance = liquidAssets + (priorIncomes - priorExpenses);

  // 2. Real realized totals for current month
  const currentMonthIncomes = incomes.filter(
    (inc: any) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth)
  );
  const currentMonthExpenses = expenses.filter(
    (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
  );

  const totalIncomes = currentMonthIncomes.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const totalExpenses = currentMonthExpenses.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  // 3. Pending fixed commitments not yet realized
  const pendingFixedIncomes = fixedIncomes
    .filter((fi: any) => fi.active !== false)
    .filter((fi: any) => !currentMonthIncomes.some((inc: any) => inc.fixedIncomeId === fi.id || inc.title === fi.title))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const pendingFixedExpenses = fixedExpenses
    .filter((fe: any) => fe.active !== false)
    .filter((fe: any) => !currentMonthExpenses.some((exp: any) => exp.fixedExpenseId === fe.id || exp.title === fe.title))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const totalProjectedInflows = totalIncomes + pendingFixedIncomes;
  const totalProjectedOutflows = totalExpenses + pendingFixedExpenses;
  const projectedBalance = baseBalance + (totalProjectedInflows - totalProjectedOutflows);

  // 4. Real Sparkline progression across 4 quarters of the month
  const [yearStr, monthStr] = currentMonth.split('-');
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
  const quarterDays = [1, Math.round(daysInMonth * 0.33), Math.round(daysInMonth * 0.66), daysInMonth];

  let running = baseBalance;
  const sparklineData = quarterDays.map(targetDay => {
    // Add transactions up to targetDay
    const incSoFar = currentMonthIncomes
      .filter((inc: any) => {
        const d = parseInt(inc.date.split('-')[2], 10);
        return d <= targetDay;
      })
      .reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);

    const expSoFar = currentMonthExpenses
      .filter((exp: any) => {
        const d = parseInt(exp.date.split('-')[2], 10);
        return d <= targetDay;
      })
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    const fixedIncSoFar = fixedIncomes
      .filter((fi: any) => fi.active !== false && (Number(fi.dueDay) || 1) <= targetDay)
      .reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);

    const fixedExpSoFar = fixedExpenses
      .filter((fe: any) => fe.active !== false && (Number(fe.dueDay) || 1) <= targetDay)
      .reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);

    const val = baseBalance + Math.max(incSoFar, fixedIncSoFar) - Math.max(expSoFar, fixedExpSoFar);
    return { value: Math.round(val) };
  });

  const isPositive = projectedBalance >= 0;

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Saldo Projetado</CardTitle>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isPositive ? 'text-foreground' : 'text-destructive'}`}>
          {maskValue(projectedBalance, formatter.format)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Estimativa fim do mês ({currentMonth})</p>
        
        <div className="h-10 mt-2 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={isPositive ? "#10b981" : "#ef4444"} fillOpacity={1} fill="url(#colorValue)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
