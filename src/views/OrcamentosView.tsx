import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Target, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Sparkles
} from 'lucide-react';
import { useBudgets, useExpenses } from '../hooks/queries';
import { useDashboard, usePrivacy } from '../contexts';
import { BudgetFormModal } from '../components/orcamentos/BudgetFormModal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': '🛒',
  'Habitação': '🏠',
  'Transportes': '🚌',
  'Combustível': '⛽',
  'Lazer': '🍿',
  'Saúde': '💊',
  'Educação': '📚',
  'Outros': '📦',
};

export default function OrcamentosView() {
  const { currentMonth, setMonth } = useDashboard();
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { budgets, addBudget, updateBudget, deleteBudget, isLoading: budgetsLoading } = useBudgets();
  const { expenses, isLoading: expensesLoading } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Month parsing for navigation
  const current = currentMonth || new Date().toISOString().slice(0, 7);
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const monthNameYear = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
  const capitalizedMonthYear = monthNameYear.charAt(0).toUpperCase() + monthNameYear.slice(1);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(`${year - 1}-12`);
    } else {
      setMonth(`${year}-${String(month - 1).padStart(2, '0')}`);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(`${year + 1}-01`);
    } else {
      setMonth(`${year}-${String(month + 1).padStart(2, '0')}`);
    }
  };

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dynamicMonths = monthNames.map((label, idx) => {
    const mNum = String(idx + 1).padStart(2, '0');
    return {
      label,
      value: `${year}-${mNum}`
    };
  });

  // Filter budgets for selected month
  const monthBudgets = budgets.filter((b: any) => {
    if (!b.month) return true; // Incluir orçamentos recorrentes (sem mês definido)
    
    const budgetMonthStr = String(b.month).trim();
    if (!budgetMonthStr) return true;

    // Caso 1: Orçamento tem Ano-Mês (Ex: 2024-08)
    if (budgetMonthStr.includes('-')) {
      return budgetMonthStr === currentMonth;
    }

    // Caso 2: Orçamento tem apenas o número do mês (Ex: "8" ou "08")
    const selectedMonthOnly = currentMonth.split('-')[1]; // Ex: "08"
    return budgetMonthStr.padStart(2, '0') === selectedMonthOnly;
  });

  // Budgets relevant to currently selected month for KPIs
  const relevantBudgets = budgets.filter((b: any) => {
    if (!b.month) return true;
    const budgetMonthStr = String(b.month).trim();
    if (budgetMonthStr.includes('-')) {
      return budgetMonthStr === currentMonth;
    }
    const selectedMonthOnly = currentMonth.split('-')[1];
    return budgetMonthStr.padStart(2, '0') === selectedMonthOnly;
  });

  // Calculate actual spending per category from expenses for this month
  const monthExpenses = expenses.filter(
    (exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth)
  );

  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach((exp: any) => {
    const cat = exp.category || 'Outros';
    spentByCategory[cat] = (spentByCategory[cat] || 0) + (Number(exp.amount) || 0);
  });

  // Calculate summary metrics
  const totalLimit = relevantBudgets.reduce((acc: number, b: any) => acc + (Number(b.limit) || 0), 0);
  const totalSpent = relevantBudgets.reduce((acc: number, b: any) => {
    const cat = b.category || 'Outros';
    const spent = spentByCategory[cat] ?? Number(b.spent || 0);
    return acc + spent;
  }, 0);

  const remainingTotal = totalLimit - totalSpent;
  const overBudgetsCount = monthBudgets.filter((b: any) => {
    const cat = b.category || 'Outros';
    const spent = spentByCategory[cat] ?? Number(b.spent || 0);
    return spent > Number(b.limit || 0);
  }).length;

  const handleSaveBudget = async (data: { id?: string; category: string; limit: number; month?: string }) => {
    try {
      if (data.id) {
        await updateBudget({
          id: data.id,
          category: data.category,
          limit: data.limit,
          month: data.month || currentMonth
        });
      } else {
        await addBudget({
          id: 'bgt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          category: data.category,
          limit: data.limit,
          month: data.month || currentMonth,
          spent: 0
        });
      }
      setIsModalOpen(false);
      setEditingBudget(null);
    } catch (err) {
      console.error('Erro ao guardar orçamento:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Erro ao eliminar orçamento:', err);
    }
  };

  const isLoading = budgetsLoading || expensesLoading;

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-40 left-0 -z-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PageHeader
          title="Gestão Orçamental"
          subtitle="Controlo de limites de gastos e disciplina financeira"
        >
          <Button 
            onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}
            className="h-11 px-6 rounded-2xl items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:scale-105 active:scale-95 flex"
          >
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Button>
        </PageHeader>
      </motion.div>

      {/* Month Navigator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-3xl overflow-hidden">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/20">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-black uppercase tracking-widest px-4 min-w-[140px] text-center">
                  {capitalizedMonthYear}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  className="h-10 rounded-xl px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-border/20 hover:bg-muted"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Selecionar
                </Button>
                
                <AnimatePresence>
                  {datePickerOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDatePickerOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-3xl p-4 z-50"
                      >
                         <div className="flex items-center justify-between mb-4 px-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(`${year - 1}-${String(month).padStart(2, '0')}`)}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="font-black text-sm tracking-tighter">{year}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(`${year + 1}-${String(month).padStart(2, '0')}`)}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 12 }).map((_, i) => {
                              const d = new Date(year, i, 1);
                              const mStr = d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '');
                              const mLabel = mStr.charAt(0).toUpperCase() + mStr.slice(1);
                              const fullVal = `${year}-${String(i + 1).padStart(2, '0')}`;
                              const isActive = current === fullVal;
                              return (
                                <button
                                  key={i}
                                  onClick={() => { setMonth(fullVal); setDatePickerOpen(false); }}
                                  className={`py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                                    isActive ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {mLabel}
                                </button>
                              );
                            })}
                         </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
               {dynamicMonths.map(m => (
                 <button 
                    key={m.value} 
                    onClick={() => setMonth(m.value)}
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                      current === m.value ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:bg-muted'
                    }`}
                 >
                   {m.label}
                 </button>
               ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Teto Total Orçado', value: totalLimit, icon: Target, color: 'indigo' },
          { label: 'Total Consumido', value: totalSpent, icon: TrendingUp, color: 'emerald' },
          { label: 'Margem Disponível', value: remainingTotal, icon: CheckCircle2, color: remainingTotal < 0 ? 'rose' : 'emerald' },
          { label: 'Alertas Excedidos', value: overBudgetsCount, icon: ShieldAlert, color: overBudgetsCount > 0 ? 'rose' : 'muted', isCount: true }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
          >
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2rem] group hover:bg-card/80 transition-all">
               <CardContent className="p-6 flex items-center justify-between">
                 <div className="space-y-1.5">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">{stat.label}</p>
                   <p className={`text-2xl font-black tracking-tighter ${stat.color === 'rose' ? 'text-rose-600' : 'text-foreground'}`}>
                     {stat.isCount ? `${stat.value} ${stat.value === 1 ? 'Categoria' : 'Categorias'}` : maskValue(stat.value as number, formatter.format)}
                   </p>
                 </div>
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                   stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600' :
                   stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                   stat.color === 'rose' ? 'bg-rose-500/10 text-rose-600' :
                   'bg-muted text-muted-foreground/40'
                 }`}>
                   <stat.icon className="w-6 h-6" />
                 </div>
               </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Análise por Categoria</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="h-48 bg-card/40 animate-pulse rounded-[2.5rem]" />
             <div className="h-48 bg-card/40 animate-pulse rounded-[2.5rem]" />
             <div className="h-48 bg-card/40 animate-pulse rounded-[2.5rem]" />
          </div>
        ) : monthBudgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 border-2 border-dashed border-border/40 bg-card/20 rounded-[3rem] flex flex-col items-center justify-center text-center px-6"
          >
             <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-8 border border-indigo-500/20">
                <Target className="w-10 h-10 text-indigo-600" />
             </div>
             <h3 className="text-2xl font-black text-foreground tracking-tight">Sem Orçamentos</h3>
             <p className="text-sm text-muted-foreground mt-3 max-w-sm">Defina limites mensais para controlar melhor os seus gastos por categoria.</p>
             <Button 
                onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}
                className="mt-10 rounded-2xl h-12 px-10 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] shadow-xl"
             >
                Criar Primeiro Orçamento
             </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {monthBudgets.sort((a: any, b: any) => {
                if (a.month !== b.month) return (b.month || '').localeCompare(a.month || '');
                return (a.category || '').localeCompare(b.category || '');
              }).map((b: any, idx: number) => {
                const category = b.category || 'Geral';
                const limit = Number(b.limit) || 0;
                const spent = spentByCategory[category] ?? Number(b.spent || 0);
                const ratio = limit > 0 ? (spent / limit) * 100 : 0;
                const isOver = ratio > 100;
                const isWarning = ratio >= 80 && !isOver;
                const icon = CATEGORY_ICONS[category] || '🎯';
                const isCurrentMonth = !b.month || b.month === currentMonth;

                return (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={!isCurrentMonth ? 'opacity-60' : ''}
                  >
                    <Card className="group overflow-hidden border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 rounded-[2.5rem] shadow-2xl shadow-black/5 h-full flex flex-col">
                      <div className="p-8 pb-4 flex items-start justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-3xl bg-foreground/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                               {icon}
                            </div>
                            <div>
                               <h4 className="text-xl font-black text-foreground tracking-tighter truncate leading-tight">{category}</h4>
                               {!b.month ? (
                                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 block">Recorrente</span>
                               ) : (
                                 <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1 block">
                                   {new Date(b.month + '-01').toLocaleString('pt-PT', { month: 'short', year: '2-digit' })}
                                 </span>
                               )}
                            </div>
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => { setEditingBudget(b); setIsModalOpen(true); }}>
                               <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10" onClick={() => setDeleteTarget(b)}>
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                      </div>

                      <CardContent className="p-8 pt-4 flex-1 flex flex-col justify-end space-y-6">
                         <div className="space-y-4">
                            <div className="flex justify-between items-end">
                               <div className="space-y-1">
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Utilizado</p>
                                  <p className={`text-2xl font-black tracking-tighter tabular-nums ${isOver ? 'text-rose-600' : 'text-foreground'}`}>
                                    {maskValue(spent, formatter.format)}
                                  </p>
                               </div>
                               <div className="text-right space-y-1">
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Teto</p>
                                  <p className="text-sm font-black text-muted-foreground/60 tracking-tight tabular-nums">
                                    {maskValue(limit, formatter.format)}
                                  </p>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <div className="w-full h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(ratio, 100)}%` }}
                                    transition={{ duration: 1 }}
                                    className={`h-full rounded-full ${
                                      isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                                    }`}
                                  />
                               </div>
                               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                  <span className={isOver ? 'text-rose-600' : isWarning ? 'text-amber-500' : 'text-emerald-600'}>
                                    {ratio.toFixed(0)}% Consumido
                                  </span>
                                  <span className="text-muted-foreground/40">
                                    {isOver ? `+ ${maskValue(spent - limit, formatter.format)}` : `Resta ${maskValue(limit - spent, formatter.format)}`}
                                  </span>
                               </div>
                            </div>
                         </div>

                         {isOver && (
                           <div className="bg-rose-500/10 p-3 rounded-2xl flex items-center gap-3 border border-rose-500/10">
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-tight">Limite Excedido</span>
                           </div>
                         )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Forms & Modals */}
      <BudgetFormModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBudget(null); }}
        onSubmit={handleSaveBudget}
        initialData={editingBudget}
        currentMonth={currentMonth}
      />

      {deleteTarget && (
        <ConfirmDeleteModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirmPermanent={handleDeleteConfirm}
          entityLabel={`Orçamento de ${deleteTarget.category}`}
          entityName="Orçamentos"
          entityId={deleteTarget.id}
          entityData={deleteTarget}
          onMoveToTrashSuccess={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
