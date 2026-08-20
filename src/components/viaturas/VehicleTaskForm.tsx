import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';

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
}

interface VehicleTaskFormProps {
  isOpen: boolean;
  vehicleId: string;
  onClose: () => void;
  onSave: (task: VehicleTask) => void;
  initialData?: VehicleTask | null;
}

const DEFAULT_TASK_TYPES = ['Seguro', 'IUC', 'IPO (Inspeção)', 'Revisão Geral', 'Mudança de Óleo', 'Substituição de Pneus', 'Portagens / Scuts', 'Outros'];

export function VehicleTaskForm({ isOpen, vehicleId, onClose, onSave, initialData }: VehicleTaskFormProps) {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('Revisão Geral');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<'pendente' | 'concluída'>('pendente');
  const [dueDate, setDueDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [notes, setNotes] = useState('');

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
    } else {
      setTitle('');
      setTaskType('Revisão Geral');
      setCost('');
      setStatus('pendente');
      setDueDate(new Date().toISOString().split('T')[0]);
      setCompletedDate('');
      setDocumentName('');
      setNotes('');
    }
  }, [initialData, isOpen]);

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
    const taskObj: VehicleTask = {
      id: initialData ? initialData.id : Date.now().toString(),
      vehicleId,
      title: title.trim() || taskType,
      taskType,
      cost: parseFloat(cost) || 0,
      status,
      dueDate,
      completedDate: status === 'concluída' ? (completedDate || new Date().toISOString().split('T')[0]) : undefined,
      documentName: documentName.trim() || undefined,
      notes: notes.trim()
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
                  placeholder="Ex: Mudança filtro óleo"
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

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/30">
              <div className="space-y-0.5">
                <Label className="text-sm">Estado da Tarefa</Label>
                <p className="text-xs text-muted-foreground">Marcar como concluída</p>
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
