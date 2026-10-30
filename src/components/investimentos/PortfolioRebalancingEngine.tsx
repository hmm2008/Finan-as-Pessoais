import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  ArrowRightLeft, 
  DollarSign, 
  Save, 
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { usePrivacy } from '../../contexts';
import { useAssets } from '../../hooks/queries';
import { scheduleSheetsBackgroundSync } from '../../lib/googleSheetsDataService';

export interface AssetCategoryWeight {
  key: string;
  label: string;
  currentValue: number;
  currentPercent: number;
  targetPercent: number;
  targetValue: number;
  differenceValue: number;
  action: 'BUY' | 'SELL' | 'HOLD';
}

export function PortfolioRebalancingEngine() {
  const { maskValue } = usePrivacy();
  const { assets } = useAssets();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Default target allocation percentages (summing to 100%)
  const [targetAcoes, setTargetAcoes] = useState<number>(60);
  const [targetObrigacoes, setTargetObrigacoes] = useState<number>(20);
  const [targetImobiliario, setTargetImobiliario] = useState<number>(10);
  const [targetCripto, setTargetCripto] = useState<number>(5);
  const [targetLiquidez, setTargetLiquidez] = useState<number>(5);
  const [isSaved, setIsSaved] = useState(false);

  // Group assets into the 5 core asset classes
  const rebalanceData = useMemo(() => {
    let sumAcoes = 0;
    let sumObrigacoes = 0;
    let sumImobiliario = 0;
    let sumCripto = 0;
    let sumLiquidez = 0;

    (assets || []).forEach((a: any) => {
      const val = Number(a.currentValue ?? a.value ?? a.amount) || 0;
      const cat = (a.category || '').toLowerCase();
      const subType = (a.subType || '').toLowerCase();

      if (cat.includes('imovel') || cat.includes('imóvel') || subType.includes('reit') || subType.includes('imob')) {
        sumImobiliario += val;
      } else if (cat.includes('cripto') || subType.includes('bitcoin') || subType.includes('crypto')) {
        sumCripto += val;
      } else if (subType.includes('obrig') || subType.includes('bond') || subType.includes('tesouro')) {
        sumObrigacoes += val;
      } else if (subType.includes('aforro') || subType.includes('depósito') || subType.includes('deposito') || subType.includes('liquidez') || subType.includes('cash')) {
        sumLiquidez += val;
      } else {
        // Default to Equity / Ações & ETFs
        sumAcoes += val;
      }
    });

    const totalPortfolioValue = sumAcoes + sumObrigacoes + sumImobiliario + sumCripto + sumLiquidez;

    const buildClassData = (
      key: string, 
      label: string, 
      currentVal: number, 
      targetPct: number
    ): AssetCategoryWeight => {
      const currentPct = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0;
      const targetVal = totalPortfolioValue * (targetPct / 100);
      const diffVal = targetVal - currentVal;
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      if (diffVal > 20) action = 'BUY';
      else if (diffVal < -20) action = 'SELL';

      return {
        key,
        label,
        currentValue: currentVal,
        currentPercent: currentPct,
        targetPercent: targetPct,
        targetValue: targetVal,
        differenceValue: diffVal,
        action
      };
    };

    const classes: AssetCategoryWeight[] = [
      buildClassData('acoes', 'Ações & ETFs Globais', sumAcoes, targetAcoes),
      buildClassData('obrigacoes', 'Obrigações & Renda Fixa', sumObrigacoes, targetObrigacoes),
      buildClassData('imobiliario', 'Imobiliário & REITs', sumImobiliario, targetImobiliario),
      buildClassData('cripto', 'Criptoativos & Alternativos', sumCripto, targetCripto),
      buildClassData('liquidez', 'Liquidez & Certificados', sumLiquidez, targetLiquidez),
    ];

    const totalTargetPercent = targetAcoes + targetObrigacoes + targetImobiliario + targetCripto + targetLiquidez;

    return {
      totalPortfolioValue,
      totalTargetPercent,
      classes
    };
  }, [assets, targetAcoes, targetObrigacoes, targetImobiliario, targetCripto, targetLiquidez]);

  const handleSaveRebalanceTargets = () => {
    try {
      const dataToSave = {
        targetAcoes,
        targetObrigacoes,
        targetImobiliario,
        targetCripto,
        targetLiquidez,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('fin_rebalancing_targets', JSON.stringify(dataToSave));
      setIsSaved(true);
      scheduleSheetsBackgroundSync();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao guardar metas de rebalanceamento:', err);
    }
  };

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Motor de Rebalanceamento da Carteira (Asset Allocation)
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Target Allocation
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Defina as percentagens alvo por classe de ativo e obtenha ordens exatas de compra/venda para reequilibrar a carteira.
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleSaveRebalanceTargets} size="sm" className="gap-1.5 text-xs bg-primary">
            {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Guardado & Sincronizado' : 'Guardar Percentagens Alvo'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Total Portfolio Value Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-secondary/30 rounded-xl border border-border">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
              Valor Total do Património / Carteira
            </span>
            <p className="text-2xl font-black font-mono text-foreground mt-0.5">
              {maskValue(rebalanceData.totalPortfolioValue)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Soma dos Alvos:</span>
            <Badge 
              variant="outline" 
              className={`text-xs font-bold px-2.5 py-1 ${
                Math.abs(rebalanceData.totalTargetPercent - 100) < 0.1 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
              }`}
            >
              {rebalanceData.totalTargetPercent}% {Math.abs(rebalanceData.totalTargetPercent - 100) >= 0.1 && '(Deve somar 100%)'}
            </Badge>
          </div>
        </div>

        {/* Target Allocation Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-card border border-border p-4 rounded-xl">
          {/* Ações */}
          <div className="space-y-1.5 p-2 bg-secondary/20 rounded-lg">
            <Label className="text-[11px] font-bold text-foreground block">1. Ações & ETFs (%)</Label>
            <Input 
              type="number" 
              value={targetAcoes} 
              onChange={e => setTargetAcoes(Number(e.target.value))} 
              className="h-8 text-xs font-mono bg-background" 
            />
          </div>

          {/* Obrigações */}
          <div className="space-y-1.5 p-2 bg-secondary/20 rounded-lg">
            <Label className="text-[11px] font-bold text-foreground block">2. Obrigações (%)</Label>
            <Input 
              type="number" 
              value={targetObrigacoes} 
              onChange={e => setTargetObrigacoes(Number(e.target.value))} 
              className="h-8 text-xs font-mono bg-background" 
            />
          </div>

          {/* Imobiliário */}
          <div className="space-y-1.5 p-2 bg-secondary/20 rounded-lg">
            <Label className="text-[11px] font-bold text-foreground block">3. Imobiliário (%)</Label>
            <Input 
              type="number" 
              value={targetImobiliario} 
              onChange={e => setTargetImobiliario(Number(e.target.value))} 
              className="h-8 text-xs font-mono bg-background" 
            />
          </div>

          {/* Cripto */}
          <div className="space-y-1.5 p-2 bg-secondary/20 rounded-lg">
            <Label className="text-[11px] font-bold text-foreground block">4. Cripto/Alternat. (%)</Label>
            <Input 
              type="number" 
              value={targetCripto} 
              onChange={e => setTargetCripto(Number(e.target.value))} 
              className="h-8 text-xs font-mono bg-background" 
            />
          </div>

          {/* Liquidez */}
          <div className="space-y-1.5 p-2 bg-secondary/20 rounded-lg">
            <Label className="text-[11px] font-bold text-foreground block">5. Liquidez (%)</Label>
            <Input 
              type="number" 
              value={targetLiquidez} 
              onChange={e => setTargetLiquidez(Number(e.target.value))} 
              className="h-8 text-xs font-mono bg-background" 
            />
          </div>
        </div>

        {/* Rebalancing Recommendation Table */}
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="text-[11px] font-semibold text-muted-foreground uppercase bg-secondary/80 border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Classe de Ativo</th>
                  <th className="px-4 py-2.5 text-right">Valor Atual (€)</th>
                  <th className="px-4 py-2.5 text-center">% Atual</th>
                  <th className="px-4 py-2.5 text-center">% Alvo</th>
                  <th className="px-4 py-2.5 text-right">Valor Alvo (€)</th>
                  <th className="px-4 py-2.5 text-right">Diferença (€)</th>
                  <th className="px-4 py-2.5 text-center">Ação Recomendada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {rebalanceData.classes.map((cls) => (
                  <tr key={cls.key} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground">{cls.label}</td>
                    <td className="px-4 py-3 text-right font-mono">{maskValue(cls.currentValue)}</td>
                    <td className="px-4 py-3 text-center font-mono">{cls.currentPercent.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-primary">{cls.targetPercent}%</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{maskValue(cls.targetValue)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${
                      cls.differenceValue > 0 ? 'text-emerald-600 dark:text-emerald-400' : cls.differenceValue < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                    }`}>
                      {cls.differenceValue > 0 ? `+${maskValue(cls.differenceValue)}` : maskValue(cls.differenceValue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cls.action === 'BUY' ? (
                        <Badge variant="outline" className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                          <ArrowUpRight className="w-3 h-3" /> COMPRAR {maskValue(cls.differenceValue)}
                        </Badge>
                      ) : cls.action === 'SELL' ? (
                        <Badge variant="outline" className="px-2.5 py-1 text-[10px] font-bold bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
                          <ArrowDownRight className="w-3 h-3" /> VENDER {maskValue(Math.abs(cls.differenceValue))}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="px-2.5 py-1 text-[10px]">
                          MANTER (Equilibrado)
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground flex items-center gap-2 border border-border">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>Sincronizado automaticamente com a folha <strong>Investimentos_Rebalanceamento</strong> no Google Sheets.</span>
        </div>
      </CardContent>
    </Card>
  );
}
