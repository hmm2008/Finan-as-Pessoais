import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Wand2, Plus, Car } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { getSuggestedCategory, getAISuggestedCategory } from './AutoCategorization';
import { useExpenses, useVehicles, useVehicleFuel, useCategorizationRules } from '../../hooks/queries';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface ExpenseFormProps {
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = ['Alimentação', 'Habitação', 'Transportes', 'Combustível', 'Saúde', 'Lazer', 'Luz', 'Água', 'Internet', 'Seguros', 'Educação', 'Investimentos', 'Outros'];

export function ExpenseForm({ isOpen, onClose, initialData }: ExpenseFormProps) {

  const { addExpense, updateExpense } = useExpenses();
  const { vehicles, updateVehicle } = useVehicles();
  const { fuelEntries, addFuelEntry, updateFuelEntry, deleteFuelEntry } = useVehicleFuel();
  const { categorizationRules, addRule } = useCategorizationRules();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [entity, setEntity] = useState('');
  const [method, setMethod] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [showSaveRulePrompt, setShowSaveRulePrompt] = useState(false);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');

  // Reset or populate form when opened
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setCategory(initialData.category || '');
        setEntity(initialData.entity || initialData.name || initialData.description || '');
        setMethod(initialData.method || 'Débito Direto');
        setRecurring(initialData.recurring !== undefined ? initialData.recurring : (initialData.isFixedExpense ? true : false));
        setNotes(initialData.notes || '');
        setVehicleId(initialData.vehicleId || '');
        setLiters(initialData.liters !== undefined && initialData.liters !== null ? initialData.liters.toString() : '');
        setKilometers(initialData.kilometers !== undefined && initialData.kilometers !== null ? initialData.kilometers.toString() : '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setCategory('');
        setEntity('');
        setMethod('');
        setRecurring(false);
        setNotes('');
        setVehicleId('');
        setLiters('');
        setKilometers('');
      }
      setIsSubmitting(false);
      setSuggestedCategory(null);
      setIsAISuggesting(false);
      setShowSaveRulePrompt(false);
      setIsAddingCustom(false);
      setNewCustomCategory('');
    }
  }, [isOpen, initialData]);


  useEffect(() => {
    const saved = localStorage.getItem('expense_custom_categories');
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  }, []);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  // Auto-categorization effect
  useEffect(() => {
    const textToAnalyze = `${entity} ${notes}`.trim();
    if (textToAnalyze.length > 2) {
      const suggestion = getSuggestedCategory(textToAnalyze, categorizationRules);
      if (suggestion && suggestion !== category) {
        setSuggestedCategory(suggestion);
        setIsAISuggesting(false);
      } else if (!suggestion && !category && entity.length > 3) {
        // Debounce AI suggestion
        const timer = setTimeout(async () => {
          setIsAISuggesting(true);
          const aiSuggestion = await getAISuggestedCategory(entity, parseFloat(amount) || 0, allCategories);
          if (aiSuggestion && aiSuggestion !== 'Outros' && aiSuggestion !== 'Unknown') {
            setSuggestedCategory(aiSuggestion);
          }
          setIsAISuggesting(false);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setSuggestedCategory(null);
      }
    } else {
      setSuggestedCategory(null);
    }
  }, [entity, notes, category, categorizationRules]);

  const applySuggestion = () => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setSuggestedCategory(null);
      setIsAddingCustom(false);
      
      // Check if we should prompt to save this as a rule
      const hasRule = categorizationRules?.some((r: any) => 
        entity.toLowerCase().includes(r.keyword.toLowerCase()) || 
        r.keyword.toLowerCase().includes(entity.toLowerCase())
      );
      if (!hasRule) {
        setShowSaveRulePrompt(true);
      }
    }
  };

  const handleSaveRule = async () => {
    if (entity && category) {
      await addRule({
        keyword: entity,
        category: category,
        priority: 1
      });
      setShowSaveRulePrompt(false);
    }
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

  const handleAddCustomCategory = () => {
    if (newCustomCategory.trim() && !allCategories.includes(newCustomCategory.trim())) {
      const updated = [...customCategories, newCustomCategory.trim()];
      setCustomCategories(updated);
      localStorage.setItem('expense_custom_categories', JSON.stringify(updated));
      setCategory(newCustomCategory.trim());
      setNewCustomCategory('');
      setIsAddingCustom(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isFuel = category === 'Combustível';
      const selectedVeh = vehicles.find((v: any) => v.id === vehicleId);

      const litersVal = isFuel && liters ? parseFloat(liters) : 0;
      const kmVal = isFuel && kilometers ? parseInt(kilometers) : (selectedVeh?.kilometers || 0);

      const payload = {
        date,
        amount: parseFloat(amount),
        category,
        entity,
        method,
        recurring,
        notes,
        vehicle: isFuel,
        vehicleId: isFuel && vehicleId ? vehicleId : undefined,
        vehiclePlate: isFuel && selectedVeh ? selectedVeh.plate : undefined,
        vehicleName: isFuel && selectedVeh ? `${selectedVeh.brand} ${selectedVeh.model}` : undefined,
        liters: isFuel && liters ? litersVal : undefined,
        kilometers: isFuel && kilometers ? kmVal : undefined,
      };

      let savedExpense: any;
      if (initialData) {
        savedExpense = await updateExpense({ ...initialData, ...payload });
      } else {
        savedExpense = await addExpense(payload);
      }

      // Handle linkage to Viaturas / Combustível
      if (isFuel && vehicleId && savedExpense) {
        const amountVal = parseFloat(amount) || 0;
        const pricePerLiter = litersVal > 0 ? parseFloat((amountVal / litersVal).toFixed(3)) : 0;
        
        const fuelEntryId = initialData?.fuelEntryId || `fuel_exp_${savedExpense.id}`;

        const fuelEntryData = {
          id: fuelEntryId,
          expenseId: savedExpense.id,
          vehicleId: vehicleId,
          date: date,
          liters: litersVal,
          totalCost: amountVal,
          pricePerLiter: pricePerLiter,
          kilometers: kmVal,
          station: entity || 'Posto de Combustível'
        };

        const existingFuel = fuelEntries.find((f: any) => f.expenseId === savedExpense.id || f.id === fuelEntryId);
        if (existingFuel) {
          await updateFuelEntry({ ...existingFuel, ...fuelEntryData });
        } else {
          await addFuelEntry(fuelEntryData);
        }

        if (selectedVeh && kmVal > (selectedVeh.kilometers || 0)) {
          await updateVehicle({ ...selectedVeh, kilometers: kmVal });
        }
      } else if (initialData && (initialData.category === 'Combustível' || initialData.vehicleId)) {
        const existingFuel = fuelEntries.find((f: any) => f.expenseId === initialData.id || f.id === `fuel_exp_${initialData.id}`);
        if (existingFuel) {
          await deleteFuelEntry(existingFuel.id);
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to add/update expense', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-lg border-border my-8">
        <CardHeader className="relative pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl">Adicionar Despesa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data <span className="text-destructive">*</span></Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity">Entidade / Beneficiário <span className="text-destructive">*</span></Label>
              <Input 
                id="entity" 
                placeholder="Ex: Continente, Galp..."
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria <span className="text-destructive">*</span></Label>
                {!isAddingCustom ? (
                  <Select value={category} onValueChange={handleCategoryChange} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="new_custom">+ Adicionar Personalizada...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nova categoria" 
                      value={newCustomCategory}
                      onChange={(e) => setNewCustomCategory(e.target.value)}
                      autoFocus
                    />
                    <Button type="button" onClick={handleAddCustomCategory} size="icon" className="shrink-0" disabled={!newCustomCategory.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddingCustom(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {suggestedCategory && (
                  <div className="flex flex-col gap-2 mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Wand2 className="w-3 h-3" />
                      <span>Sugestão: <strong>{suggestedCategory}</strong></span>
                      <button type="button" onClick={applySuggestion} className="underline hover:text-primary/80 font-bold ml-1 uppercase tracking-tighter">Aplicar</button>
                    </div>
                  </div>
                )}

                {isAISuggesting && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground animate-pulse">
                    <Wand2 className="w-3 h-3 animate-spin" />
                    <span>A IA está a analisar o padrão...</span>
                  </div>
                )}

                {showSaveRulePrompt && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-bold text-emerald-700 leading-tight">
                      Deseja que o sistema aprenda esta categoria para futuras transações de "<span className="italic">{entity}</span>"?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={handleSaveRule}
                        className="text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Sim, criar regra
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowSaveRulePrompt(false)}
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Não agora
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Método de Pagamento</Label>
                <PaymentMethodSelector value={method} onChange={setMethod} id="method" />
              </div>
            </div>

            {category === 'Combustível' && (
              <div className="space-y-3 p-3.5 border border-amber-500/30 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 transition-all">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <Car className="w-4 h-4" /> Associar a Viatura & Abastecimento
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vehicleSelect" className="text-xs">Viatura <span className="text-destructive">*</span></Label>
                  {vehicles.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhuma viatura registada. Pode registar viaturas na página "Viaturas".
                    </p>
                  ) : (
                    <Select value={vehicleId} onValueChange={setVehicleId}>
                      <SelectTrigger id="vehicleSelect" className="bg-background">
                        <SelectValue placeholder="Selecione a viatura..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.plate ? `${v.plate} - ` : ''}{v.brand} {v.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {vehicleId && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="fuelLiters" className="text-xs">Litros (opcional)</Label>
                      <Input 
                        id="fuelLiters" 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="Ex: 42.5" 
                        value={liters} 
                        onChange={(e) => setLiters(e.target.value)}
                        className="bg-background text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="fuelKm" className="text-xs">Quilometragem (km)</Label>
                      <Input 
                        id="fuelKm" 
                        type="number" 
                        placeholder={
                          vehicles.find((v: any) => v.id === vehicleId)?.kilometers 
                            ? `Atual: ${vehicles.find((v: any) => v.id === vehicleId)?.kilometers} km` 
                            : "Ex: 125000"
                        } 
                        value={kilometers} 
                        onChange={(e) => setKilometers(e.target.value)}
                        className="bg-background text-xs h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/30 mt-2">
              <div className="space-y-0.5">
                <Label className="text-sm">Despesa Recorrente</Label>
                <p className="text-xs text-muted-foreground">Repetir automaticamente todos os meses.</p>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionais (Opcional)</Label>
              <Input 
                id="notes" 
                placeholder="Ex: Almoço com cliente..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Anexo (Fatura/Recibo)</Label>
              <Input id="attachment" type="file" className="cursor-pointer" />
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'A guardar...' : (initialData ? 'Guardar Alterações' : 'Guardar Despesa')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
