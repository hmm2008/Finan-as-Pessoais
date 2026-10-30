import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  PiggyBank, 
  Info, 
  Save, 
  Calculator,
  Percent
} from 'lucide-react';
import { usePrivacy } from '../../contexts';
import { useExpenses, useAssets } from '../../hooks/queries';
import { scheduleSheetsBackgroundSync } from '../../lib/googleSheetsDataService';

export function PprTaxOptimizer() {
  const { maskValue } = usePrivacy();
  const { expenses } = useExpenses();
  const { assets } = useAssets();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Inputs
  const [ageCategory, setAgeCategory] = useState<'under_35' | 'between_35_50' | 'over_50'>('under_35');
  const [annualContributionInput, setAnnualContributionInput] = useState<number>(2000);
  const [isSaved, setIsSaved] = useState(false);

  // Detect current PPR contributions in logged expenses or PPR assets for current year
  const detectedPprContribution = useMemo(() => {
    let sum = 0;
    // Check PPR expenses
    expenses.forEach((e: any) => {
      const cat = (e.category || '').toLowerCase();
      const name = (e.name || e.description || '').toLowerCase();
      if (cat.includes('ppr') || cat.includes('investimento') || name.includes('ppr')) {
        sum += Number(e.amount) || 0;
      }
    });

    // Check PPR Assets
    assets.forEach((a: any) => {
      const subType = (a.subType || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      if (subType.includes('ppr') || name.includes('ppr')) {
        // If current value is higher than purchase value, difference is contribution
        const contrib = Number(a.purchaseValue) || Number(a.currentValue) || 0;
        if (contrib > 0 && sum === 0) sum += contrib;
      }
    });

    return sum;
  }, [expenses, assets]);

  // Tax rebate calculation rules according to Artigo 21.º do Estatuto dos Benefícios Fiscais (EBF)
  const taxRules = useMemo(() => {
    let maxContribution = 2000;
    let maxTaxCredit = 400;

    if (ageCategory === 'between_35_50') {
      maxContribution = 1750;
      maxTaxCredit = 350;
    } else if (ageCategory === 'over_50') {
      maxContribution = 1500;
      maxTaxCredit = 300;
    }

    const effectiveContrib = Math.min(annualContributionInput, maxContribution);
    const estimatedTaxCredit = effectiveContrib * 0.20; // 20% IRS deduction

    const remainingToMax = Math.max(0, maxContribution - annualContributionInput);

    return {
      maxContribution,
      maxTaxCredit,
      effectiveContrib,
      estimatedTaxCredit,
      remainingToMax
    };
  }, [ageCategory, annualContributionInput]);

  const handleSavePprSimulation = () => {
    try {
      const dataToSave = {
        id: 'ppr_' + Date.now(),
        ageCategory,
        annualContributionInput,
        estimatedTaxCredit: taxRules.estimatedTaxCredit,
        date: new Date().toISOString().slice(0, 10)
      };
      localStorage.setItem('fin_ppr_simulations', JSON.stringify(dataToSave));
      setIsSaved(true);
      scheduleSheetsBackgroundSync();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao guardar simulação PPR:', err);
    }
  };

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Otimizador de PPR & Benefício Fiscal em IRS (Art. 21.º EBF)
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  Dedução 20% no IRS
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Simule o abatimento fiscal máximo no IRS e a tributação reduzida sobre mais-valias (8% vs 28%).
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleSavePprSimulation} size="sm" className="gap-1.5 text-xs bg-primary">
            {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Guardado & Sincronizado' : 'Guardar Simulação PPR'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-secondary/30 p-4 rounded-xl border border-border">
          {/* Age Bracket */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Escalão de Idade do Subscritor</Label>
            <Select value={ageCategory} onValueChange={(v: any) => setAgeCategory(v)}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under_35">Idade &lt; 35 anos (Dedução Máx. 400 € / Contribuição 2.000 €)</SelectItem>
                <SelectItem value="between_35_50">Idade entre 35 e 50 anos (Dedução Máx. 350 € / Contribuição 1.750 €)</SelectItem>
                <SelectItem value="over_50">Idade &gt; 50 anos (Dedução Máx. 300 € / Contribuição 1.500 €)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Annual Contribution */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Contribuição Anual Planeada para PPR (€)</Label>
            <Input 
              type="number" 
              value={annualContributionInput} 
              onChange={e => setAnnualContributionInput(Number(e.target.value))} 
              className="h-9 text-xs font-mono bg-background font-bold text-primary" 
            />
          </div>
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tax Rebate in IRS */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Reembolso no IRS (20%)
            </span>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {maskValue(taxRules.estimatedTaxCredit)}
            </p>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
              Dedução à coleta obtida no reembolso do IRS
            </p>
          </div>

          {/* Max Contribution */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Teto Máximo do Escalão
            </span>
            <p className="text-2xl font-bold font-mono text-foreground">
              {maskValue(taxRules.maxContribution)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {taxRules.remainingToMax > 0 ? `Faltam ${maskValue(taxRules.remainingToMax)} para atingir o teto` : 'Teto de benefício atingido!'}
            </p>
          </div>

          {/* Capital Gains Advantage */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              IRS no Resgate (Reforma)
            </span>
            <p className="text-2xl font-bold font-mono text-primary">
              8.0% <span className="text-xs text-muted-foreground font-normal">(vs 28% padrão)</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Poupança de 20 pontos percentuais de IRS sobre os ganhos
            </p>
          </div>
        </div>

        {/* Informational Footer */}
        <div className="p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground flex items-center gap-2 border border-border">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>Dados sincronizados e registados automaticamente na folha <strong>PPR_IRS_Simulacoes</strong> no Google Sheets.</span>
        </div>
      </CardContent>
    </Card>
  );
}
