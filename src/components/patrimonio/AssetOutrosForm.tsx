import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Box, Plus } from 'lucide-react';
import { Asset } from './types';

interface AssetOutrosFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  initialData?: Asset | null;
}

const DEFAULT_OUTROS_TYPES = [
  'Veículo / Viatura',
  'Obra de Arte',
  'Relógio de Luxo',
  'Joias e Metais Preciosos',
  'Participação Empresarial',
  'Colecionáveis',
  'Equipamento Técnico',
  'Outro Património'
];

export function AssetOutrosForm({
  isOpen,
  onClose,
  onSave,
  initialData
}: AssetOutrosFormProps) {
  const [name, setName] = useState('');
  const [subType, setSubType] = useState('Outro Património');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [documentName, setDocumentName] = useState('');

  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newCustomType, setNewCustomType] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('patrimonio_custom_outros_types');
    if (saved) {
      try {
        setCustomTypes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom outros types', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialData && initialData.category === 'outros') {
      setName(initialData.name || '');
      setSubType(initialData.subType || 'Outro Património');
      setCurrentValue(initialData.currentValue ? initialData.currentValue.toString() : '');
      setPurchaseValue(initialData.purchaseValue ? initialData.purchaseValue.toString() : '');
      setAcquisitionDate(initialData.acquisitionDate || '');
      setNotes(initialData.notes || '');
      setDocumentName(initialData.documentName || '');
    } else {
      setName('');
      setSubType('Outro Património');
      setCurrentValue('');
      setPurchaseValue('');
      setAcquisitionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setDocumentName('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const allTypes = [...DEFAULT_OUTROS_TYPES, ...customTypes];

  const handleTypeChange = (val: string) => {
    if (val === 'new_custom_outros') {
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
      localStorage.setItem('patrimonio_custom_outros_types', JSON.stringify(updated));
      setSubType(newCustomType.trim());
      setNewCustomType('');
      setIsAddingCustomType(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currVal = parseFloat(currentValue) || 0;
    const purchVal = parseFloat(purchaseValue) || 0;

    const assetObj: Asset = {
      id: initialData ? initialData.id : `out_${Date.now()}`,
      name: name.trim(),
      category: 'outros',
      subType,
      currentValue: currVal,
      purchaseValue: purchVal,
      acquisitionDate: acquisitionDate || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      documentName: documentName.trim() || undefined
    };

    onSave(assetObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-xl border-border my-8">
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
            <Box className="w-5 h-5 text-primary" />
            {initialData ? 'Editar Outro Ativo' : 'Adicionar Outro Ativo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outrosType">Categoria / Tipo <span className="text-destructive">*</span></Label>
                {!isAddingCustomType ? (
                  <Select value={subType} onValueChange={handleTypeChange} required>
                    <SelectTrigger id="outrosType">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                      <SelectItem value="new_custom_outros">+ Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Novo tipo" 
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
                <Label htmlFor="outrosName">Designação do Ativo <span className="text-destructive">*</span></Label>
                <Input 
                  id="outrosName" 
                  placeholder="Ex: Quadro Amadeo de Souza-Cardoso" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outrosPurch">Valor Compra (€)</Label>
                <Input 
                  id="outrosPurch" 
                  type="number"
                  step="0.01"
                  placeholder="5000" 
                  value={purchaseValue}
                  onChange={(e) => setPurchaseValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outrosCurr">Valor Estimado (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="outrosCurr" 
                  type="number"
                  step="0.01"
                  placeholder="6500" 
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outrosDate">Data Aquisição</Label>
                <Input 
                  id="outrosDate" 
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outrosDoc">Ficheiro / Certificado de Autenticidade</Label>
              <Input 
                id="outrosDoc" 
                placeholder="Ex: Certificado_Autenticidade.pdf" 
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outrosNotes">Notas / Local de Guarda</Label>
              <Input 
                id="outrosNotes" 
                placeholder="Cofre bancário, seguro de bens..." 
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
