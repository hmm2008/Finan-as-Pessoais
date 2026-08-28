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
    <Card className={`border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] h-full flex flex-col justify-between overflow-hidden group hover:bg-card/80 transition-all duration-300 ${alerta ? 'border-rose-500/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-8">
        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Burn Rate (Diário)
        </CardTitle>
        <div className={`w-12 h-12 rounded-[1.25rem] bg-foreground/5 flex items-center justify-center ${alerta ? 'text-rose-500' : 'text-foreground'}`}>
          <Activity className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end p-8 pt-0">
        <div className="text-4xl font-black text-foreground tracking-tighter">
          {maskValue(burnRateDiario, formatter.format)}<span className="text-sm font-black text-muted-foreground/60">/dia</span>
        </div>
        
        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">
              Despesa Projetada
            </p>
            <p className={`text-xl font-black tracking-tight ${alerta ? 'text-rose-500' : 'text-foreground'}`}>
              {maskValue(despesasProjetadas, formatter.format)}
            </p>
          </div>
          {alerta && (
            <div className="w-12 h-12 rounded-[1.25rem] bg-rose-500/10 text-rose-500 flex items-center justify-center" title="O seu ritmo de consumo atual irá ultrapassar os seus rendimentos.">
              <AlertTriangle className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
