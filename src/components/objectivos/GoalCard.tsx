import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Goal, GoalPriority } from './types';
import { GoalCircularProgress } from './GoalCircularProgress';
import { usePrivacy } from '../../contexts';
import confetti from 'canvas-confetti';
import { 
  Target, Calendar, Clock, CheckCircle2, Trophy, 
  Edit, Trash2, Plus, ArrowUpRight 
} from 'lucide-react';

interface GoalCardProps {
  key?: any;
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onToggleComplete: (id: string) => void;
  onAddContribution: (goal: Goal) => void;
}

const PRIORITY_BADGES: Record<GoalPriority, { label: string; className: string }> = {
  Baixa: { label: 'Prioridade Baixa', className: 'bg-secondary text-muted-foreground border-secondary' },
  Média: { label: 'Prioridade Média', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  Alta: { label: 'Prioridade Alta', className: 'bg-destructive/10 text-destructive border-destructive/20 font-bold' }
};

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onToggleComplete,
  onAddContribution
}: GoalCardProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Countdown calculations
  const calculateCountdown = (deadlineStr: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Prazo ultrapassado', isPast: true };
    if (diffDays === 0) return { text: 'Vence hoje!', isPast: false, isUrgent: true };
    if (diffDays < 30) return { text: `Faltam ${diffDays} dias`, isPast: false, isUrgent: true };
    
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    if (remainingDays === 0) return { text: `Faltam ${months} meses`, isPast: false };
    return { text: `Faltam ~${months} m e ${remainingDays} d`, isPast: false };
  };

  const countdown = calculateCountdown(goal.deadline);
  const isCompleted = goal.completed || goal.currentAmount >= goal.targetAmount;

  const handleCompleteClick = () => {
    if (!goal.completed) {
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    onToggleComplete(goal.id);
  };

  return (
    <Card className={`transition-all overflow-hidden border ${
      isCompleted 
        ? 'border-emerald-500/40 bg-emerald-500/5' 
        : 'border-border hover:border-border/80'
    }`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Circular Progress Indicator */}
          <GoalCircularProgress 
            current={goal.currentAmount} 
            target={goal.targetAmount} 
            size={110} 
            strokeWidth={9} 
          />

          {/* Main Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h4 className="font-bold text-lg text-foreground truncate">{goal.name}</h4>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${PRIORITY_BADGES[goal.priority].className}`}>
                {PRIORITY_BADGES[goal.priority].label}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                {goal.category}
              </span>
            </div>

            {/* Financial Totals */}
            <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2 text-sm">
              <span className="text-2xl font-bold text-foreground">
                {maskValue(goal.currentAmount, formatter.format)}
              </span>
              <span className="text-muted-foreground font-medium">
                de {maskValue(goal.targetAmount, formatter.format)}
              </span>
            </div>

            {/* Additional details: monthly savings & countdown */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              {goal.monthlySavings > 0 && (
                <span className="flex items-center gap-1 font-medium text-primary">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Poupança: {maskValue(goal.monthlySavings, formatter.format)}/mês
                </span>
              )}

              {goal.deadline && countdown && (
                <span className={`flex items-center gap-1 font-semibold ${
                  countdown.isPast 
                    ? 'text-destructive' 
                    : countdown.isUrgent 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-muted-foreground'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {countdown.text} ({new Date(goal.deadline).toLocaleDateString('pt-PT')})
                </span>
              )}
            </div>

            {goal.notes && (
              <p className="text-xs text-muted-foreground italic line-clamp-1 pt-1">{goal.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto border-border">
            <Button
              variant={isCompleted ? 'outline' : 'default'}
              size="sm"
              onClick={handleCompleteClick}
              className={`text-xs font-semibold w-full sm:w-auto ${
                isCompleted 
                  ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  Concluído!
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-1.5" />
                  Concluir Objetivos
                </>
              )}
            </Button>

            <div className="flex items-center gap-1">
              {!isCompleted && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAddContribution(goal)}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Reforçar
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(goal)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(goal)} title="Eliminar Objetivo">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
