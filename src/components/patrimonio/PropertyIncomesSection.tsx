import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { PropertyIncome, Asset } from './types';
import { 
  Plus, Trash2, Home, TrendingUp, AlertCircle, CheckCircle2, 
  Euro, ArrowDownRight, Calendar, Clock, Receipt,
  X, Pencil, Wallet
} from 'lucide-react';
import { usePrivacy } from '../../contexts';
import { format, isBefore, addDays, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

import { PaymentMethodSelector } from '../financas/PaymentMethodSelector';

interface PropertyIncomesSectionProps {
  asset: Asset;
  incomes: PropertyIncome[];
  onAddIncome: (income: PropertyIncome) => void;
  onUpdateIncome: (income: PropertyIncome) => void;
  onDeleteIncome: (income: PropertyIncome) => void;
}

const DEFAULT_PROPERTY_CATEGORIES = [
  'Renda Mensal',
  'Alojamento Local',
  'Venda de Imóvel',
  'Subvenção / Apoio',
  'Outro'
];

const DEFAULT_FINANCIAL_CATEGORIES = [
  'Dividendos',
  'Juros / Cupons',
  'Mais-valias',
  'Prémio de Opções',
  'Outro'
];

export function PropertyIncomesSection({
  asset,
  incomes,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome
}: PropertyIncomesSectionProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [isAdding, setIsAdding] = useState(false);
  const [editingIncome, setEditingIncome] = useState<PropertyIncome | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<PropertyIncome['frequency']>('mensal');
  const [category, setCategory] = useState<string>('Renda Mensal');
  const [dayOfMonth, setDayOfMonth] = useState<string>('1');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [linkToFixedIncome, setLinkToFixedIncome] = useState(true);
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferência Bancária');

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  React.useEffect(() => {
    const storageKey = asset.category === 'imovel' ? 'property_income_custom_categories' : 'financial_income_custom_categories';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom income categories', e);
      }
    }
  }, [asset.category]);

  const isProperty = asset.category === 'imovel';
  const defaultCategories = isProperty ? DEFAULT_PROPERTY_CATEGORIES : DEFAULT_FINANCIAL_CATEGORIES;
  const allCategories = Array.from(new Set([...defaultCategories, ...customCategories]));

  const handleAddCustomCategory = () => {
    if (!newCustomCategory.trim()) return;
    const cat = newCustomCategory.trim();
    if (!customCategories.includes(cat)) {
      const updated = [...customCategories, cat];
      setCustomCategories(updated);
      const storageKey = isProperty ? 'property_income_custom_categories' : 'financial_income_custom_categories';
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
    setCategory(cat);
    setNewCustomCategory('');
    setIsAddingCustom(false);
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

  const propertyIncomes = incomes.filter(i => i.assetId === asset.id);

  const monthlyTotal = propertyIncomes.reduce((sum, i) => {
    if (i.frequency === 'pontual') return sum;
    return sum + (
      i.frequency === 'mensal' ? i.amount : 
      i.frequency === 'trimestral' ? i.amount / 3 :
      i.frequency === 'semestral' ? i.amount / 6 :
      i.amount / 12
    );
  }, 0);

  const annualTotal = propertyIncomes.reduce((sum, i) => {
    const amount = i.amount;
    if (i.frequency === 'pontual') return sum + amount;
    return sum + (
      i.frequency === 'mensal' ? amount * 12 : 
      i.frequency === 'trimestral' ? amount * 4 :
      i.frequency === 'semestral' ? amount * 2 :
      amount
    );
  }, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const val = parseFloat(amount) || 0;
    const dayVal = parseInt(dayOfMonth) || 1;
    
    if (editingIncome) {
      const updatedInc: PropertyIncome = {
        ...editingIncome,
        title: title.trim(),
        amount: val,
        frequency,
        category,
        dayOfMonth: frequency !== 'pontual' ? dayVal : undefined,
        dueDate: frequency === 'pontual' ? (dueDate || undefined) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
        observations: observations.trim() || undefined,
        paymentMethod
      };
      onUpdateIncome(updatedInc);
    } else {
      const newInc: PropertyIncome = {
        id: Date.now().toString(),
        assetId: asset.id,
        title: title.trim(),
        amount: val,
        frequency,
        category,
        dayOfMonth: frequency !== 'pontual' ? dayVal : undefined,
        dueDate: frequency === 'pontual' ? (dueDate || undefined) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        fixedIncomeId: (linkToFixedIncome && frequency !== 'pontual') ? `fx_inc_${Date.now()}` : undefined,
        transactionId: (frequency === 'pontual') ? `tr_inc_${Date.now()}` : undefined,
        notes: notes.trim() || undefined,
        observations: observations.trim() || undefined,
        paymentMethod
      };
      onAddIncome(newInc);
    }

    handleCancel();
  };

  const handleEditClick = (inc: PropertyIncome) => {
    setEditingIncome(inc);
    setTitle(inc.title);
    setAmount(inc.amount.toString());
    setFrequency(inc.frequency);
    setCategory(inc.category);
    setDayOfMonth(inc.dayOfMonth?.toString() || '1');
    setDueDate(inc.dueDate || '');
    setStartDate(inc.startDate || '');
    setEndDate(inc.endDate || '');
    setNotes(inc.notes || '');
    setObservations(inc.observations || '');
    setPaymentMethod(inc.paymentMethod || 'Transferência Bancária');
    setLinkToFixedIncome(!!inc.fixedIncomeId);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setTitle('');
    setAmount('');
    setFrequency('mensal');
    setCategory('Renda Mensal');
    setDayOfMonth('1');
    setDueDate('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setObservations('');
    setPaymentMethod('Transferência Bancária');
    setEditingIncome(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                {isProperty ? 'Rendimentos e Receitas do Imóvel' : 'Dividendos e Proventos de Investimento'}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                {isProperty 
                  ? `Gestão de rendas, vendas e outros proveitos financeiros de `
                  : `Gestão de dividendos, juros e mais-valias de `}
                <span className="text-foreground font-bold">{asset.name}</span>
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border-none shadow-sm bg-emerald-500/5 dark:bg-emerald-500/10 p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 opacity-80">Rendimento Mensal Estimado</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {maskValue(monthlyTotal, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-emerald-500/5 dark:bg-emerald-500/10 p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 opacity-80">Rendimento Anual Estimado</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {maskValue(annualTotal, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {isProperty ? 'Rendas, Vendas e Proveitos' : 'Dividendos e Mais-valias'}
        </h4>
        <Button 
          onClick={() => {
            if (isAdding) handleCancel();
            else {
              setIsAdding(true);
              setCategory(defaultCategories[0]);
            }
          }} 
          size="sm"
          className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 gap-2"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancelar' : 'Novo Rendimento'}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-none shadow-sm bg-muted/30 rounded-3xl overflow-hidden mb-6">
              <CardContent className="p-6">
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição do Rendimento</Label>
                      <Input 
                        placeholder="Ex: Renda Mensal, Venda Garagem..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-11 pl-10 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</Label>
                      {!isAddingCustom ? (
                        <Select value={category} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/40">
                            {allCategories.map(cat => (
                              <SelectItem key={cat} value={cat} className="text-xs font-bold rounded-lg">{cat}</SelectItem>
                            ))}
                            <SelectItem value="new_custom" className="text-xs font-black text-primary uppercase tracking-widest">+ Personalizar</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Nova categoria" 
                            value={newCustomCategory}
                            onChange={(e) => setNewCustomCategory(e.target.value)}
                            autoFocus
                            className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddCustomCategory} 
                            size="icon" 
                            className="h-11 w-11 shrink-0 rounded-xl bg-primary/20 text-primary hover:bg-primary/30"
                            disabled={!newCustomCategory.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsAddingCustom(false)}
                            className="h-11 w-11 shrink-0 rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Periodicidade</Label>
                      <Select value={frequency} onValueChange={(v) => setFrequency(v as 'mensal' | 'anual' | 'pontual')}>
                        <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40">
                          <SelectItem value="mensal" className="text-xs font-bold rounded-lg">Mensal</SelectItem>
                          <SelectItem value="trimestral" className="text-xs font-bold rounded-lg">Trimestral</SelectItem>
                          <SelectItem value="semestral" className="text-xs font-bold rounded-lg">Semestral</SelectItem>
                          <SelectItem value="anual" className="text-xs font-bold rounded-lg">Anual</SelectItem>
                          <SelectItem value="pontual" className="text-xs font-bold rounded-lg">Pontual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Método de Recebimento</Label>
                      <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} className="h-11 rounded-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        {frequency === 'pontual' ? 'Data de Recebimento' : 'Dia Previsto do Mês'}
                      </Label>
                      {frequency === 'pontual' ? (
                        <Input 
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold"
                          required
                        />
                      ) : (
                        <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                          <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold">
                            <SelectValue placeholder="Selecione o dia" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/40">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <SelectItem key={day} value={day.toString()} className="text-xs font-bold rounded-lg">
                                Dia {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {frequency !== 'pontual' && (
                      <div className="space-y-2 flex flex-col justify-end">
                        <div className="flex items-center justify-between p-3 h-11 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Vincular a Receitas Fixas</Label>
                          <Switch 
                            checked={linkToFixedIncome} 
                            onCheckedChange={setLinkToFixedIncome} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-[2] space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações</Label>
                      <Input 
                        placeholder="Observações específicas para o rendimento..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 text-xs font-medium"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notas do Sistema</Label>
                      <Input 
                        placeholder="Notas adicionais..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 text-xs"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <Button type="submit" className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20">
                        {editingIncome ? 'Atualizar Rendimento' : 'Registar Rendimento'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Incomes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {propertyIncomes.length === 0 ? (
          <div className="col-span-full p-12 bg-muted/20 border border-dashed border-border/60 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sem rendimentos registados</p>
            <p className="text-xs text-muted-foreground mt-1">Utilize o botão acima para registar rendas mensais ou proveitos de vendas.</p>
          </div>
        ) : (
          propertyIncomes.map((inc) => (
            <motion.div
              key={inc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="group border-none shadow-sm bg-card/50 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${
                    inc.category === 'Renda Mensal' ? 'bg-emerald-500/10 text-emerald-600' :
                    inc.category === 'Venda de Imóvel' ? 'bg-primary/10 text-primary' :
                    'bg-slate-500/10 text-slate-600'
                  }`}>
                    {inc.category === 'Renda Mensal' && <Wallet className="w-5 h-5" />}
                    {inc.category === 'Venda de Imóvel' && <TrendingUp className="w-5 h-5" />}
                    {(inc.category === 'Alojamento Local' || inc.category === 'Outro') && <Clock className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {inc.category} • {inc.frequency === 'pontual' ? 'PONTUAL' : inc.frequency}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(inc)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDeleteIncome(inc)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline justify-between gap-4">
                      <h5 className="text-base font-black tracking-tight truncate">{inc.title}</h5>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                        {maskValue(inc.amount, formatter.format)}
                      </span>
                    </div>

                    {inc.observations && (
                      <p className="text-[11px] text-muted-foreground font-medium mt-1 mb-2 line-clamp-1 italic">
                        "{inc.observations}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                      {inc.frequency === 'pontual' ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md">
                          Recebimento Único
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          Recorrente • Dia {inc.dayOfMonth}
                        </div>
                      )}
                      {inc.dueDate && inc.frequency === 'pontual' && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          DATA: {format(parseISO(inc.dueDate), 'dd MMM yyyy', { locale: pt })}
                        </div>
                      )}
                      {inc.paymentMethod && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                          <Wallet className="w-3 h-3" />
                          {inc.paymentMethod}
                        </div>
                      )}
                      {inc.fixedIncomeId && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Vinculado a Receitas Fixas
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
