import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export const BUDGET_CATEGORIES = [
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
  const [category, setCategory] = useState(BUDGET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(currentMonth);

  useEffect(() => {
    if (initialData) {
      if (BUDGET_CATEGORIES.includes(initialData.category)) {
        setCategory(initialData.category);
        setCustomCategory('');
      } else {
        setCategory('Outros');
        setCustomCategory(initialData.category || '');
      }
      setLimit(initialData.limit ? initialData.limit.toString() : '');
      setMonth(initialData.month || currentMonth);
    } else {
      setCategory(BUDGET_CATEGORIES[0]);
      setCustomCategory('');
      setLimit('');
      setMonth(currentMonth);
    }
  }, [initialData, currentMonth, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'Outros' && customCategory.trim() ? customCategory.trim() : category;
    const numericLimit = parseFloat(limit);
    if (isNaN(numericLimit) || numericLimit <= 0) return;

    onSubmit({
      id: initialData?.id,
      category: finalCategory,
      limit: numericLimit,
      month
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
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {BUDGET_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {category === 'Outros' && (
          <div className="space-y-2">
            <Label htmlFor="customCategory">Nome da Categoria Personalizada</Label>
            <Input
              id="customCategory"
              placeholder="Ex: Assinaturas, Animais..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          </div>
        )}

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

        <div className="space-y-2">
          <Label htmlFor="month">Mês de Aplicação</Label>
          <Input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Ano e mês aos quais se aplica este orçamento.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{initialData ? 'Guardar Alterações' : 'Criar Orçamento'}</Button>
        </div>
      </form>
    </Modal>
  );
}
