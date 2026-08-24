import React, { useState, useEffect, Suspense } from 'react';
import { PageHeader } from '../components/layout';
import { useDashboard } from '../contexts';
import { Button } from '../components/ui/button';
import { CalendarPlus, Plus } from 'lucide-react';
import {
  MonthSelector,
  RegisterMonthModal,
  WidgetGrid,
  DashboardSkeleton,
  SaldoRealWidget,
  SaldoProjetadoWidget,
  DailyBalanceTimeline,
  IncomeVsExpensesChart,
  ExpensesByCategoryReport,
  DashboardBudgetWidget,
  DashboardFixedExpenses,
  DashboardGoals,
  DashboardAssetDistribution,
  DashboardRecentTransactions,
  BurnRateSummary,
  CategoryInsights,
  GoalSimulator,
  DashboardSummaryCards
} from '../components/dashboard';

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

      {/* Summary Cards directly below the header */}
      <DashboardSummaryCards />

      <WidgetGrid>
        {/* Top Row: Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-12">
          <SaldoRealWidget />
          <SaldoProjetadoWidget />
          <BurnRateSummary />
          <DashboardAssetDistribution />
        </div>

        {/* Middle Row: Charts & Insights */}
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

        {/* Bottom Row: Budgets, Goals, Transactions */}
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
    </div>
  );
}
