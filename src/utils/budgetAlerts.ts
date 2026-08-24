export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

export interface BudgetAlert {
  budgetId: string;
  category: string;
  severity: 'warning' | 'danger';
  percentage: number;
  message: string;
}

/**
 * Checks all budgets for current month and raises alerts if thresholds (80% or 100%) are crossed.
 */
export function checkBudgets(budgets: Budget[]): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  budgets.forEach(budget => {
    const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
    
    if (percentage >= 100) {
      alerts.push({
        budgetId: budget.id,
        category: budget.category,
        severity: 'danger',
        percentage,
        message: `Limite excedido! Gastou ${budget.spent.toFixed(2)}€ de um teto de ${budget.limit.toFixed(2)}€ na categoria de ${budget.category}.`
      });
    } else if (percentage >= 80) {
      alerts.push({
        budgetId: budget.id,
        category: budget.category,
        severity: 'warning',
        percentage,
        message: `Atenção: Atingiu ${percentage.toFixed(0)}% do orçamento de ${budget.category} (${budget.spent.toFixed(2)}€ de ${budget.limit.toFixed(2)}€).`
      });
    }
  });

  return alerts;
}
