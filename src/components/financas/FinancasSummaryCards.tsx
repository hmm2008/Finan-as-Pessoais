import React from 'react';
import { Card, CardContent } from '../ui/card';
import { motion } from 'motion/react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  CalendarCheck, 
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SummaryData {
  receitasFixas: number;
  receitasPontuais: number;
  totalReceitas: number;
  despesasPontuais: number;
  despesasRegistadas: number;
  despesasFixas: number;
  totalDespesas: number;
  saldo: number;
}

interface FinancasSummaryCardsProps {
  summary: SummaryData;
  maskValue: (value: number, formatter: (val: number) => string) => string;
  formatter: { format: (val: number) => string };
}

export function FinancasSummaryCards({ summary, maskValue, formatter }: FinancasSummaryCardsProps) {
  const cards = [
    { 
      label: 'Receitas Fixas', 
      value: summary.receitasFixas, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      icon: CalendarCheck,
      description: 'Garantidas'
    },
    { 
      label: 'Receitas Pontuais', 
      value: summary.receitasPontuais, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/5',
      icon: ArrowUpCircle,
      description: 'Variáveis'
    },
    { 
      label: 'Total Receitas', 
      value: summary.totalReceitas, 
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-500/20',
      icon: TrendingUp,
      isBold: true,
      description: 'Total do período'
    },
    { 
      label: 'Despesas Fixas', 
      value: summary.despesasFixas, 
      color: 'text-rose-600',
      bgColor: 'bg-rose-500/10',
      icon: Zap,
      description: 'Custos fixos'
    },
    { 
      label: 'Despesas Pontuais', 
      value: summary.despesasPontuais, 
      totalExpenses: summary.despesasFixas + summary.despesasPontuais,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/5',
      icon: ArrowDownCircle,
      description: 'Consumo extra'
    },
    { 
      label: 'Saldo Mensal', 
      value: summary.saldo, 
      color: summary.saldo >= 0 ? 'text-blue-600' : 'text-rose-700',
      bgColor: summary.saldo >= 0 ? 'bg-blue-500/10' : 'bg-rose-500/20',
      icon: Wallet,
      isBold: true,
      description: 'Balanço final'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
          className="h-full"
        >
          <Card className={`group h-full border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative ${card.isBold ? 'ring-1 ring-border/50' : 'bg-card/50'}`}>
            <CardContent className="p-3 sm:p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.color} transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                  {card.description}
                </span>
              </div>
              
              <div className="mt-auto">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wide leading-tight mb-0.5">
                  {card.label}
                </p>
                <p className={`text-sm sm:text-base lg:text-lg font-black tracking-tight truncate tabular-nums ${card.color}`}>
                  {maskValue(card.value, formatter.format)}
                </p>
                {(card as any).totalExpenses !== undefined && (
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                    Total: {maskValue((card as any).totalExpenses, formatter.format)}
                  </p>
                )}
              </div>

              {/* Subtle background decoration */}
              <div className={`absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500`}>
                <card.icon className="w-16 h-16" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
