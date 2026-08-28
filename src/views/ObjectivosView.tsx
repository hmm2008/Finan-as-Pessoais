import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  GoalCard, 
  GoalForm, 
  GoalSimulator 
} from '../components/objectivos';
import { Plus, Target, Trophy, Sparkles, DollarSign, X, Euro } from 'lucide-react';
import { usePrivacy } from '../contexts';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { useGoals } from '../hooks/queries';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export default function ObjectivosView() {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { goals, addGoal, updateGoal, deleteGoal, isLoading } = useGoals();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Quick Add Funds Modal
  const [contributionGoal, setContributionGoal] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // Overall Totals
  const totalTarget = useMemo(() => goals.reduce((sum: number, g: any) => sum + (g.targetAmount || 0), 0), [goals]);
  const totalCurrent = useMemo(() => goals.reduce((sum: number, g: any) => sum + (g.currentAmount || 0), 0), [goals]);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const completedCount = goals.filter((g: any) => g.completed || (g.currentAmount >= g.targetAmount)).length;

  const handleSaveGoal = async (goal: any) => {
    if (goal.id && goals.some((g: any) => g.id === goal.id)) {
      await updateGoal(goal);
    } else {
      await addGoal(goal);
    }
    setEditingGoal(null);
    setIsFormOpen(false);
  };

  const handleToggleComplete = async (id: string) => {
    const goal = goals.find((g: any) => g.id === id);
    if (goal) {
      const nextState = !goal.completed;
      await updateGoal({
        ...goal,
        completed: nextState,
        completedAt: nextState ? new Date().toISOString().split('T')[0] : undefined
      });
      if (nextState) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });
      }
    }
  };

  const handleAddContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionGoal || !contributionAmount) return;

    const val = parseFloat(contributionAmount) || 0;
    if (val <= 0) return;

    const updatedCurrent = (contributionGoal.currentAmount || 0) + val;
    const isNowCompleted = updatedCurrent >= contributionGoal.targetAmount;
    
    await updateGoal({
      ...contributionGoal,
      currentAmount: updatedCurrent,
      completed: contributionGoal.completed || isNowCompleted,
      completedAt: (isNowCompleted && !contributionGoal.completed) ? new Date().toISOString().split('T')[0] : contributionGoal.completedAt
    });

    if (isNowCompleted && !contributionGoal.completed) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    setContributionGoal(null);
    setContributionAmount('');
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PageHeader 
          title="Objetivos de Vida" 
          subtitle="Planeamento e acompanhamento das suas maiores conquistas financeiras"
        >
          <Button 
            onClick={() => { setEditingGoal(null); setIsFormOpen(true); }}
            className="h-11 px-6 rounded-2xl items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:scale-105 active:scale-95 flex"
          >
            <Plus className="w-4 h-4" /> Novo Objetivo
          </Button>
        </PageHeader>
      </motion.div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Poupança Acumulada', value: totalCurrent, subValue: `de ${maskValue(totalTarget, formatter.format)}`, icon: Target, color: 'blue' },
          { label: 'Progresso Global', value: `${totalProgress.toFixed(1)}%`, progress: totalProgress, icon: Sparkles, color: 'emerald' },
          { label: 'Metas Alcançadas', value: completedCount, subValue: `/ ${goals.length} objetivos`, icon: Trophy, color: 'amber' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.1 }}
          >
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] overflow-hidden group hover:bg-card/80 transition-all duration-300 h-full">
               <CardContent className="p-8 flex items-center justify-between h-full">
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">{stat.label}</p>
                   <p className="text-3xl font-black text-foreground tracking-tighter">
                     {typeof stat.value === 'number' && stat.label.includes('Poupança') ? maskValue(stat.value, formatter.format) : stat.value}
                   </p>
                   {stat.subValue && <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{stat.subValue}</p>}
                   {stat.progress !== undefined && (
                     <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(stat.progress, 100)}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-emerald-500 rounded-full" 
                        />
                     </div>
                   )}
                 </div>
                 <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 ${
                   stat.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                   stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                   'bg-emerald-500/10 text-emerald-600'
                 }`}>
                   <stat.icon className="w-7 h-7" />
                 </div>
               </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-12"
      >
        {/* Goal Simulator */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Simulador de Futuro</h2>
          </div>
          <GoalSimulator goals={goals} />
        </section>

        {/* Goals List */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Target className="w-4 h-4 text-amber-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Seus Objetivos</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="h-48 bg-card/40 animate-pulse rounded-[2.5rem]" />
               <div className="h-48 bg-card/40 animate-pulse rounded-[2.5rem]" />
            </div>
          ) : goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 border-2 border-dashed border-border/40 bg-card/20 rounded-[3rem] flex flex-col items-center justify-center text-center px-6"
            >
               <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
                  <Target className="w-10 h-10 text-blue-600" />
               </div>
               <h3 className="text-2xl font-black text-foreground tracking-tight">Caminho por Definir</h3>
               <p className="text-sm text-muted-foreground mt-3 max-w-sm">Dê o primeiro passo para as suas conquistas. Registe um objetivo para começar a poupar hoje.</p>
               <Button 
                  onClick={() => { setEditingGoal(null); setIsFormOpen(true); }}
                  className="mt-10 rounded-2xl h-12 px-10 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] shadow-xl"
               >
                  Definir Primeira Meta
               </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {goals.map((goal: any, idx: number) => (
                  <motion.div
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <GoalCard 
                      goal={goal}
                      onEdit={(g: any) => { setEditingGoal(g); setIsFormOpen(true); }}
                      onDelete={(g: any) => setItemToDelete(g)}
                      onToggleComplete={handleToggleComplete}
                      onAddContribution={(g: any) => { setContributionGoal(g); setContributionAmount(''); }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </motion.div>

      {/* Goal Form Modal */}
      <GoalForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveGoal}
        initialData={editingGoal}
      />

      {/* Quick Add Contribution Modal */}
      <AnimatePresence>
        {contributionGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xl p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <Card className="w-full max-w-md border-border/40 shadow-3xl rounded-[2.5rem] overflow-hidden bg-card/90 backdrop-blur-2xl">
                <CardContent className="p-8 space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="text-xl font-black flex items-center gap-2 tracking-tight uppercase">
                        <DollarSign className="w-6 h-6 text-emerald-500" />
                        Reforçar
                      </h4>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                        {contributionGoal.name}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setContributionGoal(null)} className="rounded-full hover:bg-muted">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <form onSubmit={handleAddContributionSubmit} className="space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="contribVal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Valor do Reforço (€)</Label>
                      <div className="relative">
                         <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                         <Input 
                            id="contribVal"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            className="pl-12 h-14 rounded-2xl bg-muted/40 border-border/40 focus:ring-2 focus:ring-emerald-500/20 text-lg font-black tracking-tight"
                            required
                            autoFocus
                          />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button type="submit" className="h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] shadow-xl">
                        Confirmar Reforço
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setContributionGoal(null)} className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation & Trash Delete Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          open={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirmPermanent={async () => {
            await deleteGoal(itemToDelete.id);
            setItemToDelete(null);
          }}
          entityLabel={
            itemToDelete.name 
              ? `Objetivo "${itemToDelete.name}" (${formatter.format(itemToDelete.targetAmount || 0)})`
              : 'Objetivo'
          }
          entityName="Objetivos"
          entityId={itemToDelete.id}
          entityData={itemToDelete}
          onMoveToTrashSuccess={async () => {
            await deleteGoal(itemToDelete.id);
            setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}
