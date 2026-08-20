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
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4 max-h-[200px] overflow-y-auto">
          {activeFixed.length > 0 ? (
            activeFixed.map((expense: any, i: number) => {
              const dueDay = expense.dueDay || expense.dueDateDay;
              const title = expense.description || expense.name || 'Despesa Fixa';
              const amt = Number(expense.amount) || 0;

              return (
                <div key={expense.id || i} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {dueDay ? `Vence no dia ${dueDay}` : 'Recorrente mensal'}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {maskValue(amt, formatter.format)}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sem despesas fixas ativas registadas.
            </p>
          )}
        </div>
        <div 
          onClick={() => navigate('/despesas-fixas')}
          className="mt-4 flex items-center justify-center text-xs text-primary font-medium cursor-pointer hover:underline"
        >
          Ver todas <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
}
