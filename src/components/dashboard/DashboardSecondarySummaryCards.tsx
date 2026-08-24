import React from 'react';
import { Card } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { 
  Wallet, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Car, 
  Calendar, 
  PieChart, 
  PiggyBank, 
  GripHorizontal 
} from 'lucide-react';
import { 
  useExpenses, 
  useIncomes, 
  useAssets, 
  useVehicles, 
  useBudgets, 
  useFixedExpenses 
} from '../../hooks/queries';

export function DashboardSecondarySummaryCards() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { assets } = useAssets();
  const { vehicles } = useVehicles();
  const { budgets } = useBudgets();
  const { fixedExpenses } = useFixedExpenses();

  // Current month income & expenses
  const currentMonthIncomes = incomes.filter(
    (inc: any) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth)
  );
  const currentMonthExpenses = expenses.filter(
    (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
  );

  const receitasAtual = currentMonthIncomes.reduce(
    (acc: number, item: any) => acc + (Number(item.amount) || 0),
    0
  );

  const despesasAtual = currentMonthExpenses.reduce(
    (acc: number, item: any) => acc + (Number(item.amount) || 0),
    0
  );

  const saldoAtual = receitasAtual - despesasAtual;

  // 1. Saldo Status
  const saldoStatusText = saldoAtual >= 0 ? 'Positivo' : 'Negativo';

  // 2. Budget Progress (%)
  const totalBudgeted = budgets.reduce(
    (acc: number, b: any) => acc + (Number(b.amount || b.limit) || 0),
    0
  );
  const budgetProgress = totalBudgeted > 0
    ? ((despesasAtual / totalBudgeted) * 100).toFixed(1)
    : '0.0';
  const budgetStatusText = Number(budgetProgress) <= 100 ? 'Dentro do orçamento' : 'Orçamento excedido';

  // 3. Receitas count
  const receitasCount = currentMonthIncomes.length;

  // 4. Despesas count
  const despesasCount = currentMonthExpenses.length;

  // 5. Savings rate (%)
  const savingsRateNum = receitasAtual > 0
    ? Math.max(0, ((receitasAtual - despesasAtual) / receitasAtual) * 100)
    : 0;
  const savingsRateFormatted = `${savingsRateNum.toFixed(1)}%`;
  const savingsRateText = savingsRateNum >= 20 ? 'Excelente' : savingsRateNum >= 10 ? 'Boa' : 'Atenção';

  // 6. Vehicles count
  const vehiclesCount = vehicles.length;

  // 7. Upcoming expenses in next 7 days
  const today = new Date();
  const currentDay = today.getDate();
  const upcomingFixedExpenses = fixedExpenses.filter((fe: any) => {
    const due = Number(fe.dueDay || fe.day);
    if (!due) return false;
    const diff = due - currentDay;
    return diff >= 0 && diff <= 7;
  });
  const upcomingAmount = upcomingFixedExpenses.reduce(
    (acc: number, item: any) => acc + (Number(item.amount) || 0),
    0
  );

  // 8. Expense by category (top category or count)
  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach((exp: any) => {
    const cat = exp.category || 'Outros';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(exp.amount) || 0);
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : '—';

  // 9. Património Líquido
  const totalAssetsVal = assets.reduce(
    (acc: number, asset: any) => acc + (Number(asset.balance || asset.currentValue || asset.value) || 0),
    0
  );
  const totalVehiclesVal = vehicles.reduce(
    (acc: number, v: any) => acc + (Number(v.value) || 0),
    0
  );
  const patrimonioLiquido = totalAssetsVal + totalVehiclesVal;
  const assetsCount = assets.length;

  // Currency Formatter matching design: €910,34
  const formatCurrencyWithCents = (val: number) => {
    const numFormatted = new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
    return `€${numFormatted}`;
  };

  // Currency Formatter without cents for patrimonio: €989 038
  const formatCurrencyNoCents = (val: number) => {
    const numFormatted = new Intl.NumberFormat('pt-PT', {
      maximumFractionDigits: 0,
    }).format(val);
    return `€${numFormatted}`;
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Atual */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Saldo Atual
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {maskValue(saldoAtual, formatCurrencyWithCents)}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>{saldoStatusText}</span>
          </div>
        </Card>

        {/* Card 2: Progresso Orçamental */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Progresso Orçamental
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {budgetProgress}%
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>{budgetStatusText}</span>
          </div>
        </Card>

        {/* Card 3: Receitas do Mês */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Receitas do Mês
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {maskValue(receitasAtual, formatCurrencyWithCents)}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>{receitasCount} receitas</span>
          </div>
        </Card>

        {/* Card 4: Despesas do Mês */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Despesas do Mês
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {maskValue(despesasAtual, formatCurrencyWithCents)}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>{despesasCount} despesas</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 5: Taxa de Poupança */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Taxa de Poupança
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {savingsRateFormatted}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>{savingsRateText}</span>
          </div>
        </Card>

        {/* Card 6: Lembretes Viaturas */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Lembretes Viaturas
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {vehiclesCount}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>viaturas registadas</span>
          </div>
        </Card>

        {/* Card 7: Despesas Próximas */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Despesas Próximas
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {maskValue(upcomingAmount, formatCurrencyWithCents)}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>próximos 7 dias</span>
          </div>
        </Card>

        {/* Card 8: Despesas por Categoria */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Despesas por Categoria
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block truncate">
              {topCategory}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>{topCategory !== '—' ? 'categoria principal' : 'sem despesas'}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 9: Património Líquido */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5 stroke-[2]" />
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab" />
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Património Líquido
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight block">
              {maskValue(patrimonioLiquido, formatCurrencyNoCents)}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>{assetsCount} ativos</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
