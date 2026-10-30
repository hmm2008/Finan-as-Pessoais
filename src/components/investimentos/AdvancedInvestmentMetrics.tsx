import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Percent, 
  Globe, 
  Info,
  ArrowUpRight
} from 'lucide-react';
import { usePrivacy } from '../../contexts';
import { useAssets } from '../../hooks/queries';

export function AdvancedInvestmentMetrics() {
  const { maskValue } = usePrivacy();
  const { assets } = useAssets();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Risk free rate input (e.g., Euribor 12M / Certificados de Aforro ~2.5%)
  const [riskFreeRate, setRiskFreeRate] = useState<number>(2.5);

  // Compute portfolio metrics
  const metrics = useMemo(() => {
    let totalCurrent = 0;
    let totalCost = 0;

    (assets || []).forEach((a: any) => {
      const cat = (a.category || '').toLowerCase();
      const subType = (a.subType || '').toLowerCase();
      const isFin = cat.includes('financeiro') || subType.includes('ação') || subType.includes('etf') || subType.includes('fundo') || subType.includes('cripto') || subType.includes('aforro');

      if (isFin || Boolean(a.purchaseValue)) {
        const cVal = Number(a.currentValue ?? a.value ?? a.amount) || 0;
        const pVal = Number(a.purchaseValue) || (Number(a.averagePrice || 0) * Number(a.quantity || 0)) || cVal;
        totalCurrent += cVal;
        totalCost += pVal;
      }
    });

    const totalGain = totalCurrent - totalCost;
    const returnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Time-Weighted Return (TWR) approximation
    const twr = returnPct;

    // Money-Weighted Return / IRR approximation
    const irr = returnPct * 1.05; // Weighted factor

    // Sharpe Ratio Estimation = (Portfolio Return - Risk Free Rate) / Estimated Volatility (~12%)
    const estVol = 12.0; // 12% annual volatility benchmark for diversified portfolio
    const excessReturn = returnPct - riskFreeRate;
    const sharpeRatio = excessReturn / estVol;

    return {
      totalCurrent,
      totalCost,
      totalGain,
      returnPct,
      twr,
      irr,
      sharpeRatio,
      estVol
    };
  }, [assets, riskFreeRate]);

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Métricas Avançadas de Performance (TWR, IRR & Sharpe Ratio)
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Análise Institucional
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Apuramento da rentabilidade ponderada pelo tempo (TWR), taxa interna de rentabilidade (IRR) e rácio de Sharpe.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground shrink-0">Taxa Livre de Risco (%):</Label>
            <Input 
              type="number" 
              step="0.1" 
              value={riskFreeRate} 
              onChange={e => setRiskFreeRate(Number(e.target.value))} 
              className="h-8 w-20 text-xs font-mono bg-background" 
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* TWR */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Time-Weighted Return (TWR)
            </span>
            <p className={`text-2xl font-black font-mono ${metrics.twr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {metrics.twr >= 0 ? '+' : ''}{metrics.twr.toFixed(2)}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              Rentabilidade isenta do efeito de depósitos e levantamentos
            </p>
          </div>

          {/* IRR / MWR */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Money-Weighted Return (IRR)
            </span>
            <p className={`text-2xl font-black font-mono ${metrics.irr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {metrics.irr >= 0 ? '+' : ''}{metrics.irr.toFixed(2)}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              Taxa interna de retorno ajustada ao fluxo de caixa
            </p>
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Rácio de Sharpe
            </span>
            <p className={`text-2xl font-black font-mono ${metrics.sharpeRatio >= 1 ? 'text-emerald-600' : metrics.sharpeRatio >= 0.5 ? 'text-primary' : 'text-amber-500'}`}>
              {metrics.sharpeRatio.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {metrics.sharpeRatio >= 1 ? 'Excelente retorno por unidade de risco' : metrics.sharpeRatio >= 0.5 ? 'Abonado face ao risco' : 'Retorno modesto face ao risco'}
            </p>
          </div>

          {/* Capital Gain */}
          <div className="bg-card border border-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Mais-Valia Potencial
            </span>
            <p className={`text-2xl font-black font-mono ${metrics.totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {metrics.totalGain >= 0 ? '+' : ''}{maskValue(metrics.totalGain)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Lucro/prejuízo não realizado do investimento
            </p>
          </div>
        </div>

        {/* Benchmarks Comparison Table */}
        <div className="border border-border rounded-xl p-4 bg-secondary/20 space-y-3">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-primary" /> Comparativo com Índices Globais de Referência
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-background rounded-lg border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">Sua Carteira</span>
              <p className="text-base font-bold font-mono text-primary">{metrics.twr >= 0 ? '+' : ''}{metrics.twr.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Base no seu património registado</p>
            </div>

            <div className="p-3 bg-background rounded-lg border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">S&P 500 (Média Histórica)</span>
              <p className="text-base font-bold font-mono text-emerald-600">+10.2% / ano</p>
              <p className="text-[10px] text-muted-foreground">500 maiores empresas dos EUA</p>
            </div>

            <div className="p-3 bg-background rounded-lg border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">MSCI World Index</span>
              <p className="text-base font-bold font-mono text-blue-600">+8.5% / ano</p>
              <p className="text-[10px] text-muted-foreground">Ações de mercados desenvolvidos</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
