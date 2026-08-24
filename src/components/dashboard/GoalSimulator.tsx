import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Calculator } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { usePrivacy } from '../../contexts';

export function GoalSimulator() {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [targetAmount, setTargetAmount] = useState(10000);
  const [monthlySavings, setMonthlySavings] = useState(250);

  const monthsNeeded = monthlySavings > 0 ? Math.ceil(targetAmount / monthlySavings) : 0;
  const targetDate = addMonths(new Date(), monthsNeeded);

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Simulador de Objetivos</CardTitle>
        </div>
        <CardDescription>
          Descubra quando alcançará a sua meta ajustando a poupança mensal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold">Valor do Objetivo</label>
                <span className="text-xl font-bold">{maskValue(targetAmount, formatter.format)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold">Poupança Mensal</label>
                <span className="text-xl font-bold text-primary">{maskValue(monthlySavings, formatter.format)}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={monthlySavings}
                onChange={(e) => setMonthlySavings(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-border text-center h-full">
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-widest font-semibold">Meta Alcançada em</p>
            {monthsNeeded > 0 ? (
              <>
                <div className="text-4xl font-bold text-foreground mb-1">
                  {monthsNeeded} {monthsNeeded === 1 ? 'mês' : 'meses'}
                </div>
                <div className="text-primary font-semibold">
                  {format(targetDate, "MMMM 'de' yyyy", { locale: pt })}
                </div>
              </>
            ) : (
              <div className="text-xl text-muted-foreground">Ajuste os valores</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
