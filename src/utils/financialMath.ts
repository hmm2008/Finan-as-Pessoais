/**
 * Financial mathematical and statistical formulas.
 */

export interface ProjectionParameters {
  initialBalance: number;
  monthlySavings: number;
  annualInterestRate: number; // e.g. 0.05 for 5%
  years: number;
}

/**
 * Calculates average value of a numeric field from an array of objects.
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return sum / values.length;
}

/**
 * Calculates financial Burn Rate and Runway (how many months current savings can cover).
 * @param totalAssets total liquid assets/savings
 * @param monthlyExpenses average monthly spending
 */
export function calculateBurnRate(totalAssets: number, monthlyExpenses: number): { burnRate: number; runwayMonths: number } {
  const runway = monthlyExpenses > 0 ? totalAssets / monthlyExpenses : Infinity;
  return {
    burnRate: monthlyExpenses,
    runwayMonths: isFinite(runway) ? parseFloat(runway.toFixed(1)) : 999
  };
}

/**
 * Project compound interest returns over time.
 */
export function projectCompoundInterest({
  initialBalance,
  monthlySavings,
  annualInterestRate,
  years
}: ProjectionParameters): { year: number; balance: number; interestEarned: number }[] {
  const result: { year: number; balance: number; interestEarned: number }[] = [];
  let currentBalance = initialBalance;
  let totalContributed = initialBalance;
  const monthlyRate = annualInterestRate / 12;

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      currentBalance += monthlySavings;
      totalContributed += monthlySavings;
      const monthlyInterest = currentBalance * monthlyRate;
      currentBalance += monthlyInterest;
    }

    result.push({
      year,
      balance: parseFloat(currentBalance.toFixed(2)),
      interestEarned: parseFloat((currentBalance - totalContributed).toFixed(2))
    });
  }

  return result;
}
