import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useExpenses, useIncomes, useFixedExpenses, useFixedIncomes, useAssets } from '../../hooks/queries';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export function DailyBalanceTimeline() {
  const { privacyMode, maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { fixedExpenses } = useFixedExpenses();
  const { fixedIncomes } = useFixedIncomes();
  const { assets } = useAssets();

  const [yearStr, monthStr] = currentMonth.split('-');
  const selectedYear = parseInt(yearStr, 10) || new Date().getFullYear();
  const selectedMonthNum = parseInt(monthStr, 10) || (new Date().getMonth() + 1);

  const monthStartDate = new Date(selectedYear, selectedMonthNum - 1, 1);
  const daysInMonth = new Date(selectedYear, selectedMonthNum, 0).getDate();

  // 1. Initial starting balance: Liquid checking/cash assets + historical net cash flow prior to currentMonth
  const liquidAssetsBalance = assets
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

  const initialStartingBalance = liquidAssetsBalance + (priorIncomes - priorExpenses);

  // 2. Identify real transactions already registered in the current month
  const currentMonthExpenses = expenses.filter(
    (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
  );
  const currentMonthIncomes = incomes.filter(
    (inc: any) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth)
  );

  // Active fixed expenses and incomes for projection
  const activeFixedExpenses = fixedExpenses.filter((fe: any) => fe.active !== false);
  const activeFixedIncomes = fixedIncomes.filter((fi: any) => fi.active !== false);

  let cumulativeBalance = initialStartingBalance;
  let totalMonthInflow = 0;
  let totalMonthOutflow = 0;
  let hasAnyTransactionsOrCommitments = false;

  const data = Array.from({ length: daysInMonth }).map((_, i) => {
    const dayDate = addDays(monthStartDate, i);
    const dayNumber = i + 1;
    const dayStr = format(dayDate, 'yyyy-MM-dd');

    // A) Real transactions on this specific day
    const dayRealIncomesList = currentMonthIncomes.filter((inc: any) => inc.date === dayStr);
    const dayRealExpensesList = currentMonthExpenses.filter((exp: any) => exp.date === dayStr);

    const dayRealIncomes = dayRealIncomesList.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
    const dayRealExpenses = dayRealExpensesList.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

    // B) Scheduled fixed incomes on this due day (if not already entered as a real transaction with linked ID or matching category/title)
    const dayFixedIncomesList = activeFixedIncomes.filter((fi: any) => {
      const dueDay = Number(fi.dueDay) || 1;
      const matchesDay = dueDay === dayNumber || (dayNumber === daysInMonth && dueDay > daysInMonth);
      if (!matchesDay) return false;

      // Check if already realized as a registered income
      const alreadyRealized = currentMonthIncomes.some(
        (inc: any) => (inc.fixedIncomeId && inc.fixedIncomeId === fi.id) || (inc.date === dayStr && inc.title === fi.title)
      );
      return !alreadyRealized;
    });

    const dayFixedIncomes = dayFixedIncomesList.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

    // C) Scheduled fixed expenses on this due day (if not already entered as a registered expense)
    const dayFixedExpensesList = activeFixedExpenses.filter((fe: any) => {
      const dueDay = Number(fe.dueDay) || 1;
      const matchesDay = dueDay === dayNumber || (dayNumber === daysInMonth && dueDay > daysInMonth);
      if (!matchesDay) return false;

      // Check if already realized as a registered expense
      const alreadyRealized = currentMonthExpenses.some(
        (exp: any) => (exp.fixedExpenseId && exp.fixedExpenseId === fe.id) || (exp.date === dayStr && exp.title === fe.title)
      );
      return !alreadyRealized;
    });

    const dayFixedExpenses = dayFixedExpensesList.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

    const dayTotalIn = dayRealIncomes + dayFixedIncomes;
    const dayTotalOut = dayRealExpenses + dayFixedExpenses;

    if (dayTotalIn > 0 || dayTotalOut > 0) {
      hasAnyTransactionsOrCommitments = true;
    }

    totalMonthInflow += dayTotalIn;
    totalMonthOutflow += dayTotalOut;
    cumulativeBalance += (dayTotalIn - dayTotalOut);

    return {
      dayNumber,
      date: format(dayDate, 'dd MMM', { locale: pt }),
      fullDate: format(dayDate, "d 'de' MMMM", { locale: pt }),
      balance: Math.round(cumulativeBalance * 100) / 100,
      dayRealIncomes,
      dayRealExpenses,
      dayFixedIncomes,
      dayFixedExpenses,
      dayRealIncomesList,
      dayRealExpensesList,
      dayFixedIncomesList,
      dayFixedExpensesList,
      dayNet: dayTotalIn - dayTotalOut,
    };
  });

  const finalProjectedBalance = data[data.length - 1]?.balance ?? initialStartingBalance;
  const netMonthlyChange = finalProjectedBalance - initialStartingBalance;

  // Calculate the gradient split based on data min/max
  const balances = data.map(d => d.balance);
  const max = Math.max(...balances, 1);
  const min = Math.min(...balances, -1);

  const gradientOffset = () => {
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  };
  const off = gradientOffset();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      if (privacyMode) return null;
      const point = payload[0].payload;
      const isPos = point.balance >= 0;

      return (
        <div className="bg-popover border border-border p-3.5 rounded-xl shadow-xl text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="font-semibold text-foreground">{point.fullDate}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Dia {point.dayNumber}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Saldo Projetado:</span>
              <span className={`font-bold text-sm ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                {formatter.format(point.balance)}
              </span>
            </div>

            {point.dayNet !== 0 && (
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Variação do Dia:</span>
                <span className={`font-semibold ${point.dayNet >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {point.dayNet >= 0 ? `+${formatter.format(point.dayNet)}` : formatter.format(point.dayNet)}
                </span>
              </div>
            )}
          </div>

          {/* Details breakdown */}
          {(point.dayRealIncomes > 0 || point.dayRealExpenses > 0 || point.dayFixedIncomes > 0 || point.dayFixedExpenses > 0) && (
            <div className="pt-1.5 border-t border-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Movimentos do Dia</span>
              
              {point.dayRealIncomesList?.map((inc: any, idx: number) => (
                <div key={`r-inc-${idx}`} className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="truncate max-w-[130px]">+ {inc.title || inc.description || 'Receita'}</span>
                  <span className="font-medium">+{formatter.format(Number(inc.amount) || 0)}</span>
                </div>
              ))}

              {point.dayFixedIncomesList?.map((fi: any, idx: number) => (
                <div key={`f-inc-${idx}`} className="flex justify-between text-emerald-500">
                  <span className="truncate max-w-[130px]">+ [Fixa] {fi.title || 'Receita Fixa'}</span>
                  <span className="font-medium">+{formatter.format(Number(fi.amount) || 0)}</span>
                </div>
              ))}

              {point.dayRealExpensesList?.map((exp: any, idx: number) => (
                <div key={`r-exp-${idx}`} className="flex justify-between text-destructive">
                  <span className="truncate max-w-[130px]">- {exp.title || exp.description || 'Despesa'}</span>
                  <span className="font-medium">-{formatter.format(Number(exp.amount) || 0)}</span>
                </div>
              ))}

              {point.dayFixedExpensesList?.map((fe: any, idx: number) => (
                <div key={`f-exp-${idx}`} className="flex justify-between text-destructive/80">
                  <span className="truncate max-w-[130px]">- [Fixa] {fe.title || 'Despesa Fixa'}</span>
                  <span className="font-medium">-{formatter.format(Number(fe.amount) || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">Projeção Diária</CardTitle>
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-secondary font-medium text-muted-foreground capitalize shrink-0">
                {format(monthStartDate, 'MMM yy', { locale: pt })}
              </span>
            </div>
            <CardDescription className="text-[10px] sm:text-xs mt-0.5 truncate hidden sm:block">
              Evolução baseada em transações reais e compromissos fixos.
            </CardDescription>
          </div>
 
          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="bg-secondary/60 border border-border px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs">
              <span className="text-muted-foreground block text-[8px] sm:text-[10px] uppercase font-bold">Início</span>
              <span className="font-bold text-foreground">
                {maskValue(initialStartingBalance, formatter.format)}
              </span>
            </div>
 
            <div className="bg-secondary/60 border border-border px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs">
              <span className="text-muted-foreground block text-[8px] sm:text-[10px] uppercase font-bold">Fim</span>
              <span className={`font-bold ${finalProjectedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                {maskValue(finalProjectedBalance, formatter.format)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
 
      <CardContent className="flex-1 min-h-[240px] sm:min-h-[300px] p-2 sm:p-6 pt-2 sm:pt-4 flex flex-col justify-between">
        {!hasAnyTransactionsOrCommitments && initialStartingBalance === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
            <div className="p-3 bg-secondary/80 rounded-full text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm text-foreground">Sem dados registados para este mês</p>
            <p className="text-xs max-w-sm">
              Adicione despesas, receitas ou compromissos fixos para visualizar a projeção diária de liquidez calculada em tempo real com os seus dados reais.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={260}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => privacyMode ? '€••••' : `€${value}`}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={off} stopColor="#10b981" stopOpacity={0.7} />
                  <stop offset={off} stopColor="#ef4444" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.7} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={finalProjectedBalance >= 0 ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fill="url(#splitColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
