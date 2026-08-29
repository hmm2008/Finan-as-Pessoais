import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { Target, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useBudgets, useExpenses } from '../../hooks/queries';

const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': '🛒',
  'Habitação': '🏠',
  'Transportes': '🚌',
  'Combustível': '⛽',
  'Lazer': '🍿',
  'Saúde': '💊',
  'Educação': '📚',
  'Outros': '📦',
};

export function DashboardBudgetWidget() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const navigate = useNavigate();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { budgets } = useBudgets();
  const { expenses } = useExpenses();

  // Filter budgets for current month (or general budgets)
  const monthBudgets = budgets.filter((b: any) => !b.month || b.month === currentMonth);

  // Compute real spent from expenses
  const monthExpenses = expenses.filter(
    (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
  );

  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach((exp: any) => {
    const cat = exp.category || 'Outros';
    spentByCategory[cat] = (spentByCategory[cat] || 0) + (Number(exp.amount) || 0);
  });

  const activeList = monthBudgets.map((b: any) => {
    const category = b.category || 'Geral';
    const limit = Number(b.limit) || 0;
    const spent = spentByCategory[category] ?? Number(b.spent || 0);
    const icon = CATEGORY_ICONS[category] || '🎯';
    return { category, limit, spent, icon };
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Orçamentos Ativos ({currentMonth})</CardTitle>
        <Target className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4 flex-1 max-h-[220px] overflow-y-auto">
          {activeList.length > 0 ? (
            activeList.map((budget: any, i: number) => {
              const ratio = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
              const isOver = ratio > 100;
              const isWarning = ratio > 85 && !isOver;

              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2 font-medium">
                      <span className="text-base sm:text-lg">{budget.icon}</span>
                      <span className="truncate max-w-[100px] sm:max-w-none">{budget.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={isOver ? 'text-destructive font-bold' : ''}>
                        {maskValue(budget.spent, formatter.format)}
                      </span>
                      <span className="text-muted-foreground text-[10px] sm:text-xs">/ {maskValue(budget.limit, formatter.format)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${isOver ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    ></div>
                  </div>
                  {isOver && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Orçamento excedido em {maskValue(budget.spent - budget.limit, formatter.format)}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sem orçamentos ativos definidos para o mês {currentMonth}.
            </p>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <Button variant="ghost" className="w-full text-xs" onClick={() => navigate('/orcamentos')}>
            Gerir Orçamentos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
