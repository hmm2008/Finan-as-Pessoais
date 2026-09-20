import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { PropertyExpense, Asset } from './types';
import { 
  Plus, Trash2, Home, Shield, AlertCircle, CheckCircle2, 
  Euro, ArrowUpRight, Calendar, Clock, Receipt,
  X, Pencil
} from 'lucide-react';
import { usePrivacy } from '../../contexts';
import { format, isBefore, addDays, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

import { PaymentMethodSelector } from '../financas/PaymentMethodSelector';

interface PropertyExpensesSectionProps {
  asset: Asset;
  expenses: PropertyExpense[];
  onAddExpense: (expense: PropertyExpense) => void;
  onUpdateExpense: (expense: PropertyExpense) => void;
  onDeleteExpense: (expense: PropertyExpense) => void;
}

const DEFAULT_EXPENSE_CATEGORIES = [
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
  onUpdateExpense,
  onDeleteExpense
}: PropertyExpensesSectionProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [isAdding, setIsAdding] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PropertyExpense | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<PropertyExpense['frequency']>('mensal');
  const [category, setCategory] = useState<string>('Condomínio');
  const [dayOfMonth, setDayOfMonth] = useState<string>('1');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [linkToFixedExpense, setLinkToFixedExpense] = useState(true);
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Débito Direto');

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  React.useEffect(() => {
    const saved = localStorage.getItem('property_expense_custom_categories');
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom property expense categories', e);
      }
    }
  }, []);

  const allCategories = Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customCategories]));

  const handleAddCustomCategory = () => {
    if (!newCustomCategory.trim()) return;
    const cat = newCustomCategory.trim();
    if (!customCategories.includes(cat)) {
      const updated = [...customCategories, cat];
      setCustomCategories(updated);
      localStorage.setItem('property_expense_custom_categories', JSON.stringify(updated));
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

  const propertyExpenses = expenses.filter(e => e.assetId === asset.id);

  const monthlyTotal = propertyExpenses.reduce((sum, e) => {
    if (e.frequency === 'pontual') return sum;
    return sum + (
      e.frequency === 'mensal' ? e.amount : 
      e.frequency === 'trimestral' ? e.amount / 3 :
      e.frequency === 'semestral' ? e.amount / 6 :
      e.amount / 12
    );
  }, 0);

  const annualTotal = propertyExpenses.reduce((sum, e) => {
    const amount = e.amount;
    if (e.frequency === 'pontual') return sum + amount;
    return sum + (
      e.frequency === 'mensal' ? amount * 12 : 
      e.frequency === 'trimestral' ? amount * 4 :
      e.frequency === 'semestral' ? amount * 2 :
      amount
    );
  }, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const val = parseFloat(amount) || 0;
    const dayVal = parseInt(dayOfMonth) || 1;
    
    if (editingExpense) {
      const updatedExp: PropertyExpense = {
        ...editingExpense,
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
      onUpdateExpense(updatedExp);
    } else {
      const newExp: PropertyExpense = {
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
        fixedExpenseId: (linkToFixedExpense && frequency !== 'pontual') ? `fx_${Date.now()}` : undefined,
        notes: notes.trim() || undefined,
        observations: observations.trim() || undefined,
        paymentMethod
      };
      onAddExpense(newExp);
    }

    handleCancel();
  };

  const handleEditClick = (exp: PropertyExpense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(exp.amount.toString());
    setFrequency(exp.frequency);
    setCategory(exp.category);
    setDayOfMonth(exp.dayOfMonth?.toString() || '1');
    setDueDate(exp.dueDate || '');
    setStartDate(exp.startDate || '');
    setEndDate(exp.endDate || '');
    setNotes(exp.notes || '');
    setObservations(exp.observations || '');
    setPaymentMethod(exp.paymentMethod || 'Débito Direto');
    setLinkToFixedExpense(!!exp.fixedExpenseId);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setTitle('');
    setAmount('');
    setFrequency('mensal');
    setCategory('Condomínio');
    setDayOfMonth('1');
    setDueDate('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setObservations('');
    setPaymentMethod('Débito Direto');
    setEditingExpense(null);
    setIsAdding(false);
  };

  const getAlertStatus = (exp: PropertyExpense) => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    if (exp.endDate) {
      const end = parseISO(exp.endDate);
      if (isBefore(end, today)) return { status: 'expired', label: 'Expirado' };
      if (isBefore(end, thirtyDaysFromNow)) return { status: 'warning', label: 'Expira em breve' };
    }

    if (exp.dueDate) {
      const due = parseISO(exp.dueDate);
      if (isBefore(due, today)) return { status: 'expired', label: 'Vencido' };
      if (isBefore(due, thirtyDaysFromNow)) return { status: 'warning', label: 'Vence em breve' };
    }

    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Encargos e Custos Operacionais</h3>
              <p className="text-xs font-medium text-muted-foreground">
                Gestão detalhada de obrigações fixas, encargos e manutenção para <span className="text-foreground font-bold">{asset.name}</span>
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border-none shadow-sm bg-rose-500/5 dark:bg-rose-500/10 p-4 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 opacity-80">Gasto Mensal Estimado</span>
              <p className="text-2xl font-black text-rose-600 tracking-tight">
                {maskValue(monthlyTotal, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-rose-500/5 dark:bg-rose-500/10 p-4 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 opacity-80">Gasto Anual Estimado</span>
              <p className="text-2xl font-black text-rose-600 tracking-tight">
                {maskValue(annualTotal, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/5">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Obrigações, Encargos e Contratos</h4>
        <Button 
          onClick={() => {
            if (isAdding) handleCancel();
            else setIsAdding(true);
          }} 
          size="sm"
          className="h-9 px-4 rounded-xl bg-primary hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-2"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancelar' : 'Novo Encargo'}
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
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição do Encargo</Label>
                      <Input 
                        placeholder="Ex: Condomínio, IMI, Pintura..."
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
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Método de Pagamento</Label>
                      <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} className="h-11 rounded-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        {frequency === 'pontual' ? 'Data de Vencimento' : 'Dia Previsto do Mês'}
                      </Label>
                      {frequency === 'pontual' ? (
                        <Input 
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-11 rounded-xl bg-white dark:bg-slate-900 border-border/60 font-bold"
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
                        <div className="flex items-center justify-between p-3 h-11 bg-primary/5 rounded-xl border border-primary/20">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Vincular a Custos Fixos</Label>
                          <Switch 
                            checked={linkToFixedExpense} 
                            onCheckedChange={setLinkToFixedExpense} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-[2] space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações</Label>
                      <Input 
                        placeholder="Observações específicas para o encargo..."
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
                      <Button type="submit" className="h-11 px-8 bg-primary hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                        {editingExpense ? 'Atualizar Encargo' : 'Registar Encargo'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts Summary */}
      {(() => {
        const expiredCount = propertyExpenses.filter(e => getAlertStatus(e)?.status === 'expired').length;
        const warningCount = propertyExpenses.filter(e => getAlertStatus(e)?.status === 'warning').length;
        
        if (expiredCount === 0 && warningCount === 0) return null;

        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 rounded-3xl flex items-center gap-4 ${
              expiredCount > 0 
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600' 
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-600'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              expiredCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">
                {expiredCount > 0 ? 'Existem Obrigações Expiradas' : 'Obrigações a Vencer em Breve'}
              </h4>
              <p className="text-xs font-medium opacity-90 leading-relaxed">
                {expiredCount > 0 && <span>Detetámos {expiredCount} {expiredCount === 1 ? 'obrigação que requer' : 'obrigações que requerem'} atenção imediata por vencimento ultrapassado. </span>}
                {warningCount > 0 && <span>Vão vencer {warningCount} {warningCount === 1 ? 'obrigação' : 'obrigações'} nos próximos 30 dias.</span>}
              </p>
            </div>
          </motion.div>
        );
      })()}

      {/* Grid of Expenses */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {propertyExpenses.length === 0 ? (
          <div className="col-span-full p-12 bg-muted/20 border border-dashed border-border/60 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sem encargos registados</p>
            <p className="text-xs text-muted-foreground mt-1">Utilize o botão acima para registar condomínios, IMI ou manutenções pontuais.</p>
          </div>
        ) : (
          propertyExpenses.map((exp) => {
            const alert = getAlertStatus(exp);
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="group border-none shadow-sm bg-card/50 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${
                      exp.category === 'Condomínio' ? 'bg-blue-500/10 text-blue-600' :
                      exp.category === 'Seguro Multirriscos' ? 'bg-primary/10 text-primary' :
                      exp.category === 'IMI' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-slate-500/10 text-slate-600'
                    }`}>
                      {exp.category === 'Condomínio' && <Home className="w-5 h-5" />}
                      {exp.category === 'Seguro Multirriscos' && <Shield className="w-5 h-5" />}
                      {exp.category === 'IMI' && <Receipt className="w-5 h-5" />}
                      {(exp.category === 'Manutenção' || exp.category === 'Outro') && <Clock className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {exp.category} • {exp.frequency === 'pontual' ? 'PONTUAL' : exp.frequency}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {alert && (
                            <span className={`w-2 h-2 rounded-full animate-pulse ${
                              alert.status === 'expired' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditClick(exp)}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => onDeleteExpense(exp)}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline justify-between gap-4">
                        <h5 className="text-base font-black tracking-tight truncate">{exp.title}</h5>
                        <span className="text-lg font-black text-rose-600 shrink-0">
                          {maskValue(exp.amount, formatter.format)}
                        </span>
                      </div>

                      {exp.observations && (
                        <p className="text-[11px] text-muted-foreground font-medium mt-1 mb-2 line-clamp-1 italic">
                          "{exp.observations}"
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                        {exp.frequency === 'pontual' ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md">
                            Custo Único
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">
                            Recorrente • Dia {exp.dayOfMonth}
                          </div>
                        )}
                        {exp.dueDate && exp.frequency === 'pontual' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            VENCE: {format(parseISO(exp.dueDate), 'dd MMM yyyy', { locale: pt })}
                          </div>
                        )}
                        {exp.paymentMethod && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                            <Receipt className="w-3 h-3" />
                            {exp.paymentMethod}
                          </div>
                        )}
                        {exp.fixedExpenseId && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Vinculado a Fixos
                          </div>
                        )}
                        {alert && (
                          <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            alert.status === 'expired' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            <AlertCircle className="w-3 h-3" /> {alert.label}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
