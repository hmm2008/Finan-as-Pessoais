import { useEffect, useRef } from 'react';
import { useBudgets, useExpenses } from './queries';
import { useNotifications } from '../contexts/NotificationContext';
import { useDashboard } from '../contexts';

export function useBudgetAlerts() {
  const { budgets } = useBudgets();
  const { expenses } = useExpenses();
  const { currentMonth } = useDashboard();
  const { notifications, addNotification } = useNotifications();
  const lastProcessedRef = useRef<string>('');

  useEffect(() => {
    if (!budgets.length || !expenses.length || !currentMonth) return;

    // Avoid double processing in the same render cycle
    const processKey = `${expenses.length}-${budgets.length}-${currentMonth}`;
    if (lastProcessedRef.current === processKey) return;
    lastProcessedRef.current = processKey;

    const monthExpenses = expenses.filter(
      (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
    );

    const spentByCategory: Record<string, number> = {};
    monthExpenses.forEach((exp: any) => {
      const cat = exp.category || 'Outros';
      spentByCategory[cat] = (spentByCategory[cat] || 0) + (Number(exp.amount) || 0);
    });

    budgets.forEach((budget: any) => {
      // Check if budget applies to current month
      // Some budgets might have just "08" or "2024-08"
      const budgetMonthStr = String(budget.month || '').trim();
      let isCurrentMonth = false;
      
      if (!budgetMonthStr) {
        isCurrentMonth = true; // Recurrent
      } else if (budgetMonthStr.includes('-')) {
        isCurrentMonth = budgetMonthStr === currentMonth;
      } else {
        const selectedMonthOnly = currentMonth.split('-')[1];
        isCurrentMonth = budgetMonthStr.padStart(2, '0') === selectedMonthOnly;
      }

      if (!isCurrentMonth) return;

      const category = budget.category || 'Outros';
      const limit = Number(budget.limit) || 0;
      const spent = spentByCategory[category] || 0;

      if (limit <= 0) return;

      const ratio = (spent / limit) * 100;

      const checkThreshold = (threshold: number, type: 'warning' | 'error', title: string) => {
        if (ratio >= threshold) {
          // Unique key to identify this notification
          const searchTag = `[${category}:${currentMonth}:${threshold}]`;
          
          const existing = notifications.some(n => 
            n.title === title && 
            n.message.includes(searchTag)
          );

          if (!existing) {
            const formattedSpent = spent.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
            const formattedLimit = limit.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
            
            const message = threshold >= 100 
              ? `O orçamento de "${category}" foi atingido. Gastou ${formattedSpent} de ${formattedLimit} (${ratio.toFixed(0)}%). ${searchTag}`
              : `Atenção: Atingiu ${ratio.toFixed(0)}% do orçamento de "${category}" (${formattedSpent}/${formattedLimit}). ${searchTag}`;
            
            addNotification(title, message, type, 'orcamentos');
          }
        }
      };

      // Check 100% first, then 80%
      checkThreshold(100, 'error', 'Orçamento Excedido');
      checkThreshold(80, 'warning', 'Aviso de Orçamento');
    });
  }, [expenses, budgets, currentMonth, notifications, addNotification]);
}
