import React, { useState, Suspense, lazy } from 'react';
import { PageHeader } from '../components/layout';
import { useDashboard } from '../contexts';
import { Button } from '../components/ui/button';
import { CalendarPlus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MonthSelector,
  RegisterMonthModal,
  DashboardSkeleton,
  DashboardSummaryCards,
  DashboardSecondarySummaryCards
} from '../components/dashboard';

// Lazy loaded widgets
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
const AIInsightsWidget = lazy(() => import('../components/dashboard/AIInsightsWidget').then(m => ({ default: m.AIInsightsWidget })));
const AdvancedAssetTrends = lazy(() => import('../components/dashboard/AdvancedAssetTrends').then(m => ({ default: m.AdvancedAssetTrends })));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 20
    }
  }
};

export default function DashboardView() {
  const { currentMonth, isLoading } = useDashboard();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <PageHeader 
          title="Visão Geral" 
          subtitle={`O seu cockpit financeiro para ${currentMonth}`}
          className="mb-0"
        >
          <div className="flex items-center gap-3">
            <MonthSelector />
            <Button 
              onClick={() => setIsRegisterModalOpen(true)} 
              className="hidden sm:flex h-11 px-6 rounded-2xl items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <CalendarPlus className="w-4 h-4" />
              Preparar Meses
            </Button>
          </div>
        </PageHeader>
      </motion.div>

      <RegisterMonthModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        {/* Main Highlights Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Principais Métricas</h2>
          </div>
          <DashboardSummaryCards />
          <DashboardSecondarySummaryCards />
        </section>

        {/* Dynamic Widget Ecosystem */}
        <Suspense fallback={<DashboardSkeleton />}>
          
          {/* Liquidity & Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            <motion.div variants={itemVariants} className="col-span-1">
              <SaldoRealWidget />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <SaldoProjetadoWidget />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <BurnRateSummary />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <DashboardAssetDistribution />
            </motion.div>
          </div>

          {/* Analysis & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr mt-12">
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
              <DailyBalanceTimeline />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <ExpensesByCategoryReport />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
              <IncomeVsExpensesChart />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <CategoryInsights />
            </motion.div>
          </div>

          {/* Operational & Planning */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr mt-12">
            <motion.div variants={itemVariants} className="col-span-1">
              <DashboardRecentTransactions />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
              <DashboardGoals />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <DashboardBudgetWidget />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <DashboardFixedExpenses />
            </motion.div>
          </div>

          {/* Projections & Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr mt-12">
            <motion.div variants={itemVariants} className="col-span-1">
              <GoalSimulator />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1">
              <AIInsightsWidget />
            </motion.div>
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
              <AdvancedAssetTrends />
            </motion.div>
          </div>

        </Suspense>
      </motion.div>
    </div>
  );
}
