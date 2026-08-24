import { useAssets, useFixedExpenses, useFixedIncomes } from './queries';
import { projectDailyBalance, ScheduledItem } from '../utils/projectionEngine';

/**
 * Custom hook to generate and return a 30-day daily balance projection.
 */
export function useFinancialProjections() {
  const { assets, isLoading: assetsLoading } = useAssets();
  const { fixedExpenses, isLoading: feLoading } = useFixedExpenses();
  const { fixedIncomes, isLoading: fiLoading } = useFixedIncomes();

  const isLoading = assetsLoading || feLoading || fiLoading;

  // 1. Calculate checking balance as initial balance
  const checkingBalance = assets
    ?.filter(a => a.type === 'checking')
    .reduce((sum, a) => sum + (a.balance || 0), 0) || 0;

  // 2. Map fixed expenses and incomes to ScheduledItems
  const scheduledItems: ScheduledItem[] = [];

  fixedExpenses?.forEach(fe => {
    scheduledItems.push({
      day: fe.dueDay || 1,
      amount: fe.amount,
      type: 'expense',
      description: fe.description
    });
  });

  fixedIncomes?.forEach(fi => {
    scheduledItems.push({
      day: fi.dueDay || 1,
      amount: fi.amount,
      type: 'income',
      description: fi.description
    });
  });

  // Calculate projected timeline
  const projections = projectDailyBalance(checkingBalance, scheduledItems, 15); // assume 15 EUR average daily variable spend

  return {
    projections,
    checkingBalance,
    isLoading
  };
}
