import React, { useState } from 'react';
import { PageHeader } from '../components/layout';
import { useDashboard } from '../contexts';
import { Button } from '../components/ui/button';
import { CalendarPlus, Sparkles, LayoutGrid, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
  MonthSelector,
  RegisterMonthModal,
  DashboardSkeleton,
  DashboardSummaryCards,
  DashboardSecondarySummaryCards,
  DashboardWidgetGrid
} from '../components/dashboard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

export default function DashboardView() {
  const { currentMonth, isLoading } = useDashboard();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative min-h-screen pb-20 overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <PageHeader 
          title="Visão Geral" 
          subtitle={isEditing ? "A organizar o seu dashboard..." : `O seu cockpit financeiro para ${currentMonth}`}
          className="mb-0"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "h-11 w-11 rounded-2xl transition-all duration-300",
                isEditing ? "bg-primary text-primary-foreground border-primary" : "bg-background/50"
              )}
              title={isEditing ? "Concluir Personalização" : "Personalizar Dashboard"}
            >
              {isEditing ? <Check className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </Button>
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

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentMonth}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="space-y-12"
        >
          {/* Main Highlights Section */}
          <motion.section 
            variants={sectionVariants}
            className={cn("space-y-6 transition-all duration-500", isEditing && "opacity-20 blur-sm pointer-events-none grayscale")}
          >
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Principais Métricas</h2>
            </div>
            <DashboardSummaryCards />
            <DashboardSecondarySummaryCards />
          </motion.section>

          {/* Dynamic Reorderable Widget Grid */}
          <motion.section 
            variants={sectionVariants}
            className="space-y-6"
          >
            {!isEditing && (
              <div className="flex items-center gap-2 px-1">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Ecossistema de Widgets</h2>
              </div>
            )}
            <DashboardWidgetGrid isEditing={isEditing} />
          </motion.section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
