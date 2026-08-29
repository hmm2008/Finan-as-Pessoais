import React from 'react';
import { usePrivacy, useDashboard } from '../../contexts';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useExpenses, useIncomes, useAssets, useVehicles } from '../../hooks/queries';
import { Expense, Income, Asset, Vehicle } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function DashboardSummaryCards() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { assets } = useAssets();
  const { vehicles } = useVehicles();

  // Calculate current month incomes & expenses
  const receitasAtual = (incomes as Income[])
    .filter((inc) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth))
    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const despesasAtual = (expenses as Expense[])
    .filter((exp) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth))
    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const saldoAtual = receitasAtual - despesasAtual;

  // Calculate previous month for comparison
  const [yearStr, monthStr] = (currentMonth || '2026-08').split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const receitasPrev = (incomes as Income[])
    .filter((inc) => typeof inc.date === 'string' && inc.date.startsWith(prevMonthKey))
    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const despesasPrev = (expenses as Expense[])
    .filter((exp) => typeof exp.date === 'string' && exp.date.startsWith(prevMonthKey))
    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const saldoPrev = receitasPrev - despesasPrev;

  // Percentage calculations
  const calcPctChange = (curr: number, prev: number) => {
    if (prev !== 0) {
      return Math.round(((curr - prev) / Math.abs(prev)) * 100);
    }
    return 0;
  };

  const saldoPct = calcPctChange(saldoAtual, saldoPrev);
  const receitasPct = calcPctChange(receitasAtual, receitasPrev);
  const despesasPct = calcPctChange(despesasAtual, despesasPrev);

  // Total Patrimonio calculation
  const totalAssets = (assets as Asset[]).reduce((acc, asset) => {
    return acc + (Number(asset.currentValue) || 0);
  }, 0);

  const totalVehicles = (vehicles as Vehicle[]).reduce((acc, v) => {
    return acc + (Number(v.value) || 0);
  }, 0);

  const totalPatrimonio = totalAssets + totalVehicles;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const cards = [
    {
      title: "Saldo Mensal",
      value: saldoAtual,
      icon: Wallet,
      color: "blue",
      trend: saldoPct,
      trendPositive: saldoPct >= 0
    },
    {
      title: "Receitas",
      value: receitasAtual,
      icon: ArrowUpRight,
      color: "emerald",
      trend: receitasPct,
      trendPositive: receitasPct >= 0
    },
    {
      title: "Despesas",
      value: despesasAtual,
      icon: ArrowDownRight,
      color: "rose",
      trend: despesasPct,
      trendPositive: despesasPct <= 0
    },
    {
      title: "Património Total",
      value: totalPatrimonio,
      icon: TrendingUp,
      color: "indigo",
      trend: null
    }
  ];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {cards.map((card) => (
        <motion.div
          key={card.title}
          variants={cardVariants}
          whileHover={{ y: -5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl sm:rounded-[2.5rem] -m-0.5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-card/60 backdrop-blur-2xl border border-border/40 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 overflow-hidden shadow-2xl shadow-black/5 h-full flex flex-col justify-between hover:bg-card/80 transition-all duration-300 min-h-[140px] sm:min-h-0">
            {/* Background pattern */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <card.icon className="w-20 h-20 sm:w-32 sm:h-32" />
            </div>

            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className={cn(
                "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-6",
                card.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                card.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                card.color === 'rose' ? 'bg-rose-500/10 text-rose-600' :
                'bg-primary/10 text-primary'
              )}>
                <card.icon className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>

              {card.trend !== null && (
                <div className={`px-2 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black tracking-widest uppercase flex items-center gap-0.5 sm:gap-1 ${
                  card.trendPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {card.trendPositive ? <ArrowUpRight className="w-2 h-2 sm:w-3 sm:h-3" /> : <ArrowDownRight className="w-2 h-2 sm:w-3 sm:h-3" />}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>

            <div>
              <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1 sm:mb-2">
                {card.title}
              </p>
              <h3 className="text-xl sm:text-3xl font-black text-foreground tracking-tighter tabular-nums leading-none">
                {maskValue(card.value, formatCurrency)}
              </h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
