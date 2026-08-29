import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { History, TrendingUp, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, useIncomes } from '../../hooks/queries';

export function DashboardRecentTransactions() {
  const { maskValue } = usePrivacy();
  const navigate = useNavigate();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();

  // Combine real expenses and incomes into a single list
  const combined = [
    ...expenses.map((e: any) => ({
      id: e.id,
      type: 'expense',
      category: e.category || 'Despesa',
      date: e.date ? new Date(e.date) : new Date(),
      amount: Number(e.amount) || 0,
      description: e.entity || e.notes || e.category || 'Despesa'
    })),
    ...incomes.map((i: any) => ({
      id: i.id,
      type: 'income',
      category: i.category || 'Receita',
      date: i.date ? new Date(i.date) : new Date(),
      amount: Number(i.amount) || 0,
      description: i.entity || i.notes || i.category || 'Receita'
    }))
  ];

  // Sort descending by date
  combined.sort((a, b) => b.date.getTime() - a.date.getTime());

  const transactions = combined.slice(0, 5);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Transações Recentes</CardTitle>
        <History className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 justify-between">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-3 sm:space-y-4 max-h-[260px]">
          {transactions.length > 0 ? (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex shrink-0 items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                  {t.type === 'income' ? <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{t.description}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                    {t.category} &bull; {!isNaN(t.date.getTime()) ? t.date.toLocaleDateString('pt-PT') : ''}
                  </p>
                </div>
                <div className={`text-xs sm:text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                  {t.type === 'income' ? '+' : '-'}
                  {maskValue(t.amount, formatter.format)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">
              Sem transações recentes registadas.
            </p>
          )}
        </div>
        <div 
          onClick={() => navigate('/financas')}
          className="bg-secondary/50 p-3 border-t border-border text-center cursor-pointer hover:bg-secondary transition-colors mt-auto rounded-b-xl"
        >
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Ver Histórico Completo em Finanças</span>
        </div>
      </CardContent>
    </Card>
  );
}
