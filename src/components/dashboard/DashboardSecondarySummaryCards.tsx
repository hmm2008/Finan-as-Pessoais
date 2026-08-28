import React from 'react';
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
  Activity
} from 'lucide-react';
import { 
  useExpenses, 
  useIncomes, 
  useAssets, 
  useVehicles, 
  useBudgets, 
  useFixedExpenses 
} from '../../hooks/queries';
import { motion } from 'motion/react';

export function DashboardSecondarySummaryCards() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { assets } = useAssets();
  const { vehicles } = useVehicles();
  const { budgets } = useBudgets();
  const { fixedExpenses } = useFixedExpenses();

  const currentMonthIncomes = incomes.filter((inc: any) => inc.date?.startsWith(currentMonth));
  const currentMonthExpenses = expenses.filter((exp: any) => exp.date?.startsWith(currentMonth));

  const receitasAtual = currentMonthIncomes.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const despesasAtual = currentMonthExpenses.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const saldoAtual = receitasAtual - despesasAtual;

  const totalBudgeted = budgets.reduce((acc: number, b: any) => acc + (Number(b.amount || b.limit) || 0), 0);
  const budgetProgress = totalBudgeted > 0 ? ((despesasAtual / totalBudgeted) * 100).toFixed(1) : '0.0';

  const savingsRateNum = receitasAtual > 0 ? Math.max(0, ((receitasAtual - despesasAtual) / receitasAtual) * 100) : 0;
  
  const today = new Date();
  const currentDay = today.getDate();
  const upcomingAmount = fixedExpenses
    .filter((fe: any) => {
      const due = Number(fe.dueDay || fe.day);
      if (!due) return false;
      const diff = due - currentDay;
      return diff >= 0 && diff <= 7;
    })
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const totalPatrimonio = [...assets, ...vehicles].reduce((acc: number, item: any) => 
    acc + (Number(item.currentValue || item.value || 0)), 0);

  const formatCurrency = (val: number) => `€${new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2 }).format(val)}`;

  const metrics = [
    { label: 'Poupança', value: `${savingsRateNum.toFixed(1)}%`, icon: Percent, color: 'sky' },
    { label: 'Orçamento', value: `${budgetProgress}%`, icon: Target, color: 'purple' },
    { label: 'Lembretes', value: vehicles.length.toString(), icon: Car, color: 'amber' },
    { label: 'Próximos', value: maskValue(upcomingAmount, formatCurrency), icon: Calendar, color: 'pink' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + idx * 0.05, duration: 0.4 }}
          className="group relative bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl p-4 transition-all hover:bg-card/60 hover:shadow-xl shadow-black/5"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
              m.color === 'sky' ? 'bg-sky-500/10 text-sky-600' :
              m.color === 'purple' ? 'bg-purple-500/10 text-purple-600' :
              m.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
              'bg-pink-500/10 text-pink-600'
            }`}>
              <m.icon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 block leading-none mb-1">
                {m.label}
              </span>
              <span className="text-sm font-black text-foreground tracking-tight block truncate">
                {m.value}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
