import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, TrendingUp, Plus, Percent, Euro, Building, Info, Calendar, Target } from 'lucide-react';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';
import { motion, AnimatePresence } from 'motion/react';

interface AssetFinanceiroFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  initialData?: Asset | null;
}

const DEFAULT_FINANCIAL_TYPES = [
  'Ações',
  'ETF',
  'Fundo de Investimento',
  'Criptomoeda',
  'Conta Poupança',
  'Certificados Aforro',
  'Ouro'
];

export function AssetFinanceiroForm({
  isOpen,
  onClose,
  onSave,
  initialData
}: AssetFinanceiroFormProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [name, setName] = useState('');
  const [subType, setSubType] = useState('Ações');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [institution, setInstitution] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newCustomType, setNewCustomType] = useState('');

  // Load custom types from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('patrimonio_custom_fin_types');
    if (saved) {
      try {
        setCustomTypes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom financial types', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialData && initialData.category === 'financeiro') {
      setName(initialData.name || '');
      setSubType(initialData.subType || 'Ações');
      setCurrentValue(initialData.currentValue ? initialData.currentValue.toString() : '');
      setPurchaseValue(initialData.purchaseValue ? initialData.purchaseValue.toString() : '');
      setQuantity(initialData.quantity ? initialData.quantity.toString() : '');
      setAveragePrice(initialData.averagePrice ? initialData.averagePrice.toString() : '');
      setInterestRate(initialData.interestRate ? initialData.interestRate.toString() : '');
      setInstitution(initialData.institution || '');
      setStartDate(initialData.startDate || initialData.acquisitionDate || '');
      setEndDate(initialData.endDate || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setSubType('Ações');
      setCurrentValue('');
      setPurchaseValue('');
      setQuantity('');
      setAveragePrice('');
      setInterestRate('');
      setInstitution('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const allTypes = [...DEFAULT_FINANCIAL_TYPES, ...customTypes];

  const handleTypeChange = (val: string) => {
    if (val === 'new_custom_type') {
      setIsAddingCustomType(true);
      setSubType('');
    } else {
      setIsAddingCustomType(false);
      setSubType(val);
    }
  };

  const handleAddCustomType = () => {
    if (newCustomType.trim() && !allTypes.includes(newCustomType.trim())) {
      const updated = [...customTypes, newCustomType.trim()];
      setCustomTypes(updated);
      localStorage.setItem('patrimonio_custom_fin_types', JSON.stringify(updated));
      setSubType(newCustomType.trim());
      setNewCustomType('');
      setIsAddingCustomType(false);
    }
  };

  const handleQuantityOrPriceChange = (newQty: string, newAvgPrice: string) => {
    setQuantity(newQty);
    setAveragePrice(newAvgPrice);

    const q = parseFloat(newQty);
    const p = parseFloat(newAvgPrice);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setPurchaseValue((q * p).toFixed(2));
    }
  };

  const curr = parseFloat(currentValue) || 0;
  const purch = parseFloat(purchaseValue) || 0;
  const gainAbs = curr - purch;
  const gainPct = purch > 0 ? (gainAbs / purch) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const assetObj: Asset = {
      id: initialData ? initialData.id : `fin_${Date.now()}`,
      name: name.trim(),
      category: 'financeiro',
      subType,
      currentValue: curr,
      purchaseValue: purch,
      acquisitionDate: startDate || new Date().toISOString().split('T')[0],
      quantity: parseFloat(quantity) || undefined,
      averagePrice: parseFloat(averagePrice) || undefined,
      interestRate: parseFloat(interestRate) || undefined,
      institution: institution.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined
    };

    onSave(assetObj);
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
          <div className="h-2 w-full bg-blue-600" />

          <div className="p-8 sm:p-10 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {initialData ? 'Editar Ativo' : 'Novo Ativo'}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    Investimentos & Ativos Financeiros
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
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      <Label htmlFor="finType" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Ativo</Label>
                    </div>
                    {!isAddingCustomType ? (
                      <Select value={subType} onValueChange={handleTypeChange}>
                        <SelectTrigger id="finType" className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {allTypes.map(t => (
                            <SelectItem key={t} value={t} className="text-xs font-medium">{t}</SelectItem>
                          ))}
                          <SelectItem value="new_custom_type" className="text-xs font-bold text-blue-600">+ Novo Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2"
                      >
                        <Input 
                          placeholder="Novo tipo..." 
                          value={newCustomType}
                          onChange={(e) => setNewCustomType(e.target.value)}
                          className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                          autoFocus
                        />
                        <Button type="button" onClick={handleAddCustomType} size="icon" className="h-12 w-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shrink-0 shadow-lg shadow-blue-500/20" disabled={!newCustomType.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddingCustomType(false)} className="h-12 w-12 rounded-2xl border border-border/40">
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <Label htmlFor="finName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Designação</Label>
                    </div>
                    <Input 
                      id="finName" 
                      placeholder="Ex: Vanguard S&P 500 (VUAA)" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="w-3.5 h-3.5 text-blue-500" />
                      <Label htmlFor="institution" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instituição / Plataforma</Label>
                    </div>
                    <Input 
                      id="institution" 
                      placeholder="Ex: Degiro, CGD, Binance" 
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-3.5 h-3.5 text-blue-500" />
                      <Label htmlFor="interestRate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taxa de Juro TANB (%)</Label>
                    </div>
                    <Input 
                      id="interestRate" 
                      type="number"
                      step="0.01"
                      placeholder="Ex: 3.50" 
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Values & Numbers Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantidade</Label>
                      <Input 
                        id="quantity" 
                        type="number"
                        step="any"
                        placeholder="Ex: 50.5" 
                        value={quantity}
                        onChange={(e) => handleQuantityOrPriceChange(e.target.value, averagePrice)}
                        className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="avgPrice" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Preço Médio (€)</Label>
                      <Input 
                        id="avgPrice" 
                        type="number"
                        step="0.0001"
                        placeholder="Ex: 78.50" 
                        value={averagePrice}
                        onChange={(e) => handleQuantityOrPriceChange(quantity, e.target.value)}
                        className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Euro className="w-3.5 h-3.5 text-blue-500" />
                      <Label htmlFor="purchaseVal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Investido (€)</Label>
                    </div>
                    <Input 
                      id="purchaseVal" 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      <Label htmlFor="currentVal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor de Mercado (€)</Label>
                    </div>
                    <Input 
                      id="currentVal" 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-bold"
                      required
                    />
                  </div>

                  {/* Performance Preview Banner */}
                  <AnimatePresence>
                    {curr > 0 && purch > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between ${
                          gainAbs >= 0 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase font-black tracking-widest block opacity-70">Mais-Valia Estimada</span>
                          <span className="font-black text-lg tracking-tighter">
                            {gainAbs >= 0 ? '+' : ''}{maskValue(gainAbs, formatter.format)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded-lg font-black text-xs inline-block ${
                             gainAbs >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                          }`}>
                            {gainAbs >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <Label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Aquisição</Label>
                  </div>
                  <Input 
                    id="startDate" 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <Label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Maturidade</Label>
                  </div>
                  <Input 
                    id="endDate" 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-2xl h-12 bg-muted/30 border-border/40 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="finNotes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notas & Observações</Label>
                <textarea
                  id="finNotes" 
                  rows={2}
                  placeholder="Estratégia, IBAN, dividendos..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500/20 resize-none outline-none transition-all"
                />
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
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  {initialData ? 'Guardar Alterações' : 'Registar Ativo'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
