import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Wrench, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';

export type RecurrenceInterval = '12_months' | '24_months' | '6_months' | '1_month' | 'none';

export interface VehicleTask {
  id: string;
  vehicleId: string;
  title: string;
  taskType: string;
  cost: number;
  status: 'pendente' | 'concluída';
  dueDate: string;
  completedDate?: string;
  documentName?: string;
  documentUrl?: string;
  notes?: string;
  isFuelExpense?: boolean;

  // Recurrence & Next cycle fields
  recurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
  nextDueDate?: string;
  nextStatus?: 'pendente' | 'agendada';
  nextCost?: number;
  autoCreateNext?: boolean;
  parentTaskId?: string;
}

interface VehicleTaskFormProps {
  isOpen: boolean;
  vehicleId: string;
  onClose: () => void;
  onSave: (task: VehicleTask) => void;
  initialData?: VehicleTask | null;
}

const DEFAULT_TASK_TYPES = ['Seguro', 'IUC', 'IPO (Inspeção)', 'Revisão Geral', 'Mudança de Óleo', 'Substituição de Pneus', 'Portagens / Scuts', 'Outros'];

export function calculateNextDueDate(baseDateStr: string, interval: RecurrenceInterval = '12_months'): string {
  if (!baseDateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

  switch (interval) {
    case '1_month':
      d.setMonth(d.getMonth() + 1);
      break;
    case '6_months':
      d.setMonth(d.getMonth() + 6);
      break;
    case '24_months':
      d.setFullYear(d.getFullYear() + 2);
      break;
    case '12_months':
    default:
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

export function VehicleTaskForm({ isOpen, vehicleId, onClose, onSave, initialData }: VehicleTaskFormProps) {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('Revisão Geral');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<'pendente' | 'concluída'>('pendente');
  const [dueDate, setDueDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [notes, setNotes] = useState('');

  // Recurrence & Next cycle state
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>('12_months');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextStatus, setNextStatus] = useState<'pendente' | 'agendada'>('pendente');
  const [nextCost, setNextCost] = useState('');
  const [autoCreateNext, setAutoCreateNext] = useState(true);

  const [customTaskTypes, setCustomTaskTypes] = useState<string[]>([]);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newCustomType, setNewCustomType] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('vehicle_custom_task_types');
    if (saved) {
      try {
        setCustomTaskTypes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom task types', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setTaskType(initialData.taskType || 'Revisão Geral');
      setCost(initialData.cost ? initialData.cost.toString() : '');
      setStatus(initialData.status || 'pendente');
      setDueDate(initialData.dueDate || '');
      setCompletedDate(initialData.completedDate || '');
      setDocumentName(initialData.documentName || '');
      setNotes(initialData.notes || '');

      const interval = initialData.recurrenceInterval || (initialData.recurring ? '12_months' : 'none');
      setRecurrenceInterval(interval);
      setNextDueDate(initialData.nextDueDate || calculateNextDueDate(initialData.completedDate || initialData.dueDate || new Date().toISOString().split('T')[0], interval));
      setNextStatus(initialData.nextStatus || 'pendente');
      setNextCost(initialData.nextCost !== undefined ? initialData.nextCost.toString() : (initialData.cost ? initialData.cost.toString() : ''));
      setAutoCreateNext(initialData.autoCreateNext !== undefined ? initialData.autoCreateNext : true);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setTitle('');
      setTaskType('Revisão Geral');
      setCost('');
      setStatus('pendente');
      setDueDate(todayStr);
      setCompletedDate('');
      setDocumentName('');
      setNotes('');

      setRecurrenceInterval('12_months');
      setNextDueDate(calculateNextDueDate(todayStr, '12_months'));
      setNextStatus('pendente');
      setNextCost('');
      setAutoCreateNext(true);
    }
  }, [initialData, isOpen]);

  // Recalculate nextDueDate automatically when dueDate or recurrenceInterval or completedDate changes
  useEffect(() => {
    if (recurrenceInterval !== 'none') {
      const base = completedDate || dueDate || new Date().toISOString().split('T')[0];
      const calculated = calculateNextDueDate(base, recurrenceInterval);
      setNextDueDate(prev => {
        if (!prev || initialData?.dueDate !== dueDate) return calculated;
        return prev;
      });
    }
  }, [dueDate, completedDate, recurrenceInterval]);

  if (!isOpen) return null;

  const allTaskTypes = [...DEFAULT_TASK_TYPES, ...customTaskTypes];

  const handleTaskTypeChange = (val: string) => {
    if (val === 'new_custom_task_type') {
      setIsAddingCustomType(true);
      setTaskType('');
    } else {
      setIsAddingCustomType(false);
      setTaskType(val);
      if (!title || DEFAULT_TASK_TYPES.includes(title)) {
        setTitle(val);
      }
    }
  };

  const handleAddCustomType = () => {
    if (newCustomType.trim() && !allTaskTypes.includes(newCustomType.trim())) {
      const updated = [...customTaskTypes, newCustomType.trim()];
      setCustomTaskTypes(updated);
      localStorage.setItem('vehicle_custom_task_types', JSON.stringify(updated));
      setTaskType(newCustomType.trim());
      setTitle(newCustomType.trim());
      setNewCustomType('');
      setIsAddingCustomType(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskCost = parseFloat(cost) || 0;
    const isRecurring = recurrenceInterval !== 'none';
    const computedNextDueDate = isRecurring 
      ? (nextDueDate || calculateNextDueDate(completedDate || dueDate, recurrenceInterval))
      : undefined;

    const taskObj: VehicleTask = {
      id: initialData ? initialData.id : Date.now().toString(),
      vehicleId,
      title: title.trim() || taskType,
      taskType,
      cost: taskCost,
      status,
      dueDate,
      completedDate: status === 'concluída' ? (completedDate || new Date().toISOString().split('T')[0]) : undefined,
      documentName: documentName.trim() || undefined,
      notes: notes.trim(),
      recurring: isRecurring,
      recurrenceInterval,
      nextDueDate: computedNextDueDate,
      nextStatus: isRecurring ? nextStatus : undefined,
      nextCost: isRecurring ? (parseFloat(nextCost) || taskCost) : undefined,
      autoCreateNext: isRecurring ? autoCreateNext : false,
      parentTaskId: initialData?.parentTaskId
    };

    onSave(taskObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-xl border-border my-8">
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
            <Wrench className="w-5 h-5 text-primary" />
            {initialData ? 'Editar Tarefa / Manutenção' : 'Nova Tarefa de Viatura'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskType">Tipo de Tarefa <span className="text-destructive">*</span></Label>
                {!isAddingCustomType ? (
                  <Select value={taskType} onValueChange={handleTaskTypeChange} required>
                    <SelectTrigger id="taskType">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allTaskTypes.map(tt => (
                        <SelectItem key={tt} value={tt}>{tt}</SelectItem>
                      ))}
                      <SelectItem value="new_custom_task_type">+ Tipo Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Novo tipo de tarefa" 
                      value={newCustomType}
                      onChange={(e) => setNewCustomType(e.target.value)}
                      autoFocus
                    />
                    <Button type="button" onClick={handleAddCustomType} size="icon" className="shrink-0" disabled={!newCustomType.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddingCustomType(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título Personalizado</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: IUC 2026, Revisão 120.000km"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Custo Previsto/Real (€)</Label>
                <Input 
                  id="cost" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data Limite / Vencimento <span className="text-destructive">*</span></Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Recurrence Selection */}
            <div className="space-y-2">
              <Label htmlFor="recurrenceInterval">Periodicidade / Recorrência</Label>
              <Select value={recurrenceInterval} onValueChange={(val: RecurrenceInterval) => setRecurrenceInterval(val)}>
                <SelectTrigger id="recurrenceInterval">
                  <SelectValue placeholder="Selecione a frequência..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12_months">Anual (Cada 12 meses - Ex: IUC, IPO, Seguro)</SelectItem>
                  <SelectItem value="24_months">Bi-Anual (Cada 24 meses - Inspeção carro novo)</SelectItem>
                  <SelectItem value="6_months">Semestral (Cada 6 meses)</SelectItem>
                  <SelectItem value="1_month">Mensal (Cada 1 mês)</SelectItem>
                  <SelectItem value="none">Pontual / Sem Recorrência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dedicated Next Cycle Box */}
            {recurrenceInterval !== 'none' && (
              <div className="space-y-3 p-3.5 border border-indigo-500/30 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4" /> Próxima Ocorrência / Ciclo Futuro
                  </div>
                  <span className="text-[11px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded border border-border">
                    {recurrenceInterval === '12_months' && '+1 Ano'}
                    {recurrenceInterval === '24_months' && '+2 Anos'}
                    {recurrenceInterval === '6_months' && '+6 Meses'}
                    {recurrenceInterval === '1_month' && '+1 Mês'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nextDueDate" className="text-xs">Data de Vencimento Seguinte</Label>
                    <Input 
                      id="nextDueDate" 
                      type="date" 
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      className="bg-background text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nextStatus" className="text-xs">Estado Próxima Tarefa</Label>
                    <Select value={nextStatus} onValueChange={(val: 'pendente' | 'agendada') => setNextStatus(val)}>
                      <SelectTrigger id="nextStatus" className="bg-background text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="agendada">Agendada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nextCost" className="text-xs">Custo Estimado Próximo Ciclo (€)</Label>
                    <Input 
                      id="nextCost" 
                      type="number" 
                      step="0.01" 
                      placeholder={cost || "0.00"}
                      value={nextCost}
                      onChange={(e) => setNextCost(e.target.value)}
                      className="bg-background text-xs h-9"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Label htmlFor="autoCreateNext" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                      Gerar automaticamente ao concluir
                    </Label>
                    <Switch 
                      id="autoCreateNext"
                      checked={autoCreateNext}
                      onCheckedChange={setAutoCreateNext}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/30">
              <div className="space-y-0.5">
                <Label className="text-sm">Estado da Tarefa Atual</Label>
                <p className="text-xs text-muted-foreground">Marcar esta ocorrência como concluída</p>
              </div>
              <Switch 
                checked={status === 'concluída'} 
                onCheckedChange={(chk) => setStatus(chk ? 'concluída' : 'pendente')} 
              />
            </div>

            {status === 'concluída' && (
              <div className="space-y-2 animate-in fade-in">
                <Label htmlFor="completedDate">Data de Conclusão</Label>
                <Input 
                  id="completedDate" 
                  type="date" 
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="documentName">Fatura / Documento (Nome ou Anexo)</Label>
              <Input 
                id="documentName" 
                placeholder="Ex: Fatura_Norauto_1234.pdf"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas / Detalhes</Label>
              <Input 
                id="notes" 
                placeholder="Oficina, garantia ou observações..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">
                {initialData ? 'Atualizar Tarefa' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
