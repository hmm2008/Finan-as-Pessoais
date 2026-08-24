import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { X, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import { VehicleTask } from './VehicleTaskForm';
import { Vehicle } from './VehicleForm';

interface SyncToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  tasks: VehicleTask[];
}

export function SyncToCalendarModal({ isOpen, onClose, vehicles, tasks }: SyncToCalendarModalProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(tasks.map(t => t.id));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncedSuccess(true);
      setTimeout(() => {
        setSyncedSuccess(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  const getVehicleName = (vId: string) => {
    const v = vehicles.find(item => item.id === vId);
    return v ? `${v.brand} ${v.model} (${v.plate})` : 'Viatura';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-md shadow-xl border-border my-8">
        <CardHeader className="relative pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Sincronizar com Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione os lembretes de viatura que deseja exportar e sincronizar automaticamente no seu Google Calendar.
          </p>

          {syncedSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-semibold text-foreground">Sincronização Concluída!</p>
              <p className="text-xs text-muted-foreground">Os eventos foram adicionados ao seu calendário.</p>
            </div>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
                {tasks.length === 0 ? (
                  <p className="text-xs text-center p-4 text-muted-foreground">Sem tarefas para sincronizar.</p>
                ) : (
                  tasks.map(task => {
                    const isSelected = selectedTaskIds.includes(task.id);

                    return (
                      <div 
                        key={task.id}
                        onClick={() => toggleTaskSelection(task.id)}
                        className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer border text-xs transition-colors ${
                          isSelected ? 'bg-primary/5 border-primary/40' : 'bg-background border-border hover:bg-muted/50'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{task.title}</p>
                          <p className="text-muted-foreground">{getVehicleName(task.vehicleId)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-muted-foreground">
                            {new Date(task.dueDate).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button 
                  onClick={handleSync} 
                  disabled={isSyncing || selectedTaskIds.length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      A sincronizar...
                    </>
                  ) : (
                    'Sincronizar Agora'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
