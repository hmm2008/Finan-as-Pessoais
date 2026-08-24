import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bell, Calendar, AlertTriangle, ShieldCheck, FileText, Wrench } from 'lucide-react';
import { VehicleTask } from './VehicleTaskForm';
import { Vehicle } from './VehicleForm';

interface VehicleRemindersProps {
  vehicles: Vehicle[];
  tasks: VehicleTask[];
}

export function VehicleReminders({ vehicles, tasks }: VehicleRemindersProps) {
  const getVehicleName = (vId: string) => {
    const v = vehicles.find(item => item.id === vId);
    return v ? `${v.brand} ${v.model} (${v.plate})` : 'Viatura';
  };

  const getTaskIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'seguro': return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'iuc':
      case 'ipo (inspeção)': return <FileText className="w-4 h-4 text-amber-600" />;
      default: return <Wrench className="w-4 h-4 text-primary" />;
    }
  };

  const pendingTasks = tasks
    .filter(t => t.status === 'pendente')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (pendingTasks.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Sem tarefas nem lembretes pendentes para as suas viaturas.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-300">
          <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Próximos Vencimentos de Viaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-2.5">
        {pendingTasks.slice(0, 4).map(task => {
          const now = new Date();
          const due = new Date(task.dueDate);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let badgeColor = 'bg-emerald-500/10 text-emerald-600';
          if (diffDays <= 7) badgeColor = 'bg-destructive/10 text-destructive font-bold';
          else if (diffDays <= 14) badgeColor = 'bg-amber-500/10 text-amber-600 font-bold';

          return (
            <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 border border-border text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary shrink-0">
                  {getTaskIcon(task.taskType)}
                </div>
                <div>
                  <p className="font-semibold text-foreground leading-tight">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{getVehicleName(task.vehicleId)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-xs ${badgeColor}`}>
                  {diffDays < 0 ? `Atrasado ${Math.abs(diffDays)}d` : diffDays === 0 ? 'Hoje' : `em ${diffDays}d`}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(task.dueDate).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
