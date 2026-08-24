import { useBudgets, useFixedExpenses, useAssets } from './queries';
import { checkBudgets, BudgetAlert } from '../utils/budgetAlerts';
import { getUpcomingFixedExpenseAlerts, FixedExpenseAlert } from '../utils/fixedExpenseAlerts';

export interface SessionAlerts {
  budgetAlerts: BudgetAlert[];
  fixedExpenseAlerts: FixedExpenseAlert[];
  hasCriticalAlerts: boolean;
  hasWarningAlerts: boolean;
  isLoading: boolean;
}

/**
 * Custom hook to compile real-time session alerts (budget limits and due dates).
 */
export function useSessionAlerts(): SessionAlerts {
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const { fixedExpenses, isLoading: feLoading } = useFixedExpenses();
  const { assets, isLoading: assetsLoading } = useAssets();

  const isLoading = budgetsLoading || feLoading || assetsLoading;

  // 1. Check budget limits
  const budgetAlerts = budgets ? checkBudgets(budgets) : [];

  // 2. Check upcoming fixed expenses against checking balance
  const checkingBalance = assets
    ?.filter(a => a.type === 'checking')
    .reduce((sum, a) => sum + (a.balance || 0), 0) || 0;

  const fixedExpenseAlerts = fixedExpenses
    ? getUpcomingFixedExpenseAlerts(fixedExpenses, checkingBalance, 7) // 7 days lookahead
    : [];

  const hasCriticalAlerts = 
    budgetAlerts.some(a => a.severity === 'danger') || 
    fixedExpenseAlerts.some(a => a.isInsufficientBalance);

  const hasWarningAlerts = 
    budgetAlerts.some(a => a.severity === 'warning') || 
    fixedExpenseAlerts.length > 0;

  return {
    budgetAlerts,
    fixedExpenseAlerts,
    hasCriticalAlerts,
    hasWarningAlerts,
    isLoading
  };
}
