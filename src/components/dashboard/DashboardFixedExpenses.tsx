import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFixedExpenses } from '../../hooks/queries';

export function DashboardFixedExpenses() {
  const { maskValue } = usePrivacy();
  const navigate = useNavigate();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { fixedExpenses } = useFixedExpenses();

  const activeFixed = fixedExpenses
    .filter((fe: any) => fe.active !== false)
    .slice(0, 4);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Próximas Despesas Fixas</CardTitle>
        <Calendar className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4 max-h-[200px] overflow-y-auto">
          {activeFixed.length > 0 ? (
            activeFixed.map((expense: any, i: number) => {
              const dueDay = expense.dueDay || expense.dueDateDay;
              const title = expense.description || expense.name || 'Despesa Fixa';
              const amt = Number(expense.amount) || 0;
 
              return (
                <div key={expense.id || i} className="flex justify-between items-center">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs sm:text-sm font-medium truncate">{title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {dueDay ? `Dia ${dueDay}` : 'Mensal'}
                    </p>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground shrink-0">
                    {maskValue(amt, formatter.format)}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-4">
              Sem despesas fixas ativas.
            </p>
          )}
        </div>
        <div 
          onClick={() => navigate('/despesas-fixas')}
          className="mt-3 sm:mt-4 flex items-center justify-center text-[10px] sm:text-xs text-primary font-medium cursor-pointer hover:underline"
        >
          Ver todas <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
}
