import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { PropertyExpense, Asset } from './types';
import { Plus, Trash2, Home, Shield, AlertCircle, CheckCircle2, DollarSign, ArrowUpRight } from 'lucide-react';
import { usePrivacy } from '../../contexts';

interface PropertyExpensesSectionProps {
  asset: Asset;
  expenses: PropertyExpense[];
  onAddExpense: (expense: PropertyExpense) => void;
  onDeleteExpense: (expense: PropertyExpense) => void;
}

const EXPENSE_CATEGORIES: PropertyExpense['category'][] = [
  'Condomínio',
  'IMI',
  'Seguro Multirriscos',
  'Manutenção',
  'Outro'
];

export function PropertyExpensesSection({
  asset,
  expenses,
  onAddExpense,
  onDeleteExpense
}: PropertyExpensesSectionProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'mensal' | 'anual'>('mensal');
  const [category, setCategory] = useState<PropertyExpense['category']>('Condomínio');
  const [dueDate, setDueDate] = useState('');
  const [linkToFixedExpense, setLinkToFixedExpense] = useState(true);
  const [notes, setNotes] = useState('');

  const propertyExpenses = expenses.filter(e => e.assetId === asset.id);

  // Calculate total monthly and annual costs
  const monthlyTotal = propertyExpenses.reduce((sum, e) => {
    return sum + (e.frequency === 'mensal' ? e.amount : e.amount / 12);
  }, 0);

  const annualTotal = monthlyTotal * 12;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const val = parseFloat(amount) || 0;
    const newExp: PropertyExpense = {
      id: Date.now().toString(),
      assetId: asset.id,
      title: title.trim(),
      amount: val,
      frequency,
      category,
      dueDate: dueDate || undefined,
      fixedExpenseId: linkToFixedExpense ? `fx_${Date.now()}` : undefined,
      notes: notes.trim() || undefined
    };

    onAddExpense(newExp);

    // Reset form
    setTitle('');
    setAmount('');
    setFrequency('mensal');
    setCategory('Condomínio');
    setDueDate('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pt-4 border-t border-border">
      {/* Header & Totals */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Despesas Associadas do Imóvel
          </h3>
          <p className="text-xs text-muted-foreground">
            Gestão de condomínio, IMI, seguros e manutenção associados a <strong className="text-foreground">{asset.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Custo Estimado</span>
            <span className="text-base font-bold text-destructive">
              {maskValue(monthlyTotal, formatter.format)}/mês
            </span>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Nova Despesa
          </Button>
        </div>
      </div>

      {/* Inline Form to Add Expense */}
      {isAdding && (
        <Card className="border-primary/30 bg-primary/5 animate-in fade-in">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <h4 className="font-semibold text-sm">Adicionar Despesa de Imóvel</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="expTitle" className="text-xs">Título / Descrição *</Label>
                  <Input 
                    id="expTitle"
                    placeholder="Ex: Condomínio Mensal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="expAmount" className="text-xs">Valor (€) *</Label>
                  <Input 
                    id="expAmount"
                    type="number"
                    step="0.01"
                    placeholder="65.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="expCategory" className="text-xs">Categoria *</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as PropertyExpense['category'])}>
                    <SelectTrigger id="expCategory">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="expFreq" className="text-xs">Frequência *</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as 'mensal' | 'anual')}>
                    <SelectTrigger id="expFreq">
                      <SelectValue placeholder="Frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="expDueDate" className="text-xs">Data limite / Vencimento</Label>
                  <Input 
                    id="expDueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/60">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Vincular às Despesas Fixas Globais</Label>
                  <p className="text-[11px] text-muted-foreground">Adiciona automaticamente esta obrigação à lista de Despesas Fixas (via asset_id)</p>
                </div>
                <Switch 
                  checked={linkToFixedExpense} 
                  onCheckedChange={setLinkToFixedExpense} 
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Input 
                  placeholder="Notas adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="max-w-xs text-xs"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
                  <Button type="submit" size="sm">Salvar Despesa</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List of Property Expenses */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/60 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3.5 pl-5">Despesa</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Periodicidade</th>
                <th className="p-3.5 text-right">Valor</th>
                <th className="p-3.5">Ligado a Despesas Fixas</th>
                <th className="p-3.5 text-center pr-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {propertyExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Sem despesas registadas para este imóvel. Clique em "+ Nova Despesa" para adicionar (condomínio, IMI, seguros).
                  </td>
                </tr>
              ) : (
                propertyExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3.5 pl-5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-secondary text-primary">
                          {exp.category === 'Condomínio' && <Home className="w-4 h-4" />}
                          {exp.category === 'Seguro Multirriscos' && <Shield className="w-4 h-4" />}
                          {exp.category !== 'Condomínio' && exp.category !== 'Seguro Multirriscos' && <DollarSign className="w-4 h-4" />}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{exp.title}</p>
                          {exp.notes && <p className="text-xs text-muted-foreground">{exp.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-secondary text-xs rounded-md font-medium text-foreground">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground capitalize">{exp.frequency}</td>
                    <td className="p-3.5 text-right font-bold text-destructive">
                      {maskValue(exp.amount, formatter.format)}
                    </td>
                    <td className="p-3.5">
                      {exp.fixedExpenseId ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ligado (asset_id: {asset.id})
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não vinculado</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteExpense(exp)}
                        title="Eliminar Despesa de Imóvel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
