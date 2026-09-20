import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ShieldCheck, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { useExpenses, useIncomes } from '../../hooks/queries';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useDashboard } from '../../contexts';

export const FinancialHealthScoreWidget: React.FC = () => {
  const { currentMonth } = useDashboard();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();

  const currentMonthIncomes = incomes.filter((inc: any) => inc.date?.startsWith(currentMonth));
  const currentMonthExpenses = expenses.filter((exp: any) => exp.date?.startsWith(currentMonth));

  const totalIncome = currentMonthIncomes.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const totalExpense = currentMonthExpenses.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  
  // Calculate Score (Expert Logic)
  // 1. Savings Rate (40%)
  const savingsScore = Math.min(40, (savingsRate / 20) * 40);
  
  // 2. Expense Coverage (30%) - Assuming monthly stability
  const coverageScore = totalExpense > 0 && totalIncome > totalExpense ? 30 : 10;
  
  // 3. Diversification/Fixed ratio (30%)
  const fixedRatio = totalExpense > 0 ? 0.5 : 1; // Placeholder logic
  const stabilityScore = 20;

  const totalScore = Math.max(0, Math.min(100, Math.round(savingsScore + coverageScore + stabilityScore)));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Saudável';
    if (score >= 40) return 'Em Alerta';
    return 'Crítico';
  };

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-2xl sm:rounded-3xl h-full flex flex-col hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
        <CardTitle className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Saúde Financeira
        </CardTitle>
        <div className={cn(
          "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center",
          totalScore >= 60 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
        )}>
            <Activity className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 sm:p-6 pt-0 sm:pt-0 flex flex-col justify-center text-center">
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              className="stroke-muted/20 fill-none"
              strokeWidth="8"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              className={cn("fill-none", getScoreColor(totalScore).replace('text-', 'stroke-'))}
              strokeWidth="8"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * totalScore) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-black tracking-tighter">{totalScore}</span>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Pontos</span>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className={cn("text-xs sm:text-sm font-black uppercase tracking-widest", getScoreColor(totalScore))}>
            {getScoreLabel(totalScore)}
          </h4>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed px-2">
            {totalScore >= 80 ? "As suas finanças estão em excelente forma. Continue a investir." : 
             totalScore >= 60 ? "A sua taxa de poupança está acima da média. Mantenha o foco." :
             "Atenção aos gastos variáveis. Considere rever o seu orçamento mensal."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
