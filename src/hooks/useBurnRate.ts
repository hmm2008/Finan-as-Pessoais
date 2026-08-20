import { useAssets, useExpenses } from './queries';
import { calculateBurnRate } from '../utils/financialMath';

/**
 * Custom hook to calculate spending burn rate and runway in months.
 */
export function useBurnRate() {
  const { assets, isLoading: assetsLoading } = useAssets();
  const { expenses, isLoading: expLoading } = useExpenses();

  const isLoading = assetsLoading || expLoading;

  // 1. Calculate total liquid savings/investments/checking assets
  const totalAssets = assets?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0;

  // 2. Calculate average monthly expenses from past expenses
  // We can group expenses by month and calculate the average
  const monthlyTotals: Record<string, number> = {};
  expenses?.forEach(e => {
    const month = e.date.substring(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
  });

  const totals = Object.values(monthlyTotals);
  const avgMonthlyExpenses = totals.length > 0 
    ? totals.reduce((sum, t) => sum + t, 0) / totals.length 
    : 0;

  const { burnRate, runwayMonths } = calculateBurnRate(totalAssets, avgMonthlyExpenses);

  return {
    totalAssets,
    avgMonthlyExpenses: burnRate,
    runwayMonths,
    isLoading
  };
}
