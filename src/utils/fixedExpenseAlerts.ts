export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  dueDay: number; // Day of the month
  category: string;
}

export interface FixedExpenseAlert {
  expenseId: string;
  description: string;
  amount: number;
  dueDate: string;
  daysRemaining: number;
  isInsufficientBalance: boolean;
}

/**
 * Calculates and flags upcoming fixed expenses within the next N days.
 * @param expenses List of recurring fixed expenses
 * @param currentBalance Available liquid checking account balance
 * @param daysAhead Number of days to look ahead (default: 7)
 */
export function getUpcomingFixedExpenseAlerts(
  expenses: FixedExpense[],
  currentBalance: number,
  daysAhead = 7
): FixedExpenseAlert[] {
  const alerts: FixedExpenseAlert[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  expenses.forEach(expense => {
    // Calculate actual due date for this month (or next if already passed)
    let dueDay = expense.dueDay;
    let dueMonthDate = new Date(currentYear, currentMonth, dueDay);

    // If due day has already passed this month, project to next month
    if (dueMonthDate < today && dueMonthDate.toDateString() !== today.toDateString()) {
      dueMonthDate = new Date(currentYear, currentMonth + 1, dueDay);
    }

    const diffTime = dueMonthDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= daysAhead) {
      alerts.push({
        expenseId: expense.id,
        description: expense.description,
        amount: expense.amount,
        dueDate: dueMonthDate.toISOString().split('T')[0],
        daysRemaining: diffDays,
        isInsufficientBalance: currentBalance < expense.amount
      });
    }
  });

  return alerts;
}
