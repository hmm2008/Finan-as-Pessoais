import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { base44Client, Investment } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export function InvestmentsView() {
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    base44Client.getInvestments().then(setInvestments);
  }, []);

  const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
  const avgReturns = investments.reduce((sum, inv) => sum + inv.returns, 0) / (investments.length || 1);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stock': return 'Ações';
      case 'crypto': return 'Criptomoedas';
      case 'bond': return 'Obrigações';
      case 'real_estate': return 'Imobiliário';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Investimentos</h2>
          <p className="text-muted-foreground text-sm">Monitorização do seu portfólio de ativos.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary border-none text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-tight text-primary-foreground/80">Valor do Portfólio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-tight text-muted-foreground">Retorno Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold flex items-center gap-2 ${avgReturns >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              {avgReturns > 0 ? '+' : ''}{avgReturns.toFixed(2)}%
              {avgReturns >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h4 className="font-bold text-slate-200">Ativos</h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investments.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm sm:text-base">{inv.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">{getTypeLabel(inv.type)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(inv.value)}
                  </div>
                  <div className={`text-sm font-bold ${inv.returns >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {inv.returns > 0 ? '+' : ''}{inv.returns}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
