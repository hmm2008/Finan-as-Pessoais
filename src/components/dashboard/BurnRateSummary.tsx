import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { Activity, AlertTriangle } from 'lucide-react';
import { useExpenses, useIncomes } from '../../hooks/queries';

export function BurnRateSummary() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();

  // Filter current month expenses & incomes
  const monthExpenses = expenses
    .filter((exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const monthIncomes = incomes
    .filter((inc: any) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  // Calculate day progress in selected month
  const now = new Date();
  const selectedYear = parseInt(currentMonth.split('-')[0]) || now.getFullYear();
  const selectedMonthNum = parseInt(currentMonth.split('-')[1]) || (now.getMonth() + 1);

  const daysInMonth = new Date(selectedYear, selectedMonthNum, 0).getDate();
  
  let daysPassed = 15; // default fallback if historical
  const isCurrentCalendarMonth = (now.getFullYear() === selectedYear) && (now.getMonth() + 1 === selectedMonthNum);
  if (isCurrentCalendarMonth) {
    daysPassed = Math.max(now.getDate(), 1);
  } else {
    daysPassed = daysInMonth; // complete month
  }

  const burnRateDiario = monthExpenses / Math.max(daysPassed, 1);
  const despesasProjetadas = isCurrentCalendarMonth ? burnRateDiario * daysInMonth : monthExpenses;
  const alerta = despesasProjetadas > monthIncomes && monthIncomes > 0;

  return (
    <Card className={`bg-card ${alerta ? 'border-destructive/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Burn Rate (Diário)</CardTitle>
        <Activity className={`h-4 w-4 ${alerta ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {maskValue(burnRateDiario, formatter.format)}<span className="text-sm font-normal text-muted-foreground">/dia</span>
        </div>
        
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
              Despesa Projetada
            </p>
            <p className={`text-sm font-semibold ${alerta ? 'text-destructive' : ''}`}>
              {maskValue(despesasProjetadas, formatter.format)}
            </p>
          </div>
          {alerta && (
            <div className="bg-destructive/10 text-destructive p-2 rounded-md" title="O seu ritmo de consumo atual irá ultrapassar os seus rendimentos.">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
