import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';
import { 
  Building2, Coins, TrendingUp, TrendingDown, Home, Wallet, 
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface PatrimonioHeaderProps {
  assets: Asset[];
  activeTab: 'imovel' | 'financeiro';
  onTabChange: (tab: 'imovel' | 'financeiro') => void;
}

export function PatrimonioHeader({
  assets,
  activeTab,
  onTabChange
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

  const kpis = [
    {
      label: activeTab === 'imovel' ? 'Património Imobiliário' : 'Ativos Financeiros',
      value: totalCurrent,
      icon: activeTab === 'imovel' ? Home : Wallet,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500/10',
      description: 'Valor atual estimado'
    },
    {
      label: 'Capital Investido',
      value: totalPurchase,
      icon: Coins,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      description: 'Custo de aquisição'
    },
    {
      label: 'Mais-valias Totais',
      value: totalGainAbs,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-emerald-600' : 'text-rose-600',
      bgColor: isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      description: 'Variação absoluta'
    },
    {
      label: 'Rentabilidade Média',
      value: totalGainPct,
      isPercentage: true,
      icon: Activity,
      color: isPositive ? 'text-emerald-600' : 'text-rose-600',
      bgColor: isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      description: 'Performance percentual'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 2 Tabs Toggle Group (Imóveis | Financeiro) */}
      <div className="flex justify-center sm:justify-start">
        <div className="bg-muted/60 dark:bg-muted/30 p-1.5 rounded-2xl inline-flex items-center gap-1.5 border border-border/40 shadow-inner">
          <button
            type="button"
            onClick={() => onTabChange('imovel')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-300 ${
              activeTab === 'imovel'
                ? 'bg-background text-indigo-600 shadow-md scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'imovel' ? 'animate-pulse' : ''}`} />
            Imóveis
          </button>

          <button
            type="button"
            onClick={() => onTabChange('financeiro')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-300 ${
              activeTab === 'financeiro'
                ? 'bg-background text-indigo-600 shadow-md scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'financeiro' ? 'animate-pulse' : ''}`} />
            Financeiro
          </button>
        </div>
      </div>

      {/* KPI Cards Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <Card className="group h-full border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative bg-card/50">
              <CardContent className="p-5 flex flex-col h-full relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl ${kpi.bgColor} ${kpi.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    {kpi.description}
                  </span>
                </div>
                
                <div className="mt-auto">
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wide leading-tight mb-1">
                    {kpi.label}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <p className={`text-xl sm:text-2xl font-black tracking-tight truncate tabular-nums ${kpi.color}`}>
                      {kpi.isPercentage 
                        ? `${isPositive ? '+' : ''}${kpi.value.toFixed(1)}%`
                        : maskValue(kpi.value, formatter.format)
                      }
                    </p>
                    {kpi.isPercentage && (
                      <div className={`flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </div>

                {/* Background Decoration Icon */}
                <div className={`absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500`}>
                  <kpi.icon className="w-24 h-24" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
