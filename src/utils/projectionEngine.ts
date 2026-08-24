export interface ScheduledItem {
  day: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
}

/**
 * Projects the daily balance for the next 30 days.
 * @param initialBalance Current total balance of checked accounts
 * @param scheduledItems Recurring transactions with specific target days (fixed incomes/expenses)
 * @param avgDailyVariableExpense Estimated daily variable spending
 */
export function projectDailyBalance(
  initialBalance: number,
  scheduledItems: ScheduledItem[],
  avgDailyVariableExpense = 0
): { date: string; balance: number; event?: string }[] {
  const projections: { date: string; balance: number; event?: string }[] = [];
  let currentBalance = initialBalance;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dayOfMonth = futureDate.getDate();
    const dateString = futureDate.toISOString().split('T')[0];

    // 1. Subtract daily variable average
    currentBalance -= avgDailyVariableExpense;
    let eventName = '';

    // 2. Check for scheduled items matching this day of month
    scheduledItems.forEach(item => {
      if (item.day === dayOfMonth) {
        if (item.type === 'income') {
          currentBalance += item.amount;
          eventName = eventName ? `${eventName}, +${item.description}` : `+${item.description}`;
        } else {
          currentBalance -= item.amount;
          eventName = eventName ? `${eventName}, -${item.description}` : `-${item.description}`;
        }
      }
    });

    projections.push({
      date: dateString,
      balance: parseFloat(currentBalance.toFixed(2)),
      ...(eventName ? { event: eventName } : {})
    });
  }

  return projections;
}
