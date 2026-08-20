import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Wand2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { getSuggestedCategory } from './AutoCategorization';
import { useIncomes } from '../../hooks/queries';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface IncomeFormProps {
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = ['Salário', 'Rendimentos Prediais', 'Reembolso', 'Prémio/Bónus'];

export function IncomeForm({ isOpen, onClose, initialData }: IncomeFormProps) {

  const { addIncome, updateIncome } = useIncomes();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [entity, setEntity] = useState('');
  const [method, setMethod] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  // Reset or populate form when opened
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setCategory(initialData.category || '');
        setEntity(initialData.entity || '');
        setMethod(initialData.method || '');
        setRecurring(initialData.recurring || false);
        setNotes(initialData.notes || '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setCategory('');
        setEntity('');
        setMethod('');
        setRecurring(false);
        setNotes('');
      }
      setIsSubmitting(false);
      setSuggestedCategory(null);
      setIsAddingCustom(false);
      setNewCustomCategory('');
    }
  }, [isOpen, initialData]);


  useEffect(() => {
    const saved = localStorage.getItem('income_custom_categories');
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  }, []);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  // Auto-categorization effect
  useEffect(() => {
    const textToAnalyze = `${entity} ${notes}`.trim();
    if (textToAnalyze.length > 2) {
      const suggestion = getSuggestedCategory(textToAnalyze);
      if (suggestion && suggestion !== category) {
        setSuggestedCategory(suggestion);
      } else {
        setSuggestedCategory(null);
      }
    } else {
      setSuggestedCategory(null);
    }
  }, [entity, notes, category]);

  const applySuggestion = () => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setSuggestedCategory(null);
      setIsAddingCustom(false);
    }
  };

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
    if (newCustomCategory.trim() && !allCategories.includes(newCustomCategory.trim())) {
      const updated = [...customCategories, newCustomCategory.trim()];
      setCustomCategories(updated);
      localStorage.setItem('income_custom_categories', JSON.stringify(updated));
      setCategory(newCustomCategory.trim());
      setNewCustomCategory('');
      setIsAddingCustom(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        date,
        amount: parseFloat(amount),
        category,
        entity,
        method,
        recurring,
        isFixed: recurring,
        notes
      };
      if (initialData) {
        await updateIncome({ ...initialData, ...payload });
      } else {
        await addIncome(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to add income', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-lg border-border my-8">
        <CardHeader className="relative pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl">Adicionar Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data <span className="text-destructive">*</span></Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required 
                />
              </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity">Entidade / Remetente <span className="text-destructive">*</span></Label>
              <Input 
                id="entity" 
                placeholder="Ex: Empresa XPTO..."
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                required
              />
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
                {suggestedCategory && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-primary animate-in fade-in slide-in-from-top-1">
                    <Wand2 className="w-3 h-3" />
                    <span>Sugestão: <strong>{suggestedCategory}</strong></span>
                    <button type="button" onClick={applySuggestion} className="underline hover:text-primary/80 font-medium ml-1">Aplicar</button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Método de Pagamento</Label>
                <PaymentMethodSelector value={method} onChange={setMethod} id="method" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/30 mt-2">
              <div className="space-y-0.5">
                <Label className="text-sm">Receita Recorrente</Label>
                <p className="text-xs text-muted-foreground">Repetir automaticamente todos os meses.</p>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionais (Opcional)</Label>
              <Input 
                id="notes" 
                placeholder="Ex: Ref. vencimento base..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {isSubmitting ? 'A guardar...' : (initialData ? 'Guardar Alterações' : 'Guardar Receita')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
