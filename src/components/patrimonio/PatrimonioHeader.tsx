import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';
import { 
  Building2, Coins, TrendingUp, Info, Plus, Home, 
  Archive, Download, FileSpreadsheet 
} from 'lucide-react';

interface PatrimonioHeaderProps {
  assets: Asset[];
  activeTab: 'imovel' | 'financeiro';
  onTabChange: (tab: 'imovel' | 'financeiro') => void;
  onAddImovel: () => void;
  onAddFinanceiro: () => void;
}

export function PatrimonioHeader({
  assets,
  activeTab,
  onTabChange,
  onAddImovel,
  onAddFinanceiro
}: PatrimonioHeaderProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Filter assets based on activeTab or total
  const filteredAssets = assets.filter(a => a.category === activeTab);

  const totalCurrent = filteredAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalPurchase = filteredAssets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);
  const totalGainAbs = totalCurrent - totalPurchase;
  const totalGainPct = totalPurchase > 0 ? (totalGainAbs / totalPurchase) * 100 : 0;
  const isPositive = totalGainAbs >= 0;

  return (
    <div className="space-y-6">
      {/* Top Action & Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Património & Investimentos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestão de ativos e investimentos
          </p>
        </div>

        {/* Top Right Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === 'imovel' ? (
            <Button
              type="button"
              onClick={onAddImovel}
              className="rounded-xl h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Imóvel
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onAddFinanceiro}
              className="rounded-xl h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Ativo
            </Button>
          )}
        </div>
      </div>

      {/* 2 Tabs Toggle Group (Imóveis | Financeiro) */}
      <div className="bg-muted/60 dark:bg-muted/30 p-1 rounded-2xl inline-flex items-center gap-1 border border-border/40">
        <button
          type="button"
          onClick={() => onTabChange('imovel')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'imovel'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="w-4 h-4 text-indigo-500" />
          Imóveis
        </button>

        <button
          type="button"
          onClick={() => onTabChange('financeiro')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'financeiro'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Financeiro
        </button>
      </div>

      {/* KPI Cards Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Imóveis / Financeiros */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {activeTab === 'imovel' ? 'Imóveis' : 'Financeiros'}
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {maskValue(totalCurrent, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Investido */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Investido</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {maskValue(totalPurchase, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Mais-valias */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Mais-valias</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {isPositive ? '' : ''}{maskValue(totalGainAbs, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Rentabilidade */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Rentabilidade</p>
              <p className={`text-2xl font-bold tracking-tight ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              }`}>
                {isPositive ? '+' : ''}{totalGainPct.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
