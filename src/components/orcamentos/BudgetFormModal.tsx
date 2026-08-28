import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export const DEFAULT_BUDGET_CATEGORIES = [
  'Alimentação',
  'Habitação',
  'Transportes',
  'Combustível',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros'
];

interface BudgetFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; category: string; limit: number; month?: string }) => void;
  initialData?: any;
  currentMonth: string;
}

export function BudgetFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  currentMonth
}: BudgetFormModalProps) {
  const [category, setCategory] = useState(DEFAULT_BUDGET_CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(currentMonth.split('-')[1] || '01');
  const [year, setYear] = useState(currentMonth.split('-')[0] || new Date().getFullYear().toString());
  const [isRecurring, setIsRecurring] = useState(false);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  const allCategories = [...DEFAULT_BUDGET_CATEGORIES, ...customCategories];

  useEffect(() => {
    const saved = localStorage.getItem('expense_custom_categories');
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  }, []);

  const MONTHS = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const years = Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || DEFAULT_BUDGET_CATEGORIES[0]);
      setLimit(initialData.limit ? initialData.limit.toString() : '');
      if (initialData.month && initialData.month.includes('-')) {
        const [y, m] = initialData.month.split('-');
        setYear(y);
        setMonth(m);
        setIsRecurring(false);
      } else {
        const [y, m] = currentMonth.split('-');
        setYear(y);
        setMonth(m);
        setIsRecurring(!initialData.month);
      }
    } else {
      setCategory(DEFAULT_BUDGET_CATEGORIES[0]);
      setLimit('');
      const [y, m] = currentMonth.split('-');
      setYear(y);
      setMonth(m);
      setIsRecurring(false);
    }
  }, [initialData, currentMonth, open]);

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
      localStorage.setItem('expense_custom_categories', JSON.stringify(updated));
      setCategory(newCustomCategory.trim());
      setNewCustomCategory('');
      setIsAddingCustom(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category;
    const numericLimit = parseFloat(limit);
    if (isNaN(numericLimit) || numericLimit <= 0) return;

    onSubmit({
      id: initialData?.id,
      category: finalCategory,
      limit: numericLimit,
      month: isRecurring ? '' : `${year}-${month}`
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar Orçamento' : 'Novo Teto de Orçamento'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria de Despesa</Label>
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
          <Label htmlFor="limit">Teto Máximo Mensal (€)</Label>
          <Input
            id="limit"
            type="number"
            step="0.01"
            min="1"
            placeholder="Ex: 350.00"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center space-x-2 py-1">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
            Orçamento Recorrente (Aplica-se a todos os meses)
          </Label>
        </div>

        {!isRecurring && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
            <div className="space-y-2">
              <Label htmlFor="month-select">Mês</Label>
              <select
                id="month-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-select">Ano</Label>
              <select
                id="year-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {!isRecurring && (
          <p className="text-[11px] text-muted-foreground -mt-2">
            Ano e mês aos quais se aplica este orçamento.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{initialData ? 'Guardar Alterações' : 'Criar Orçamento'}</Button>
        </div>
      </form>
    </Modal>
  );
}
