import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Calculator, Target, TrendingUp } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { usePrivacy } from '../../contexts';

export function GoalSimulator() {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [targetAmount, setTargetAmount] = useState(10000);
  const [monthlySavings, setMonthlySavings] = useState(250);
  const [extraInvestment, setExtraInvestment] = useState(0);

  const totalMonthly = monthlySavings + extraInvestment;
  const monthsNeeded = totalMonthly > 0 ? Math.ceil(targetAmount / totalMonthly) : 0;
  const targetDate = addMonths(new Date(), monthsNeeded);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] h-full flex flex-col hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-8">
        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Simulador de Objetivos (E se?)
        </CardTitle>
        <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 text-primary flex items-center justify-center">
            <Calculator className="w-6 h-6" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-8 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Valor do Objetivo</label>
                <span className="text-xl font-black text-foreground tabular-nums">{maskValue(targetAmount, formatter.format)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full h-2 bg-foreground/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Poupança Atual</label>
                <span className="text-xl font-black text-primary tabular-nums">{maskValue(monthlySavings, formatter.format)}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={monthlySavings}
                onChange={(e) => setMonthlySavings(Number(e.target.value))}
                className="w-full h-2 bg-foreground/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Investimento Extra</label>
                <span className="text-xl font-black text-emerald-500 tabular-nums">{maskValue(extraInvestment, formatter.format)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={extraInvestment}
                onChange={(e) => setExtraInvestment(Number(e.target.value))}
                className="w-full h-2 bg-foreground/5 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 bg-foreground/5 rounded-[2rem] border border-border/40 text-center h-full">
            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-4">Meta Alcançada em</p>
            {monthsNeeded > 0 ? (
              <>
                <div className="text-5xl font-black text-foreground mb-2 tabular-nums">
                  {monthsNeeded}
                </div>
                <div className="text-sm font-bold text-muted-foreground mb-4">
                  {monthsNeeded === 1 ? 'mês' : 'meses'}
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-primary">
                  {format(targetDate, "MMMM 'de' yyyy", { locale: pt })}
                </div>
              </>
            ) : (
              <div className="text-sm font-bold text-muted-foreground">Ajuste os valores</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
