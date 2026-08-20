import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useFixedIncomes } from '../../hooks/queries';
import { PaymentMethodSelector } from '../financas/PaymentMethodSelector';

export interface FixedIncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSave?: (income: any) => void;
}

const DEFAULT_CATEGORIES = ['Ordenado', 'Rendas', 'Dividendos', 'Reembolso', 'Prémio/Bónus', 'Prestação de Serviços', 'Outros'];

export function FixedIncomeForm({ isOpen, onClose, initialData, onSave }: FixedIncomeFormProps) {
  const { addFixedIncome, updateFixedIncome } = useFixedIncomes();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('Mensal');
  const [category, setCategory] = useState('Ordenado');
  const [entity, setEntity] = useState('');
  const [method, setMethod] = useState('Transferência Bancária');
  const [dueDateDay, setDueDateDay] = useState('1');
  const [exactDate, setExactDate] = useState('');
  const [alertDays, setAlertDays] = useState('3');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('fixed_income_custom_categories');
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom categories', e);
      }
    }
  }, []);

  // Populate or reset form whenever isOpen or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || initialData.description || '');
        setAmount(initialData.amount !== undefined && initialData.amount !== null ? String(initialData.amount) : '');
        setFrequency(initialData.frequency || 'Mensal');
        setCategory(initialData.category || 'Ordenado');
        setEntity(initialData.entity || '');
        setMethod(initialData.method || 'Transferência Bancária');
        setDueDateDay(
          initialData.dueDateDay !== undefined && initialData.dueDateDay !== null
            ? String(initialData.dueDateDay)
            : initialData.dueDay !== undefined && initialData.dueDay !== null
            ? String(initialData.dueDay)
            : '1'
        );
        setExactDate(initialData.exactDate || '');
        setAlertDays(initialData.alertDays !== undefined && initialData.alertDays !== null ? String(initialData.alertDays) : '3');
        setActive(initialData.active !== undefined ? initialData.active : true);
        setNotes(initialData.notes || '');
      } else {
        setName('');
        setAmount('');
        setFrequency('Mensal');
        setCategory('Ordenado');
        setEntity('');
        setMethod('Transferência Bancária');
        setDueDateDay('1');
        setExactDate('');
        setAlertDays('3');
        setActive(true);
        setNotes('');
      }
      setIsSubmitting(false);
      setIsAddingCustom(false);
      setNewCustomCategory('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));

  const handleCategoryChange = (val: string) => {
    if (val === 'new_custom') {
      setIsAddingCustom(true);
      setCategory('');
    } else {
      setIsAddingCustom(false);
      setCategory(val);
    }
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCustomCategory.trim();
    if (trimmed && !allCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      localStorage.setItem('fixed_income_custom_categories', JSON.stringify(updated));
      setCategory(trimmed);
      setNewCustomCategory('');
      setIsAddingCustom(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        description: name, // For backwards compatibility with widgets that might read description
        amount: parseFloat(amount) || 0,
        frequency,
        category,
        entity,
        method,
        dueDateDay: frequency === 'Mensal' ? parseInt(dueDateDay) || 1 : null,
        dueDay: frequency === 'Mensal' ? parseInt(dueDateDay) || 1 : null,
        exactDate: frequency !== 'Mensal' ? exactDate : null,
        alertDays: parseInt(alertDays) || 3,
        active,
        notes
      };

      let result;
      if (initialData?.id) {
        result = await updateFixedIncome({ ...initialData, ...payload });
      } else {
        result = await addFixedIncome(payload);
      }

      if (onSave) {
        onSave(result || payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save fixed income', error);
    } finally {
      setIsSubmitting(false);
    }
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
          <CardTitle className="text-xl">
            {initialData ? 'Editar Receita Fixa' : 'Nova Receita Fixa'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Receita <span className="text-destructive">*</span></Label>
              <Input 
                id="name" 
                placeholder="Ex: Ordenado Empresa X"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Periodicidade</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria <span className="text-destructive">*</span></Label>
                {!isAddingCustom ? (
                  <Select value={category} onValueChange={handleCategoryChange} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="new_custom">+ Adicionar Personalizada...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nova categoria" 
                      value={newCustomCategory}
                      onChange={(e) => setNewCustomCategory(e.target.value)}
                      autoFocus
                    />
                    <Button type="button" onClick={handleAddCustomCategory} size="icon" className="shrink-0" disabled={!newCustomCategory.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddingCustom(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Método Pagamento</Label>
                <PaymentMethodSelector value={method} onChange={setMethod} id="method" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity">Entidade / Pagador</Label>
              <Input 
                id="entity" 
                placeholder="Ex: Empresa / Inquilino X"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              />
            </div>

            <div className="bg-secondary/30 border border-border rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold mb-2">Previsão e Alertas</h4>
              
              {frequency === 'Mensal' ? (
                <div className="space-y-2">
                  <Label htmlFor="dueDateDay">Dia do Mês Previsto <span className="text-destructive">*</span></Label>
                  <Input 
                    id="dueDateDay" 
                    type="number" 
                    min="1" 
                    max="31"
                    placeholder="Ex: 28"
                    value={dueDateDay}
                    onChange={(e) => setDueDateDay(e.target.value)}
                    required={frequency === 'Mensal'}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="exactDate">Data Prevista <span className="text-destructive">*</span></Label>
                  <Input 
                    id="exactDate" 
                    type="date" 
                    value={exactDate}
                    onChange={(e) => setExactDate(e.target.value)}
                    required={frequency !== 'Mensal'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="alertDays">Alertar quantos dias antes?</Label>
                <Select value={alertDays} onValueChange={setAlertDays}>
                  <SelectTrigger id="alertDays">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No próprio dia</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                    <SelectItem value="14">14 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/30">
              <div className="space-y-0.5">
                <Label className="text-sm">Receita Ativa</Label>
                <p className="text-xs text-muted-foreground">Incluir nas projeções mensais</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Input 
                id="notes" 
                placeholder="Observações adicionais"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? 'A guardar...' : (initialData ? 'Guardar Alterações' : 'Guardar Receita Fixa')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
