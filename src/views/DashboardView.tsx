import React, { useState, useEffect, Suspense, lazy } from 'react';
import { PageHeader } from '../components/layout';
import { useDashboard } from '../contexts';
import { Button } from '../components/ui/button';
import { CalendarPlus, Plus } from 'lucide-react';
import {
  MonthSelector,
  RegisterMonthModal,
  WidgetGrid,
  DashboardSkeleton,
  DashboardSummaryCards,
  DashboardSecondarySummaryCards
} from '../components/dashboard';

const SaldoRealWidget = lazy(() => import('../components/dashboard/SaldoRealWidget').then(m => ({ default: m.SaldoRealWidget })));
const SaldoProjetadoWidget = lazy(() => import('../components/dashboard/SaldoProjetadoWidget').then(m => ({ default: m.SaldoProjetadoWidget })));
const DailyBalanceTimeline = lazy(() => import('../components/dashboard/DailyBalanceTimeline').then(m => ({ default: m.DailyBalanceTimeline })));
const IncomeVsExpensesChart = lazy(() => import('../components/dashboard/IncomeVsExpensesChart').then(m => ({ default: m.IncomeVsExpensesChart })));
const ExpensesByCategoryReport = lazy(() => import('../components/dashboard/ExpensesByCategoryReport').then(m => ({ default: m.ExpensesByCategoryReport })));
const DashboardBudgetWidget = lazy(() => import('../components/dashboard/DashboardBudgetWidget').then(m => ({ default: m.DashboardBudgetWidget })));
const DashboardFixedExpenses = lazy(() => import('../components/dashboard/DashboardFixedExpenses').then(m => ({ default: m.DashboardFixedExpenses })));
const DashboardGoals = lazy(() => import('../components/dashboard/DashboardGoals').then(m => ({ default: m.DashboardGoals })));
const DashboardAssetDistribution = lazy(() => import('../components/dashboard/DashboardAssetDistribution').then(m => ({ default: m.DashboardAssetDistribution })));
const DashboardRecentTransactions = lazy(() => import('../components/dashboard/DashboardRecentTransactions').then(m => ({ default: m.DashboardRecentTransactions })));
const BurnRateSummary = lazy(() => import('../components/dashboard/BurnRateSummary').then(m => ({ default: m.BurnRateSummary })));
const CategoryInsights = lazy(() => import('../components/dashboard/CategoryInsights').then(m => ({ default: m.CategoryInsights })));
const GoalSimulator = lazy(() => import('../components/dashboard/GoalSimulator').then(m => ({ default: m.GoalSimulator })));

export default function DashboardView() {
  const { currentMonth, isLoading } = useDashboard();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Visão Geral" subtitle="O seu painel financeiro interativo">
        <MonthSelector />
        <Button 
          onClick={() => setIsRegisterModalOpen(true)} 
          className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-xs"
        >
          <CalendarPlus className="w-4 h-4" />
          Preparar Meses
        </Button>
      </PageHeader>

      <RegisterMonthModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />

      <DashboardSummaryCards />
      <DashboardSecondarySummaryCards />

      <Suspense fallback={<DashboardSkeleton />}>
        <WidgetGrid>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-12">
            <SaldoRealWidget />
            <SaldoProjetadoWidget />
            <BurnRateSummary />
            <DashboardAssetDistribution />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 col-span-12">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <DailyBalanceTimeline />
              <IncomeVsExpensesChart />
            </div>
            <div className="flex flex-col gap-4">
              <ExpensesByCategoryReport />
              <CategoryInsights />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 col-span-12">
            <DashboardBudgetWidget />
            <DashboardGoals />
            <div className="flex flex-col gap-4">
              <DashboardFixedExpenses />
              <DashboardRecentTransactions />
            </div>
          </div>

          <div className="col-span-12">
            <GoalSimulator />
          </div>
        </WidgetGrid>
      </Suspense>
    </div>
  );
}
