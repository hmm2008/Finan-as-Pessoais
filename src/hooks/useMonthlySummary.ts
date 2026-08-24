import { useExpenses, useIncomes } from './queries';
import { isDateInMonth } from './dateRangeUtils';

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionsCount: number;
  expenseCategories: CategorySummary[];
  incomeCategories: CategorySummary[];
  isLoading: boolean;
}

/**
 * Custom hook to aggregate income and expense transactions for a specific month (YYYY-MM).
 */
export function useMonthlySummary(monthStr: string): MonthlySummary {
  const { expenses, isLoading: expLoading } = useExpenses();
  const { incomes, isLoading: incLoading } = useIncomes();

  const isLoading = expLoading || incLoading;

  // Filter current month transactions
  const monthExpenses = expenses.filter(e => isDateInMonth(e.date, monthStr));
  const monthIncomes = incomes.filter(i => isDateInMonth(i.date, monthStr));

  // Compute totals
  const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const transactionsCount = monthExpenses.length + monthIncomes.length;

  // Group expenses by category
  const expGroup: Record<string, number> = {};
  monthExpenses.forEach(e => {
    expGroup[e.category] = (expGroup[e.category] || 0) + e.amount;
  });

  const expenseCategories = Object.entries(expGroup)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group incomes by category
  const incGroup: Record<string, number> = {};
  monthIncomes.forEach(i => {
    incGroup[i.category] = (incGroup[i.category] || 0) + i.amount;
  });

  const incomeCategories = Object.entries(incGroup)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpense,
    netSavings,
    transactionsCount,
    expenseCategories,
    incomeCategories,
    isLoading
  };
}
