import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { Wallet } from 'lucide-react';
import { useExpenses, useIncomes } from '../../hooks/queries';

export function SaldoRealWidget() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();

  // Calculate real incomes and expenses for current month
  const receitasRealizadas = incomes
    .filter((inc: any) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const despesasPagas = expenses
    .filter((exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const saldoReal = receitasRealizadas - despesasPagas;
  const executionRatio = receitasRealizadas > 0 ? (despesasPagas / receitasRealizadas) * 100 : 0;

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Saldo Real ({currentMonth})</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${saldoReal >= 0 ? 'text-foreground' : 'text-destructive'}`}>
          {maskValue(saldoReal, formatter.format)}
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
            <span>Execução Orçamental</span>
            <span>{executionRatio.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full ${executionRatio > 90 ? 'bg-destructive' : 'bg-primary'}`} 
              style={{ width: `${Math.min(executionRatio, 100)}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
