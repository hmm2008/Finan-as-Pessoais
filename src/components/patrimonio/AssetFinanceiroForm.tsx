import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, TrendingUp, Plus, Percent, DollarSign, Building } from 'lucide-react';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';

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

  // Recalculate purchase value when quantity or average price changes (if available)
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

  const isSavingsType = ['Conta Poupança', 'Certificados Aforro', 'Depósito a Prazo'].includes(subType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-xl shadow-xl border-border my-8">
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
            <TrendingUp className="w-5 h-5 text-primary" />
            {initialData ? 'Editar Ativo Financeiro' : 'Novo Ativo Financeiro'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="finType">Tipo de Ativo <span className="text-destructive">*</span></Label>
                {!isAddingCustomType ? (
                  <Select value={subType} onValueChange={handleTypeChange} required>
                    <SelectTrigger id="finType">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                      <SelectItem value="new_custom_type">+ Novo Tipo Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Novo tipo (Ex: P2P, Crypto Staking)" 
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
                <Label htmlFor="finName">Designação / Nome <span className="text-destructive">*</span></Label>
                <Input 
                  id="finName" 
                  placeholder="Ex: Vanguard S&P 500 (VUAA), Bitcoin, Certificados Série E" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Instituição / Plataforma</Label>
                <Input 
                  id="institution" 
                  placeholder="Ex: Degiro, CGD, Trade Republic, Binance" 
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Taxa de Juro TANB (%)</Label>
                <Input 
                  id="interestRate" 
                  type="number"
                  step="0.01"
                  placeholder="Ex: 3.50" 
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
            </div>

            {/* Quantity and Average Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade / Unidades</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  step="any"
                  placeholder="Ex: 50.5" 
                  value={quantity}
                  onChange={(e) => handleQuantityOrPriceChange(e.target.value, averagePrice)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avgPrice">Preço Médio de Compra (€)</Label>
                <Input 
                  id="avgPrice" 
                  type="number"
                  step="0.0001"
                  placeholder="Ex: 78.50" 
                  value={averagePrice}
                  onChange={(e) => handleQuantityOrPriceChange(quantity, e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseVal">Valor Total Investido (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="purchaseVal" 
                  type="number"
                  step="0.01"
                  placeholder="3964.25" 
                  value={purchaseValue}
                  onChange={(e) => setPurchaseValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentVal">Valor Atual de Mercado (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="currentVal" 
                  type="number"
                  step="0.01"
                  placeholder="4520.00" 
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Performance Preview Banner */}
            {curr > 0 && purch > 0 && (
              <div className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                gainAbs >= 0 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}>
                <div>
                  <span className="text-xs uppercase font-semibold block">Performance Calculada:</span>
                  <span className="font-bold text-base">
                    {gainAbs >= 0 ? '+' : ''}{maskValue(gainAbs, formatter.format)}
                  </span>
                </div>
                <div className="text-right font-bold text-base">
                  {gainAbs >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início / Aquisição</Label>
                <Input 
                  id="startDate" 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Maturidade / Fim (Opcional)</Label>
                <Input 
                  id="endDate" 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finNotes">Notas / Observações</Label>
              <Input 
                id="finNotes" 
                placeholder="Estratégia, dividendos recebidos, IBAN..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">
                {initialData ? 'Atualizar Ativo' : 'Guardar Ativo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
