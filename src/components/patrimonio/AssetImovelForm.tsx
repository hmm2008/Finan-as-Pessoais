import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Home, Plus, Trash2 } from 'lucide-react';
import { Asset, PropertyExpense } from './types';

interface AssetImovelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset, expenses?: PropertyExpense[]) => void;
  initialData?: Asset | null;
  initialExpenses?: PropertyExpense[];
}

export interface LocalPropertyExpenseItem {
  id: string;
  category: 'Condomínio' | 'IMI' | 'Seguro Multirriscos' | 'Manutenção' | 'Outro';
  amount: string;
  frequency: 'mensal' | 'anual' | 'semestral' | 'trimestral';
  dayOfMonth: string;
}

const EXPENSE_CATEGORIES: LocalPropertyExpenseItem['category'][] = [
  'Condomínio',
  'IMI',
  'Seguro Multirriscos',
  'Manutenção',
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

      const existingPropExpenses = initialExpenses.filter(e => e.assetId === initialData.id);
      if (existingPropExpenses.length > 0) {
        setExpenseItems(
          existingPropExpenses.map(e => ({
            id: e.id,
            category: e.category,
            amount: e.amount ? e.amount.toString() : '',
            frequency: e.frequency || 'mensal',
            dayOfMonth: e.dayOfMonth ? e.dayOfMonth.toString() : '1'
          }))
        );
      } else {
        setExpenseItems([
          {
            id: `pe_${Date.now()}_0`,
            category: 'Condomínio',
            amount: '',
            frequency: 'mensal',
            dayOfMonth: ''
          }
        ]);
      }
    } else {
      setName('');
      setCurrentValue('');
      setPurchaseValue('');
      setAcquisitionDate('');
      setStreet('');
      setZipCode('');
      setCity('');
      setNotes('');
      setExpenseItems([
        {
          id: `pe_${Date.now()}_0`,
          category: 'Condomínio',
          amount: '',
          frequency: 'mensal',
          dayOfMonth: ''
        }
      ]);
    }
  }, [initialData, initialExpenses, isOpen]);

  if (!isOpen) return null;

  const handleAddExpenseRow = () => {
    setExpenseItems(prev => [
      ...prev,
      {
        id: `pe_${Date.now()}_${prev.length}`,
        category: 'Condomínio',
        amount: '',
        frequency: 'mensal',
        dayOfMonth: ''
      }
    ]);
  };

  const handleRemoveExpenseRow = (id: string) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateExpenseRow = (id: string, field: keyof LocalPropertyExpenseItem, value: any) => {
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
        title: `${exp.category} - ${assetObj.name}`,
        amount: parseFloat(exp.amount) || 0,
        frequency: exp.frequency as 'mensal' | 'anual',
        category: exp.category,
        dayOfMonth: parseInt(exp.dayOfMonth) || 1,
        fixedExpenseId: `fe_prop_${exp.id}`
      }));

    onSave(assetObj, validExpenses);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border p-6 space-y-5 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? 'Editar Imóvel' : 'Novo Imóvel'}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="propName" className="text-sm font-medium text-foreground">
              Nome <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="propName"
              placeholder="Ex: Apartamento Vale das Flores"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-11 bg-muted/20"
              required
            />
          </div>

          {/* Tipo de Imóvel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="propType" className="text-sm font-medium text-foreground">
                Tipo de Imóvel
              </Label>
              <Select
                value={propertyType}
                onValueChange={(v) => setPropertyType(v)}
              >
                <SelectTrigger id="propType" className="rounded-xl h-11 bg-muted/20">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Moradia">Moradia</SelectItem>
                  <SelectItem value="Terreno">Terreno</SelectItem>
                  <SelectItem value="Loja">Loja</SelectItem>
                  <SelectItem value="Outro">Outro (Personalizar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {propertyType === 'Outro' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2">
                <Label htmlFor="customPropType" className="text-sm font-medium text-foreground">
                  Especifique o Tipo
                </Label>
                <Input
                  id="customPropType"
                  placeholder="Ex: Garagem, Armazém"
                  value={customPropertyType}
                  onChange={(e) => setCustomPropertyType(e.target.value)}
                  className="rounded-xl h-11 bg-muted/20"
                  required
                />
              </div>
            )}
          </div>

          {/* Valor Atual / Valor de Compra */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentValue" className="text-sm font-medium text-foreground">
                Valor Atual (€) <span className="text-muted-foreground">*</span>
              </Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="rounded-xl h-11 bg-muted/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseValue" className="text-sm font-medium text-foreground">
                Valor de Compra (€)
              </Label>
              <Input
                id="purchaseValue"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
                className="rounded-xl h-11 bg-muted/20"
              />
            </div>
          </div>

          {/* Data de Aquisição */}
          <div className="space-y-1.5">
            <Label htmlFor="acqDate" className="text-sm font-medium text-foreground">
              Data de Aquisição
            </Label>
            <Input
              id="acqDate"
              type="date"
              placeholder="dd/mm/aaaa"
              value={acquisitionDate}
              onChange={(e) => setAcquisitionDate(e.target.value)}
              className="rounded-xl h-11 bg-muted/20"
            />
          </div>

          {/* Rua */}
          <div className="space-y-1.5">
            <Label htmlFor="street" className="text-sm font-medium text-foreground">
              Rua
            </Label>
            <Input
              id="street"
              placeholder="Ex: Rua das Flores, 123"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="rounded-xl h-11 bg-muted/20"
            />
          </div>

          {/* Código Postal / Localidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="zipCode" className="text-sm font-medium text-foreground">
                Código Postal
              </Label>
              <Input
                id="zipCode"
                placeholder="0000-000"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="rounded-xl h-11 bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-sm font-medium text-foreground">
                Localidade
              </Label>
              <Input
                id="city"
                placeholder="Ex: Coimbra"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl h-11 bg-muted/20"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="propNotes" className="text-sm font-medium text-foreground">
              Observações
            </Label>
            <textarea
              id="propNotes"
              rows={3}
              placeholder=""
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-border/80">
            {/* Custos Fixos do Imóvel Header */}
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-foreground">Custos Fixos do Imóvel</span>
            </div>

            {/* Expenses list rows */}
            <div className="space-y-2 mb-3">
              {expenseItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  {/* Categoria */}
                  <div className="col-span-3">
                    <Select
                      value={item.category}
                      onValueChange={(v) => handleUpdateExpenseRow(item.id, 'category', v)}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-muted/20 text-xs px-2">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Valor (€) */}
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) => handleUpdateExpenseRow(item.id, 'amount', e.target.value)}
                      className="h-10 rounded-xl bg-muted/20 text-xs px-2"
                    />
                  </div>

                  {/* Frequência */}
                  <div className="col-span-3">
                    <Select
                      value={item.frequency}
                      onValueChange={(v) => handleUpdateExpenseRow(item.id, 'frequency', v)}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-muted/20 text-xs px-2">
                        <SelectValue placeholder="Mensal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal" className="text-xs">Mensal</SelectItem>
                        <SelectItem value="anual" className="text-xs">Anual</SelectItem>
                        <SelectItem value="semestral" className="text-xs">Semestral</SelectItem>
                        <SelectItem value="trimestral" className="text-xs">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dia mês */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Dia mês"
                      value={item.dayOfMonth}
                      onChange={(e) => handleUpdateExpenseRow(item.id, 'dayOfMonth', e.target.value)}
                      className="h-10 rounded-xl bg-muted/20 text-xs px-2"
                    />
                  </div>

                  {/* Trash / Delete */}
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveExpenseRow(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar Despesa Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleAddExpenseRow}
              className="w-full h-11 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-600 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-400 font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Despesa
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl font-medium border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl font-medium bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
