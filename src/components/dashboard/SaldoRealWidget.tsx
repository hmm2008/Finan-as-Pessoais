import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { Wallet } from 'lucide-react';
import { useExpenses, useIncomes } from '../../hooks/queries';
import { motion } from 'motion/react';

export function SaldoRealWidget() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();

  const receitasRealizadas = incomes
    .filter((inc: any) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const despesasPagas = expenses
    .filter((exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const saldoReal = receitasRealizadas - despesasPagas;
  const executionRatio = receitasRealizadas > 0 ? (despesasPagas / receitasRealizadas) * 100 : 0;

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] h-full flex flex-col justify-between overflow-hidden group hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-8">
        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Saldo Real
        </CardTitle>
        <div className="w-12 h-12 rounded-[1.25rem] bg-foreground/5 text-foreground flex items-center justify-center">
          <Wallet className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end p-8 pt-0">
        <div className={`text-4xl font-black tracking-tighter ${saldoReal >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
          {maskValue(saldoReal, formatter.format)}
        </div>
        
        <div className="mt-8 space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>Execução</span>
            <span className={executionRatio > 90 ? 'text-rose-500' : 'text-foreground'}>{executionRatio.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-foreground/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(executionRatio, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${executionRatio > 90 ? 'bg-rose-500' : 'bg-foreground'}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
