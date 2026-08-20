import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Target, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Goal, GoalPriority } from './types';
import { usePin } from '../../contexts';

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  initialData?: Goal | null;
}

const CATEGORIES = [
  'Fundo de Emergência',
  'Viagem / Férias',
  'Imóvel / Habitação',
  'Veículo / Carro',
  'Investimentos / Reforma',
  'Educação / Cursos',
  'Outros Objetivos'
];

const PRIORITIES: GoalPriority[] = ['Baixa', 'Média', 'Alta'];

export function GoalForm({
  isOpen,
  onClose,
  onSave,
  initialData
}: GoalFormProps) {
  const { hasPin, verifyPin } = usePin();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<GoalPriority>('Média');
  const [monthlySavings, setMonthlySavings] = useState('');
  const [notes, setNotes] = useState('');

  // PIN Unlock state
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setTargetAmount(initialData.targetAmount ? initialData.targetAmount.toString() : '');
      setCurrentAmount(initialData.currentAmount ? initialData.currentAmount.toString() : '0');
      setDeadline(initialData.deadline || '');
      setCategory(initialData.category || CATEGORIES[0]);
      setPriority(initialData.priority || 'Média');
      setMonthlySavings(initialData.monthlySavings ? initialData.monthlySavings.toString() : '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline('');
      setCategory(CATEGORIES[0]);
      setPriority('Média');
      setMonthlySavings('');
      setNotes('');
    }
    setPinCode('');
    setPinError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify PIN if PIN protection is active
    if (hasPin) {
      if (!pinCode || pinCode.length !== 4) {
        setPinError('Introduza o PIN de 4 dígitos para confirmar.');
        return;
      }
      const isValid = await verifyPin(pinCode);
      if (!isValid) {
        setPinError('PIN incorreto. Ação bloqueada por segurança.');
        return;
      }
    }

    const targetVal = parseFloat(targetAmount) || 0;
    const currentVal = parseFloat(currentAmount) || 0;
    const monthlyVal = parseFloat(monthlySavings) || 0;

    const goalObj: Goal = {
      id: initialData ? initialData.id : `goal_${Date.now()}`,
      name: name.trim(),
      targetAmount: targetVal,
      currentAmount: currentVal,
      deadline: deadline || new Date().toISOString().split('T')[0],
      category,
      priority,
      monthlySavings: monthlyVal,
      notes: notes.trim() || undefined,
      completed: initialData ? initialData.completed : currentVal >= targetVal && targetVal > 0
    };

    onSave(goalObj);
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
            <Target className="w-5 h-5 text-primary" />
            {initialData ? 'Editar Objetivo Financeiro' : 'Criar Novo Objetivo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalName">Nome do Objetivo <span className="text-destructive">*</span></Label>
                <Input 
                  id="goalName" 
                  placeholder="Ex: Entrada para Casa, Fundo de Emergência" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalCategory">Categoria <span className="text-destructive">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="goalCategory">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Valor Alvo (€) <span className="text-destructive">*</span></Label>
                <Input 
                  id="targetAmount" 
                  type="number"
                  step="0.01"
                  placeholder="10000.00" 
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAmount">Valor Já Poupado (€)</Label>
                <Input 
                  id="currentAmount" 
                  type="number"
                  step="0.01"
                  placeholder="2500.00" 
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlySavings">Poupança Mensal (€)</Label>
                <Input 
                  id="monthlySavings" 
                  type="number"
                  step="0.01"
                  placeholder="250.00" 
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalDeadline">Data Limite / Prazo <span className="text-destructive">*</span></Label>
                <Input 
                  id="goalDeadline" 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalPriority">Nível de Prioridade <span className="text-destructive">*</span></Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as GoalPriority)}>
                  <SelectTrigger id="goalPriority">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalNotes">Notas / Estratégia</Label>
              <Input 
                id="goalNotes" 
                placeholder="Ex: Alocar 50% dos subsídios de férias..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* PIN Unlock Requirement (12.2) */}
            {hasPin && (
              <div className="p-3 border border-primary/30 rounded-lg bg-primary/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Confirmação com PIN Requerida</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    type="password"
                    maxLength={4}
                    placeholder="PIN (4 dígitos)"
                    value={pinCode}
                    onChange={(e) => {
                      setPinCode(e.target.value);
                      setPinError('');
                    }}
                    className="max-w-[160px] text-center tracking-widest text-base font-bold"
                  />
                  <span className="text-xs text-muted-foreground">
                    Insira o seu PIN de segurança para autorizar.
                  </span>
                </div>
                {pinError && (
                  <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">
                {initialData ? 'Atualizar Objetivo' : 'Guardar Objetivo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
