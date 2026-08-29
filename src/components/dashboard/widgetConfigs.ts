import { lazy } from 'react';

export interface WidgetConfig {
  id: string;
  title: string;
  component: any;
  defaultColSpan: number; // 1 to 12
}

export const WIDGETS: WidgetConfig[] = [
  {
    id: 'saldo-real',
    title: 'Saldo Real',
    component: lazy(() => import('./SaldoRealWidget').then(m => ({ default: m.SaldoRealWidget }))),
    defaultColSpan: 3,
  },
  {
    id: 'saldo-projetado',
    title: 'Saldo Projetado',
    component: lazy(() => import('./SaldoProjetadoWidget').then(m => ({ default: m.SaldoProjetadoWidget }))),
    defaultColSpan: 3,
  },
  {
    id: 'burn-rate',
    title: 'Burn Rate',
    component: lazy(() => import('./BurnRateSummary').then(m => ({ default: m.BurnRateSummary }))),
    defaultColSpan: 3,
  },
  {
    id: 'asset-distribution',
    title: 'Distribuição de Património',
    component: lazy(() => import('./DashboardAssetDistribution').then(m => ({ default: m.DashboardAssetDistribution }))),
    defaultColSpan: 3,
  },
  {
    id: 'daily-timeline',
    title: 'Linha do Tempo',
    component: lazy(() => import('./DailyBalanceTimeline').then(m => ({ default: m.DailyBalanceTimeline }))),
    defaultColSpan: 8,
  },
  {
    id: 'expenses-category',
    title: 'Despesas por Categoria',
    component: lazy(() => import('./ExpensesByCategoryReport').then(m => ({ default: m.ExpensesByCategoryReport }))),
    defaultColSpan: 4,
  },
  {
    id: 'income-vs-expenses',
    title: 'Receitas vs Despesas',
    component: lazy(() => import('./IncomeVsExpensesChart').then(m => ({ default: m.IncomeVsExpensesChart }))),
    defaultColSpan: 8,
  },
  {
    id: 'category-insights',
    title: 'Insights de Categorias',
    component: lazy(() => import('./CategoryInsights').then(m => ({ default: m.CategoryInsights }))),
    defaultColSpan: 4,
  },
  {
    id: 'recent-transactions',
    title: 'Transações Recentes',
    component: lazy(() => import('./DashboardRecentTransactions').then(m => ({ default: m.DashboardRecentTransactions }))),
    defaultColSpan: 4,
  },
  {
    id: 'goals',
    title: 'Metas Financeiras',
    component: lazy(() => import('./DashboardGoals').then(m => ({ default: m.DashboardGoals }))),
    defaultColSpan: 8,
  },
  {
    id: 'budgets',
    title: 'Orçamentos',
    component: lazy(() => import('./DashboardBudgetWidget').then(m => ({ default: m.DashboardBudgetWidget }))),
    defaultColSpan: 6,
  },
  {
    id: 'fixed-expenses',
    title: 'Despesas Fixas',
    component: lazy(() => import('./DashboardFixedExpenses').then(m => ({ default: m.DashboardFixedExpenses }))),
    defaultColSpan: 6,
  },
  {
    id: 'goal-simulator',
    title: 'Simulador de Metas',
    component: lazy(() => import('./GoalSimulator').then(m => ({ default: m.GoalSimulator }))),
    defaultColSpan: 6,
  },
  {
    id: 'ai-insights',
    title: 'IA Insights',
    component: lazy(() => import('./AIInsightsWidget').then(m => ({ default: m.AIInsightsWidget }))),
    defaultColSpan: 6,
  },
  {
    id: 'asset-trends',
    title: 'Tendências de Ativos',
    component: lazy(() => import('./AdvancedAssetTrends').then(m => ({ default: m.AdvancedAssetTrends }))),
    defaultColSpan: 12,
  },
];
