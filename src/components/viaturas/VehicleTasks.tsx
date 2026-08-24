import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { VehicleTask } from './VehicleTaskForm';
import { Plus, Wrench, CheckCircle2, AlertTriangle, FileText, Trash2, Edit, RefreshCw } from 'lucide-react';
import { usePrivacy } from '../../contexts';

interface VehicleTasksProps {
  vehicleId: string;
  tasks: VehicleTask[];
  onAddTask: () => void;
  onEditTask: (task: VehicleTask) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function VehicleTasks({
  vehicleId,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus
}: VehicleTasksProps) {
  const { maskValue } = usePrivacy();
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'concluidas'>('todos');
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const vehicleTasks = tasks.filter(t => t.vehicleId === vehicleId);

  const filteredTasks = vehicleTasks.filter(t => {
    if (filter === 'pendentes') return t.status === 'pendente';
    if (filter === 'concluidas') return t.status === 'concluída';
    return true;
  });

  const getUrgencyBadge = (dueDateStr: string, status: string) => {
    if (status === 'concluída') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Concluída
        </span>
      );
    }
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Atrasado {Math.abs(diffDays)}d
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> URGENTE ({diffDays}d)
        </span>
      );
    }
    if (diffDays <= 14) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Próximo ({diffDays}d)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
        Em {diffDays}d
      </span>
    );
  };

  const getRecurrenceLabel = (interval?: string) => {
    switch (interval) {
      case '12_months': return 'Anual';
      case '24_months': return 'Bi-Anual';
      case '6_months': return 'Semestral';
      case '1_month': return 'Mensal';
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant={filter === 'todos' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('todos')}
          >
            Todas ({vehicleTasks.length})
          </Button>
          <Button 
            variant={filter === 'pendentes' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('pendentes')}
          >
            Pendentes ({vehicleTasks.filter(t => t.status === 'pendente').length})
          </Button>
          <Button 
            variant={filter === 'concluidas' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('concluidas')}
          >
            Concluídas ({vehicleTasks.filter(t => t.status === 'concluída').length})
          </Button>
        </div>

        <Button onClick={onAddTask} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nova Tarefa
        </Button>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="border-border p-8 text-center text-muted-foreground">
            Sem tarefas registadas neste filtro.
          </Card>
        ) : (
          filteredTasks.map(task => {
            const recurrenceLabel = getRecurrenceLabel(task.recurrenceInterval || (task.recurring ? '12_months' : 'none'));

            return (
              <Card key={task.id} className={`transition-all ${task.status === 'concluída' ? 'opacity-75 bg-secondary/20' : 'border-border'}`}>
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base truncate">{task.title}</h4>
                      {getUrgencyBadge(task.dueDate, task.status)}
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded-md font-medium text-muted-foreground">
                        {task.taskType}
                      </span>
                      {recurrenceLabel && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-md font-medium flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> {recurrenceLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                      <span>
                        Data Limite: <strong className="text-foreground">{new Date(task.dueDate).toLocaleDateString('pt-PT')}</strong>
                      </span>
                      {task.completedDate && (
                        <span>
                          Concluída em: <strong className="text-emerald-600">{new Date(task.completedDate).toLocaleDateString('pt-PT')}</strong>
                        </span>
                      )}
                      {task.nextDueDate && recurrenceLabel && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Próx. Ciclo: <strong>{new Date(task.nextDueDate).toLocaleDateString('pt-PT')}</strong>
                        </span>
                      )}
                      {task.documentName && (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <FileText className="w-3.5 h-3.5" /> {task.documentName}
                        </span>
                      )}
                    </div>
                    {task.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic">{task.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-foreground">
                        {task.cost > 0 ? maskValue(task.cost, formatter.format) : '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={task.status === 'concluída'} 
                        onCheckedChange={() => onToggleStatus(task.id)} 
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditTask(task)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDeleteTask(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
