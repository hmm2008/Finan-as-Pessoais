import React from 'react';
import { Card } from '../ui/card';
import { PropertyExpense, PropertyIncome, Asset } from './types';
import { TrendingUp, TrendingDown, DollarSign, Euro, Calculator } from 'lucide-react';
import { usePrivacy } from '../../contexts';

interface PropertyFinancialSummaryProps {
  asset: Asset;
  expenses: PropertyExpense[];
  incomes: PropertyIncome[];
}

export function PropertyFinancialSummary({ asset, expenses, incomes }: PropertyFinancialSummaryProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const pExpenses = expenses.filter(e => e.assetId === asset.id);
  const pIncomes = incomes.filter(i => i.assetId === asset.id);

  // Monthly Calculations
  const monthlyExpenses = pExpenses.reduce((sum, e) => {
    const freq = (e.frequency || 'mensal').toLowerCase();
    if (freq === 'pontual') return sum;
    return sum + (
      freq === 'mensal' ? e.amount : 
      freq === 'trimestral' ? e.amount / 3 :
      freq === 'semestral' ? e.amount / 6 :
      e.amount / 12
    );
  }, 0);

  const monthlyIncomes = pIncomes.reduce((sum, i) => {
    const freq = (i.frequency || 'mensal').toLowerCase();
    if (freq === 'pontual') return sum;
    return sum + (
      freq === 'mensal' ? i.amount : 
      freq === 'trimestral' ? i.amount / 3 :
      freq === 'semestral' ? i.amount / 6 :
      i.amount / 12
    );
  }, 0);

  const monthlyProfit = monthlyIncomes - monthlyExpenses;

  // Annual Calculations (including pontual)
  const annualExpenses = pExpenses.reduce((sum, e) => {
    const amount = e.amount;
    const freq = (e.frequency || 'mensal').toLowerCase();
    if (freq === 'pontual') return sum + amount;
    return sum + (
      freq === 'mensal' ? amount * 12 : 
      freq === 'trimestral' ? amount * 4 :
      freq === 'semestral' ? amount * 2 :
      amount
    );
  }, 0);

  const annualIncomes = pIncomes.reduce((sum, i) => {
    const amount = i.amount;
    const freq = (i.frequency || 'mensal').toLowerCase();
    if (freq === 'pontual') return sum + amount;
    return sum + (
      freq === 'mensal' ? amount * 12 : 
      freq === 'trimestral' ? amount * 4 :
      freq === 'semestral' ? amount * 2 :
      amount
    );
  }, 0);

  const annualProfit = annualIncomes - annualExpenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Monthly Summary */}
      <Card className="p-6 rounded-[2rem] border-none bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-80">Balanço Mensal</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Rendimentos</span>
            <span className="text-emerald-600">+{maskValue(monthlyIncomes, formatter.format)}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Gastos</span>
            <span className="text-rose-600">-{maskValue(monthlyExpenses, formatter.format)}</span>
          </div>
          <div className="pt-3 border-t border-indigo-500/20 flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Lucro Mensal</span>
            <span className={`text-2xl font-black tracking-tight ${monthlyProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {maskValue(monthlyProfit, formatter.format)}
            </span>
          </div>
        </div>
      </Card>

      {/* Annual Summary */}
      <Card className="p-6 rounded-[2rem] border-none bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 opacity-80">Balanço Anual</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Rendimentos</span>
            <span className="text-emerald-600">+{maskValue(annualIncomes, formatter.format)}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Gastos</span>
            <span className="text-rose-600">-{maskValue(annualExpenses, formatter.format)}</span>
          </div>
          <div className="pt-3 border-t border-violet-500/20 flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Lucro Anual</span>
            <span className={`text-2xl font-black tracking-tight ${annualProfit >= 0 ? 'text-violet-600' : 'text-rose-600'}`}>
              {maskValue(annualProfit, formatter.format)}
            </span>
          </div>
        </div>
      </Card>

      {/* Yield Performance (ROI) */}
      <Card className="p-6 rounded-[2rem] border-none bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 opacity-80">Performance Bruta</span>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rentabilidade Bruta</span>
              <span className="text-sm font-black text-amber-600">
                {asset.purchaseValue && asset.purchaseValue > 0 
                  ? ((annualIncomes / asset.purchaseValue) * 100).toFixed(2) + '%' 
                  : 'N/A'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500" 
                style={{ width: `${Math.min(Math.max((annualIncomes / (asset.purchaseValue || 1)) * 100 * 2, 0), 100)}%` }} 
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rentabilidade Líquida</span>
              <span className="text-sm font-black text-amber-600">
                {asset.purchaseValue && asset.purchaseValue > 0 
                  ? ((annualProfit / asset.purchaseValue) * 100).toFixed(2) + '%' 
                  : 'N/A'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500" 
                style={{ width: `${Math.min(Math.max((annualProfit / (asset.purchaseValue || 1)) * 100 * 2, 0), 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
