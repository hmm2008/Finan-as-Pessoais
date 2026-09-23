import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { X, Home, Plus, Trash2, Building2, MapPin, Calendar, Euro, Info } from 'lucide-react';
import { Asset, PropertyExpense } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentMethodSelector } from '../financas/PaymentMethodSelector';

interface AssetImovelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset, expenses?: PropertyExpense[]) => void;
  initialData?: Asset | null;
  initialExpenses?: PropertyExpense[];
}

export interface LocalPropertyExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: string;
  frequency: string;
  paymentMethod: string;
  entity: string;
  dayOfMonth: string;
  alertDays: string;
  active: boolean;
  notes: string;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Luz',
  'Eletricidade',
  'Água',
  'Gás',
  'Condomínio',
  'IMI',
  'Seguros',
  'Seguro Multirriscos',
  'Manutenção',
  'Telecomunicações / Internet',
  'Internet',
  'Limpeza',
  'Obras / Reparações',
  'Segurança / Alarme',
  'Jardinagem',
  'Habitação',
  'Impostos',
  'Outro'
];

export function AssetImovelForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  initialExpenses = []
}: AssetImovelFormProps) {
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('Apartamento');
  const [customPropertyType, setCustomPropertyType] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseItems, setExpenseItems] = useState<LocalPropertyExpenseItem[]>([]);
  
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>([]);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [activeRowForCustom, setActiveRowForCustom] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('property_expense_custom_categories');
    if (saved) {
      try {
        setCustomExpenseCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom property expense categories', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialData && initialData.category === 'imovel') {
      setName(initialData.name || '');
      
      const type = initialData.subType || 'Apartamento';
      if (['Apartamento', 'Moradia', 'Terreno', 'Loja'].includes(type)) {
        setPropertyType(type);
        setCustomPropertyType('');
      } else {
        setPropertyType('Outro');
        setCustomPropertyType(type);
      }

      setCurrentValue(initialData.currentValue ? initialData.currentValue.toString() : '');
      setPurchaseValue(initialData.purchaseValue ? initialData.purchaseValue.toString() : '');
      setAcquisitionDate(initialData.acquisitionDate || '');
      setStreet(initialData.street || '');
      setZipCode(initialData.zipCode || '');
      setCity(initialData.city || '');
      setNotes(initialData.notes || '');

      const propExpensesList = (initialExpenses && initialExpenses.length > 0)
        ? initialExpenses.filter(e => String(e.assetId) === String(initialData.id))
        : (Array.isArray(initialData.expenses) ? initialData.expenses : []);

      if (propExpensesList.length > 0) {
        setExpenseItems(
          propExpensesList.map(e => ({
            id: e.id,
            title: e.title || `${e.category} - ${initialData.name}`,
            category: e.category,
            amount: e.amount !== undefined && e.amount !== null ? e.amount.toString() : '',
            frequency: e.frequency || 'Mensal',
            paymentMethod: e.paymentMethod || 'Débito Direto',
            entity: e.entity || '',
            dayOfMonth: e.dayOfMonth ? e.dayOfMonth.toString() : '1',
            alertDays: e.alertDays ? e.alertDays.toString() : '7',
            active: e.active !== undefined ? e.active : true,
            notes: e.notes || e.observations || ''
          }))
        );
      } else {
        setExpenseItems([]);
      }
    } else {
      setName('');
      setPropertyType('Apartamento');
      setCustomPropertyType('');
      setCurrentValue('');
      setPurchaseValue('');
      setAcquisitionDate('');
      setStreet('');
      setZipCode('');
      setCity('');
      setNotes('');
      setExpenseItems([]);
    }
  }, [initialData, initialExpenses, isOpen]);

  if (!isOpen) return null;

  const handleAddExpenseRow = () => {
    setExpenseItems(prev => [
      ...prev,
      {
        id: `pe_${Date.now()}_${prev.length}`,
        title: '',
        category: 'Habitação',
        amount: '',
        frequency: 'Mensal',
        paymentMethod: 'Débito Direto',
        entity: '',
        dayOfMonth: '1',
        alertDays: '7',
        active: true,
        notes: ''
      }
    ]);
  };

  const handleRemoveExpenseRow = (id: string) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id));
  };

  const allCategories = Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customExpenseCategories]));

  const handleAddCustomCategory = () => {
    if (!newCustomCategory.trim()) return;
    const cat = newCustomCategory.trim();
    if (!customExpenseCategories.includes(cat)) {
      const updated = [...customExpenseCategories, cat];
      setCustomExpenseCategories(updated);
      localStorage.setItem('property_expense_custom_categories', JSON.stringify(updated));
    }
    if (activeRowForCustom) {
      handleUpdateExpenseRow(activeRowForCustom, 'category', cat);
    }
    setNewCustomCategory('');
    setIsAddingCustomCategory(false);
    setActiveRowForCustom(null);
  };

  const handleUpdateExpenseRow = (id: string, field: keyof LocalPropertyExpenseItem, value: any) => {
    if (field === 'category' && value === 'new_custom') {
      setIsAddingCustomCategory(true);
      setActiveRowForCustom(id);
      return;
    }
    setExpenseItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const currVal = parseFloat(currentValue) || 0;
    const purchVal = parseFloat(purchaseValue) || 0;
    const assetId = initialData ? initialData.id : `prop_${Date.now()}`;

    const finalType = propertyType === 'Outro' ? (customPropertyType.trim() || 'Outro') : propertyType;

    const assetObj: Asset = {
      id: assetId,
      name: name.trim(),
      category: 'imovel',
      subType: finalType,
      currentValue: currVal,
      purchaseValue: purchVal,
      acquisitionDate: acquisitionDate || new Date().toISOString().split('T')[0],
      street: street.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined
    };

    const validExpenses: PropertyExpense[] = expenseItems
      .filter(exp => parseFloat(exp.amount) > 0 || exp.category)
      .map(exp => ({
        id: exp.id,
        assetId: assetId,
        title: exp.title.trim() || `${exp.category} - ${assetObj.name}`,
        amount: parseFloat(exp.amount) || 0,
        frequency: exp.frequency,
        category: exp.category,
        dayOfMonth: parseInt(exp.dayOfMonth) || 1,
        paymentMethod: exp.paymentMethod,
        entity: exp.entity?.trim() || undefined,
        alertDays: parseInt(exp.alertDays) || 7,
        active: exp.active,
        notes: exp.notes?.trim() || undefined,
        fixedExpenseId: `fe_prop_${exp.id}`
      }));

    onSave(assetObj, validExpenses);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-card rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden"
        >
          {/* Header Accent */}
          <div className="h-2 w-full bg-primary" />

          <div className="p-8 sm:p-10 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {initialData ? 'Editar Imóvel' : 'Novo Imóvel'}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    Detalhes do Ativo Imobiliário
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info Column */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-3.5 h-3.5 text-primary" />
                      <Label htmlFor="propName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome do Imóvel</Label>
                    </div>
                    <Input
                      id="propName"
                      placeholder="Ex: Apartamento Vale das Flores"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Euro className="w-3.5 h-3.5 text-primary" />
                      <Label htmlFor="currentValue" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Atual Estimado (€)</Label>
                    </div>
                    <Input
                      id="currentValue"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Euro className="w-3.5 h-3.5 text-primary" />
                      <Label htmlFor="purchaseValue" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor de Compra (€)</Label>
                    </div>
                    <Input
                      id="purchaseValue"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <Label htmlFor="acqDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data de Aquisição</Label>
                    </div>
                    <Input
                      id="acqDate"
                      type="date"
                      value={acquisitionDate}
                      onChange={(e) => setAcquisitionDate(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Location & Details Column */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-3.5 h-3.5 text-primary" />
                      <Label htmlFor="propType" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Imóvel</Label>
                    </div>
                    <Select value={propertyType} onValueChange={(v) => setPropertyType(v)}>
                      <SelectTrigger id="propType" className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Apartamento">Apartamento</SelectItem>
                        <SelectItem value="Moradia">Moradia</SelectItem>
                        <SelectItem value="Terreno">Terreno</SelectItem>
                        <SelectItem value="Loja">Loja</SelectItem>
                        <SelectItem value="Outro">Outro (Personalizar)</SelectItem>
                      </SelectContent>
                    </Select>
                    {propertyType === 'Outro' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2"
                      >
                        <Input
                          placeholder="Especifique o Tipo"
                          value={customPropertyType}
                          onChange={(e) => setCustomPropertyType(e.target.value)}
                          className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <Label htmlFor="street" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Morada</Label>
                    </div>
                    <Input
                      id="street"
                      placeholder="Ex: Rua das Flores, 123"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cód. Postal</Label>
                      <Input
                        id="zipCode"
                        placeholder="0000-000"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Localidade</Label>
                      <Input
                        id="city"
                        placeholder="Ex: Coimbra"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="propNotes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações Adicionais</Label>
                    <textarea
                      id="propNotes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500/20 resize-none outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Property Expenses Section */}
              <div className="space-y-6 pt-6 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Euro className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Encargos & Custos Fixos</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleAddExpenseRow}
                    className="h-9 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Encargo
                  </Button>
                </div>

                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {expenseItems.length === 0 ? (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-xs text-muted-foreground font-medium bg-muted/20 rounded-2xl border border-dashed border-border/40"
                      >
                        Nenhum custo fixo registado para este imóvel.
                      </motion.p>
                    ) : (
                      expenseItems.map((item, index) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="p-5 rounded-3xl bg-muted/20 border border-border/30 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição / Nome do Encargo</Label>
                                <Input
                                  placeholder="Ex: Condomínio, IMI..."
                                  value={item.title}
                                  onChange={(e) => handleUpdateExpenseRow(item.id, 'title', e.target.value)}
                                  className="h-10 rounded-xl bg-background/50 border-border/40 text-xs font-bold"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</Label>
                                {(isAddingCustomCategory && activeRowForCustom === item.id) ? (
                                  <div className="flex gap-2">
                                    <Input 
                                      placeholder="Nova categoria" 
                                      value={newCustomCategory}
                                      onChange={(e) => setNewCustomCategory(e.target.value)}
                                      autoFocus
                                      className="h-10 rounded-xl bg-background/50 border-border/40 text-xs font-bold"
                                    />
                                    <Button 
                                      type="button" 
                                      onClick={handleAddCustomCategory} 
                                      size="icon" 
                                      className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 text-primary hover:bg-primary/30"
                                      disabled={!newCustomCategory.trim()}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => {
                                        setIsAddingCustomCategory(false);
                                        setActiveRowForCustom(null);
                                      }}
                                      className="h-10 w-10 shrink-0 rounded-xl"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select
                                    value={item.category}
                                    onValueChange={(v) => handleUpdateExpenseRow(item.id, 'category', v)}
                                  >
                                    <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 text-xs font-bold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                      {allCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="text-xs font-medium">{cat}</SelectItem>
                                      ))}
                                      <SelectItem value="new_custom" className="text-xs font-black text-primary uppercase tracking-widest">+ Personalizar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 self-end mb-0.5"
                              onClick={() => handleRemoveExpenseRow(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor (€)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.amount}
                                onChange={(e) => handleUpdateExpenseRow(item.id, 'amount', e.target.value)}
                                className="h-9 rounded-xl bg-background/30 border-border/20 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Periodicidade</Label>
                              <Select
                                value={item.frequency}
                                onValueChange={(v) => handleUpdateExpenseRow(item.id, 'frequency', v)}
                              >
                                <SelectTrigger className="h-9 rounded-xl bg-background/30 border-border/20 text-xs font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="Mensal" className="text-xs font-medium">Mensal</SelectItem>
                                  <SelectItem value="Trimestral" className="text-xs font-medium">Trimestral</SelectItem>
                                  <SelectItem value="Semestral" className="text-xs font-medium">Semestral</SelectItem>
                                  <SelectItem value="Anual" className="text-xs font-medium">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dia do Mês (Vencimento)</Label>
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="Ex: 15"
                                value={item.dayOfMonth}
                                onChange={(e) => handleUpdateExpenseRow(item.id, 'dayOfMonth', e.target.value)}
                                className="h-9 rounded-xl bg-background/30 border-border/20 text-xs font-bold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entidade / Beneficiário</Label>
                              <Input
                                placeholder="Ex: Banco / EDP / Condomínio"
                                value={item.entity}
                                onChange={(e) => handleUpdateExpenseRow(item.id, 'entity', e.target.value)}
                                className="h-9 rounded-xl bg-background/30 border-border/20 text-[11px] font-medium"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Método de Pagamento</Label>
                              <PaymentMethodSelector
                                value={item.paymentMethod}
                                onChange={(val) => handleUpdateExpenseRow(item.id, 'paymentMethod', val)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alertar Antes</Label>
                              <Select
                                value={item.alertDays}
                                onValueChange={(v) => handleUpdateExpenseRow(item.id, 'alertDays', v)}
                              >
                                <SelectTrigger className="h-9 rounded-xl bg-background/30 border-border/20 text-xs font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="0" className="text-xs font-medium">No próprio dia</SelectItem>
                                  <SelectItem value="3" className="text-xs font-medium">3 dias antes</SelectItem>
                                  <SelectItem value="7" className="text-xs font-medium">7 dias antes</SelectItem>
                                  <SelectItem value="14" className="text-xs font-medium">14 dias antes</SelectItem>
                                  <SelectItem value="30" className="text-xs font-medium">30 dias antes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                            <div className="space-y-1.5 flex-1">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notas (Opcional)</Label>
                              <Input
                                placeholder="Ex: Referência contrato..."
                                value={item.notes}
                                onChange={(e) => handleUpdateExpenseRow(item.id, 'notes', e.target.value)}
                                className="h-9 rounded-xl bg-background/30 border-border/20 text-[11px] font-medium"
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/40">
                              <div className="space-y-0.5">
                                <Label className="text-xs font-bold">Despesa Ativa</Label>
                                <p className="text-[10px] text-muted-foreground">Incluir nas projeções</p>
                              </div>
                              <Switch
                                checked={item.active}
                                onCheckedChange={(val) => handleUpdateExpenseRow(item.id, 'active', val)}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/20 text-[10px] font-black uppercase tracking-widest text-primary">
                            <span>🔗 Vinculado a Custos Fixos (Sincronizado)</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-6 border-t border-border/40">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-border hover:bg-muted transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-indigo-700 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  {initialData ? 'Guardar Alterações' : 'Registar Imóvel'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
