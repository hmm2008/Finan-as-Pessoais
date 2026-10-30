import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Calculator, 
  TrendingDown, 
  ShieldCheck, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Percent, 
  Clock, 
  Save, 
  Plus, 
  ArrowRight,
  Info
} from 'lucide-react';
import { usePrivacy } from '../../contexts';
import { useExpenses } from '../../hooks/queries';
import { scheduleSheetsBackgroundSync } from '../../lib/googleSheetsDataService';

export function MortgageAmortizationCalculator() {
  const { maskValue } = usePrivacy();
  const { addExpense } = useExpenses();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Inputs
  const [loanName, setLoanName] = useState('Crédito Habitação Principal');
  const [principal, setPrincipal] = useState<number>(150000);
  const [annualRate, setAnnualRate] = useState<number>(3.8); // Euribor + Spread
  const [termYears, setTermYears] = useState<number>(25);
  const [amortizationAmount, setAmortizationAmount] = useState<number>(10000);
  const [rateType, setRateType] = useState<'variable' | 'fixed'>('variable');
  const [amortizationMode, setAmortizationMode] = useState<'reduce_payment' | 'reduce_term'>('reduce_payment');
  const [isSaved, setIsSaved] = useState(false);

  // Math Calculations
  const calculationResults = useMemo(() => {
    const P = Math.max(0, principal);
    const r = Math.max(0, annualRate / 100 / 12); // monthly rate
    const n = Math.max(1, termYears * 12); // total months
    const A = Math.max(0, amortizationAmount);

    if (P <= 0 || n <= 0) {
      return {
        currentMonthlyPayment: 0,
        newMonthlyPayment: 0,
        monthlySavings: 0,
        totalCurrentInterest: 0,
        totalNewInterest: 0,
        totalInterestSaved: 0,
        commissionFee: 0,
        stampDuty: 0,
        totalCostOfAmortization: 0,
        monthsSaved: 0
      };
    }

    // Current Monthly Payment Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    let currentMonthlyPayment = 0;
    if (r > 0) {
      currentMonthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      currentMonthlyPayment = P / n;
    }

    const totalCurrentInterest = (currentMonthlyPayment * n) - P;

    // Remaining Principal after Amortization
    const newP = Math.max(0, P - A);

    let newMonthlyPayment = currentMonthlyPayment;
    let monthsSaved = 0;
    let totalNewInterest = 0;

    if (amortizationMode === 'reduce_payment') {
      // Keep same term n, recalculate monthly payment for newP
      if (r > 0 && newP > 0) {
        newMonthlyPayment = (newP * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      } else if (newP > 0) {
        newMonthlyPayment = newP / n;
      } else {
        newMonthlyPayment = 0;
      }
      totalNewInterest = (newMonthlyPayment * n) - newP;
    } else {
      // Reduce term: keep current monthly payment, calculate new number of months n_new
      // n_new = -log(1 - (r * newP) / M) / log(1 + r)
      newMonthlyPayment = currentMonthlyPayment;
      if (r > 0 && newP > 0) {
        const val = 1 - (r * newP) / currentMonthlyPayment;
        if (val > 0) {
          const newN = -Math.log(val) / Math.log(1 + r);
          monthsSaved = Math.max(0, Math.round(n - newN));
          totalNewInterest = (currentMonthlyPayment * newN) - newP;
        } else {
          totalNewInterest = 0;
        }
      } else {
        const newN = newP / currentMonthlyPayment;
        monthsSaved = Math.max(0, Math.round(n - newN));
        totalNewInterest = (currentMonthlyPayment * newN) - newP;
      }
    }

    const monthlySavings = Math.max(0, currentMonthlyPayment - newMonthlyPayment);
    const totalInterestSaved = Math.max(0, totalCurrentInterest - totalNewInterest);

    // Amortization Fee: Variable rate 0.5%, Fixed rate 2.0%
    const feeRate = rateType === 'variable' ? 0.005 : 0.02;
    const commissionFee = A * feeRate;
    const stampDuty = commissionFee * 0.04; // 4% Imposto do Selo
    const totalCostOfAmortization = A + commissionFee + stampDuty;

    return {
      currentMonthlyPayment,
      newMonthlyPayment,
      monthlySavings,
      totalCurrentInterest,
      totalNewInterest,
      totalInterestSaved,
      commissionFee,
      stampDuty,
      totalCostOfAmortization,
      monthsSaved
    };
  }, [principal, annualRate, termYears, amortizationAmount, rateType, amortizationMode]);

  const handleSaveSimulatedAmortization = () => {
    try {
      const existingRaw = localStorage.getItem('fin_mortgage_amortizations');
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      const newEntry = {
        id: 'amort_' + Date.now(),
        loanName,
        principal,
        amortizationAmount,
        annualRate,
        termYears,
        rateType,
        amortizationMode,
        newMonthlyPayment: calculationResults.newMonthlyPayment,
        totalInterestSaved: calculationResults.totalInterestSaved,
        commissionFee: calculationResults.commissionFee,
        date: new Date().toISOString().slice(0, 10)
      };
      const updated = [newEntry, ...list];
      localStorage.setItem('fin_mortgage_amortizations', JSON.stringify(updated));
      setIsSaved(true);
      scheduleSheetsBackgroundSync();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao guardar amortização:', err);
    }
  };

  const handleRegisterAsExpense = async () => {
    try {
      await addExpense({
        name: `Amortização de Crédito - ${loanName}`,
        description: `Amortização antecipada parcial de crédito habitação`,
        amount: calculationResults.totalCostOfAmortization,
        category: 'Empréstimos & Habitação',
        date: new Date().toISOString().slice(0, 10),
        entity: 'Banco / Instituição Financeira',
        method: 'Transferência Bancária',
        notes: `Poupança estimada de juros: ${formatter.format(calculationResults.totalInterestSaved)}`
      });
      alert('Despesa de amortização registada com sucesso nas Finanças!');
    } catch (err) {
      alert('Erro ao registar despesa.');
    }
  };

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Simulador de Amortização Antecipada de Crédito
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Habitação & Empréstimos
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Calcule a poupança exata em juros, a redução da prestação mensal e as comissões legais (0,5% ou 2%).
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleSaveSimulatedAmortization} size="sm" className="gap-1.5 text-xs bg-primary">
            {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Guardado & Sincronizado' : 'Guardar Simulação'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-secondary/30 p-4 rounded-xl border border-border">
          {/* Loan Name */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Nome do Empréstimo</Label>
            <Input 
              value={loanName} 
              onChange={e => setLoanName(e.target.value)} 
              className="h-9 text-xs bg-background" 
              placeholder="Ex: Crédito Habitação" 
            />
          </div>

          {/* Principal */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Capital Devedor Atual (€)</Label>
            <Input 
              type="number" 
              value={principal} 
              onChange={e => setPrincipal(Number(e.target.value))} 
              className="h-9 text-xs bg-background font-mono" 
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Taxa de Juro Anual / TAN (%)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={annualRate} 
              onChange={e => setAnnualRate(Number(e.target.value))} 
              className="h-9 text-xs bg-background font-mono" 
            />
          </div>

          {/* Remaining Term */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Prazo Restante (Anos)</Label>
            <Input 
              type="number" 
              value={termYears} 
              onChange={e => setTermYears(Number(e.target.value))} 
              className="h-9 text-xs bg-background font-mono" 
            />
          </div>

          {/* Amortization Amount */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-primary">Montante a Amortizar (€)</Label>
            <Input 
              type="number" 
              value={amortizationAmount} 
              onChange={e => setAmortizationAmount(Number(e.target.value))} 
              className="h-9 text-xs bg-background font-mono border-primary/50 font-bold" 
            />
          </div>

          {/* Rate Type */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Tipo de Taxa de Juro</Label>
            <Select value={rateType} onValueChange={(v: any) => setRateType(v)}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="variable">Taxa Variável (Comissão 0.5%)</SelectItem>
                <SelectItem value="fixed">Taxa Fixa (Comissão 2.0%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amortization Strategy */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-1 pt-1">
            <Label className="text-xs font-medium">Estratégia de Amortização</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAmortizationMode('reduce_payment')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  amortizationMode === 'reduce_payment' 
                    ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                    : 'border-border bg-background hover:bg-secondary/50'
                }`}
              >
                <p className="text-xs font-bold text-foreground">Reduzir Prestação Mensal</p>
                <p className="text-[11px] text-muted-foreground">Mapeia o mesmo prazo mas baixa o encargo financeiro mensal.</p>
              </button>

              <button
                type="button"
                onClick={() => setAmortizationMode('reduce_term')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  amortizationMode === 'reduce_term' 
                    ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                    : 'border-border bg-background hover:bg-secondary/50'
                }`}
              >
                <p className="text-xs font-bold text-foreground">Reduzir Prazo do Empréstimo</p>
                <p className="text-[11px] text-muted-foreground">Mantém a mesma prestação e encurta a duração total do crédito.</p>
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Box 1: New Monthly Payment */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Nova Prestação Mensal
            </span>
            <p className="text-xl font-bold font-mono text-foreground">
              {maskValue(calculationResults.newMonthlyPayment)}
            </p>
            {amortizationMode === 'reduce_payment' && calculationResults.monthlySavings > 0 && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                - {maskValue(calculationResults.monthlySavings)} / mês
              </p>
            )}
          </div>

          {/* Box 2: Total Interest Saved */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Poupança Total em Juros
            </span>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {maskValue(calculationResults.totalInterestSaved)}
            </p>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
              Lucro líquido ao longo do crédito
            </p>
          </div>

          {/* Box 3: Months Saved / Time Reduction */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Redução de Tempo
            </span>
            <p className="text-xl font-bold font-mono text-foreground">
              {amortizationMode === 'reduce_term' ? `${calculationResults.monthsSaved} meses` : 'Prazo Mantido'}
            </p>
            {amortizationMode === 'reduce_term' && calculationResults.monthsSaved > 0 && (
              <p className="text-[11px] font-semibold text-primary">
                ~{(calculationResults.monthsSaved / 12).toFixed(1)} anos antes
              </p>
            )}
          </div>

          {/* Box 4: Commission & Taxes */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Comissão + Imposto Selo
            </span>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {maskValue(calculationResults.commissionFee + calculationResults.stampDuty)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Comissão {rateType === 'variable' ? '0.5%' : '2.0%'} + 4% IS
            </p>
          </div>
        </div>

        {/* Action Button to Add as Expense */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>Sincronização automática com a folha <strong>Amortizacoes_Credito</strong> na Google Drive.</span>
          </div>

          <Button onClick={handleRegisterAsExpense} variant="outline" size="sm" className="gap-2 text-xs border-primary/40 hover:bg-primary/5">
            <Plus className="w-3.5 h-3.5 text-primary" /> Registar como Despesa no Mês
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
