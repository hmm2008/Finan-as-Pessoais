import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Home, FileText } from 'lucide-react';
import { Asset } from './types';

interface AssetImovelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  initialData?: Asset | null;
}

const PROPERTY_TYPES = [
  'Apartamento T0 / T1',
  'Apartamento T2 / T3',
  'Apartamento T4+',
  'Moradia Unifamiliar',
  'Terreno / Lote',
  'Garagem / Estacionamento',
  'Espaço Comercial / Escritório',
  'Outro Imóvel'
];

export function AssetImovelForm({
  isOpen,
  onClose,
  onSave,
  initialData
}: AssetImovelFormProps) {
  const [name, setName] = useState('');
  const [subType, setSubType] = useState('Apartamento T2 / T3');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [monthlyExpense, setMonthlyExpense] = useState('');
  const [annualExpense, setAnnualExpense] = useState('');
  const [notes, setNotes] = useState('');
  const [documentName, setDocumentName] = useState('');

  useEffect(() => {
    if (initialData && initialData.category === 'imovel') {
      setName(initialData.name || '');
      setSubType(initialData.subType || 'Apartamento T2 / T3');
      setCurrentValue(initialData.currentValue ? initialData.currentValue.toString() : '');
      setPurchaseValue(initialData.purchaseValue ? initialData.purchaseValue.toString() : '');
      setAcquisitionDate(initialData.acquisitionDate || '');
      setStreet(initialData.street || '');
      setZipCode(initialData.zipCode || '');
      setCity(initialData.city || '');
      setMonthlyExpense(initialData.monthlyExpense ? initialData.monthlyExpense.toString() : '');
      setAnnualExpense(initialData.annualExpense ? initialData.annualExpense.toString() : '');
      setNotes(initialData.notes || '');
      setDocumentName(initialData.documentName || '');
    } else {
      setName('');
      setSubType('Apartamento T2 / T3');
      setCurrentValue('');
      setPurchaseValue('');
      setAcquisitionDate(new Date().toISOString().split('T')[0]);
      setStreet('');
      setZipCode('');
      setCity('');
      setMonthlyExpense('');
      setAnnualExpense('');
      setNotes('');
      setDocumentName('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currVal = parseFloat(currentValue) || 0;
    const purchVal = parseFloat(purchaseValue) || 0;

    const assetObj: Asset = {
      id: initialData ? initialData.id : `prop_${Date.now()}`,
      name: name.trim(),
      category: 'imovel',
      subType,
      currentValue: currVal,
      purchaseValue: purchVal,
      acquisitionDate,
      street: street.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      city: city.trim() || undefined,
      monthlyExpense: parseFloat(monthlyExpense) || 0,
      annualExpense: parseFloat(annualExpense) || 0,
      notes: notes.trim() || undefined,
      documentName: documentName.trim() || undefined
    };

    onSave(assetObj);
    onClose();
  };

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
            <Home className="w-5 h-5 text-primary" />
            {initialData ? 'Editar Imóvel' : 'Adicionar Novo Imóvel'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propName">Designação do Imóvel <span className="text-destructive">*</span></Label>
                <Input 
                  id="propName" 
                  placeholder="Ex: T2 Lisboa Saldanha" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propSubType">Tipo de Imóvel <span className="text-destructive">*</span></Label>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger id="propSubType">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentValue">Valor Atual Mercadológico (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="currentValue" 
                  type="number"
                  step="0.01"
                  placeholder="280000" 
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseValue">Valor de Aquisição (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="purchaseValue" 
                  type="number"
                  step="0.01"
                  placeholder="220000" 
                  value={purchaseValue}
                  onChange={(e) => setPurchaseValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acqDate">Data de Aquisição <span className="text-destructive">*</span></Label>
                <Input 
                  id="acqDate" 
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Rua / Morada</Label>
              <Input 
                id="street" 
                placeholder="Av. da República, nº 45, 3º Dto" 
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Código Postal</Label>
                <Input 
                  id="zipCode" 
                  placeholder="1050-187" 
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Localidade / Cidade</Label>
                <Input 
                  id="city" 
                  placeholder="Lisboa" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyExpense">Despesa Mensal Estimada (€)</Label>
                <Input 
                  id="monthlyExpense" 
                  type="number"
                  step="0.01"
                  placeholder="65.00 (Ex: Condomínio)" 
                  value={monthlyExpense}
                  onChange={(e) => setMonthlyExpense(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualExpense">Despesa Anual Estimada (€)</Label>
                <Input 
                  id="annualExpense" 
                  type="number"
                  step="0.01"
                  placeholder="450.00 (Ex: IMI + Seguro)" 
                  value={annualExpense}
                  onChange={(e) => setAnnualExpense(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="docName">Documento / Escritura (Nome do Ficheiro)</Label>
              <Input 
                id="docName" 
                placeholder="Ex: Escritura_T2_Lisboa.pdf" 
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propNotes">Notas / Observações</Label>
              <Input 
                id="propNotes" 
                placeholder="Detalhes sobre arrendamento, obras realizadas..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">
                {initialData ? 'Atualizar Imóvel' : 'Guardar Imóvel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
