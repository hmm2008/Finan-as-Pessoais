#!/bin/bash
mkdir -p src/components/dashboard
WIDGETS=(
  "MonthSelector"
  "RegisterMonthModal"
  "WidgetGrid"
  "WidgetSkeleton"
  "DashboardSkeleton"
  "SaldoRealWidget"
  "SaldoProjetadoWidget"
  "DailyBalanceTimeline"
  "IncomeVsExpensesChart"
  "ExpensesByCategoryReport"
  "DashboardBudgetWidget"
  "DashboardFixedExpenses"
  "DashboardGoals"
  "DashboardAssetDistribution"
  "DashboardRecentTransactions"
  "BurnRateSummary"
  "CategoryInsights"
  "GoalSimulator"
  "index"
)

for widget in "${WIDGETS[@]}"; do
  if [ "$widget" == "index" ]; then
    echo "export * from './MonthSelector';" > "src/components/dashboard/${widget}.ts"
    echo "export * from './RegisterMonthModal';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './WidgetGrid';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './WidgetSkeleton';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './DashboardSkeleton';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './SaldoRealWidget';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './SaldoProjetadoWidget';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './DailyBalanceTimeline';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './IncomeVsExpensesChart';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './ExpensesByCategoryReport';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './DashboardBudgetWidget';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './DashboardFixedExpenses';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './DashboardGoals';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './DashboardAssetDistribution';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './DashboardRecentTransactions';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './BurnRateSummary';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './CategoryInsights';" >> "src/components/dashboard/${widget}.ts"
    echo "export * from './GoalSimulator';" >> "src/components/dashboard/${widget}.ts"
  else
    cat << FILE_EOF > "src/components/dashboard/${widget}.tsx"
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function ${widget}() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>${widget}</CardTitle>
      </CardHeader>
      <CardContent>
        Placeholder for ${widget}
      </CardContent>
    </Card>
  );
}
FILE_EOF
  fi
done
