import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Goal, 
  GoalCard, 
  GoalForm, 
  GoalSimulator 
} from '../components/objectivos';
import { Plus, Target, Trophy, Sparkles, DollarSign, X } from 'lucide-react';
import { usePrivacy } from '../contexts';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import confetti from 'canvas-confetti';

const INITIAL_GOALS: Goal[] = [];

export default function ObjectivosView() {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('fin_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((g: any) => ({
            ...g,
            targetAmount: Number(g.targetAmount ?? g.target ?? 0),
            currentAmount: Number(g.currentAmount ?? g.current ?? 0),
            category: g.category || 'Outros Objetivos',
            priority: g.priority || 'Média',
            monthlySavings: Number(g.monthlySavings ?? 0),
            completed: Boolean(g.completed ?? (Number(g.currentAmount ?? g.current ?? 0) >= Number(g.targetAmount ?? g.target ?? 0)))
          }));
        }
      }
    } catch (e) {
      console.error('Erro ao carregar objetivos:', e);
    }
    return [];
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Goal | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fin_goals', JSON.stringify(goals));
    } catch (e) {
      console.error('Erro ao guardar objetivos:', e);
    }
  }, [goals]);

  // Quick Add Funds Modal
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // Overall Totals
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const completedCount = goals.filter(g => g.completed || g.currentAmount >= g.targetAmount).length;

  const handleSaveGoal = (goal: Goal) => {
    setGoals(prev => {
      const exists = prev.some(g => g.id === goal.id);
      if (exists) {
        return prev.map(g => g.id === goal.id ? goal : g);
      }
      return [goal, ...prev];
    });
    setEditingGoal(null);
  };

  const handleDeletePermanent = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextState = !g.completed;
        return {
          ...g,
          completed: nextState,
          completedAt: nextState ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return g;
    }));
  };

  const handleAddContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionGoal || !contributionAmount) return;

    const val = parseFloat(contributionAmount) || 0;
    if (val <= 0) return;

    setGoals(prev => prev.map(g => {
      if (g.id === contributionGoal.id) {
        const updatedCurrent = g.currentAmount + val;
        const isNowCompleted = updatedCurrent >= g.targetAmount;
        if (isNowCompleted && !g.completed) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
        return {
          ...g,
          currentAmount: updatedCurrent,
          completed: g.completed || isNowCompleted
        };
      }
      return g;
    }));

    setContributionGoal(null);
    setContributionAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Objetivos & Poupança" 
          subtitle="Acompanhamento e simulação de metas financeiras de curto, médio e longo prazo"
        />
        <Button onClick={() => { setEditingGoal(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Objetivo
        </Button>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Poupança Acumulada</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {maskValue(totalCurrent, formatter.format)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                de {maskValue(totalTarget, formatter.format)} planeados
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Progresso Global</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {totalProgress.toFixed(1)}%
              </p>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${Math.min(totalProgress, 100)}%` }}
                />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-medium text-muted-foreground">Metas Alcançadas</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {completedCount} <span className="text-sm font-normal text-muted-foreground">/ {goals.length}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {goals.length - completedCount} objetivos em progresso
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Simulator (12.3) */}
      <GoalSimulator goals={goals} />

      {/* Goals List (12.1) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Lista de Objetivos
        </h3>

        {goals.length === 0 ? (
          <Card className="border-border p-8 text-center text-muted-foreground">
            Nenhum objetivo registado. Clique em "Novo Objetivo" para definir as suas metas!
          </Card>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                onEdit={(g) => { setEditingGoal(g); setIsFormOpen(true); }}
                onDelete={(g) => setItemToDelete(g)}
                onToggleComplete={handleToggleComplete}
                onAddContribution={(g) => { setContributionGoal(g); setContributionAmount(''); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Goal Form Modal (12.2) */}
      <GoalForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveGoal}
        initialData={editingGoal}
      />

      {/* Quick Add Contribution Modal */}
      {contributionGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h4 className="font-bold text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Reforçar Poupança
                </h4>
                <Button variant="ghost" size="icon" onClick={() => setContributionGoal(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Adicionar reforço pontual ao objetivo <strong className="text-foreground">{contributionGoal.name}</strong>
              </p>

              <form onSubmit={handleAddContributionSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="contribVal" className="text-xs font-semibold">Valor a Adicionar (€)</Label>
                  <Input 
                    id="contribVal"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setContributionGoal(null)}>Cancelar</Button>
                  <Button type="submit" size="sm">Adicionar Reforço</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation & Trash Delete Modal (Matching Criteria from Finanças) */}
      {itemToDelete && (
        <ConfirmDeleteModal
          open={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirmPermanent={() => {
            handleDeletePermanent(itemToDelete.id);
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
          onMoveToTrashSuccess={() => {
            handleDeletePermanent(itemToDelete.id);
            setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}
