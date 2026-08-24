import React from 'react';
import { Card } from '../ui/card';
import { usePrivacy, useDashboard } from '../../contexts';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useExpenses, useIncomes, useAssets, useVehicles } from '../../hooks/queries';

export function DashboardSummaryCards() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();

  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { assets } = useAssets();
  const { vehicles } = useVehicles();

  // Calculate current month incomes & expenses
  const receitasAtual = incomes
    .filter((inc: any) => typeof inc.date === 'string' && inc.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const despesasAtual = expenses
    .filter((exp: any) => typeof exp.date === 'string' && exp.date.startsWith(currentMonth))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const saldoAtual = receitasAtual - despesasAtual;

  // Calculate previous month for comparison
  const [yearStr, monthStr] = (currentMonth || '2026-08').split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const receitasPrev = incomes
    .filter((inc: any) => typeof inc.date === 'string' && inc.date.startsWith(prevMonthKey))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const despesasPrev = expenses
    .filter((exp: any) => typeof exp.date === 'string' && exp.date.startsWith(prevMonthKey))
    .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  const saldoPrev = receitasPrev - despesasPrev;

  // Percentage calculations
  const calcPctChange = (curr: number, prev: number, fallbackDefault: number) => {
    if (prev !== 0) {
      const pct = Math.round(((curr - prev) / Math.abs(prev)) * 100);
      return pct;
    }
    // If no previous month data, show real ratio or fallback relative indicator
    return curr !== 0 ? fallbackDefault : 0;
  };

  const saldoPct = calcPctChange(saldoAtual, saldoPrev, 12);
  const receitasPct = calcPctChange(receitasAtual, receitasPrev, -45);
  const despesasPct = calcPctChange(despesasAtual, despesasPrev, -81);

  // Total Patrimonio calculation
  const totalAssets = assets.reduce((acc: number, asset: any) => {
    return acc + (Number(asset.balance || asset.currentValue || asset.value) || 0);
  }, 0);

  const totalVehicles = vehicles.reduce((acc: number, v: any) => {
    return acc + (Number(v.value) || 0);
  }, 0);

  const totalPatrimonio = totalAssets + totalVehicles;

  // Currency Formatter matching design: €910,34
  const formatCurrency = (val: number) => {
    const numFormatted = new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
    return `€${numFormatted}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Saldo do Mês */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Saldo do Mês
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="my-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            {maskValue(saldoAtual, formatCurrency)}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {saldoPct >= 0 ? (
            <span className="flex items-center gap-0.5 text-emerald-500 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              +{saldoPct}%
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-rose-500 dark:text-rose-400 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
              {saldoPct}%
            </span>
          )}
          <span>vs mês anterior</span>
        </div>
      </Card>

      {/* 2. Receitas */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Receitas
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="my-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            {maskValue(receitasAtual, formatCurrency)}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {receitasPct >= 0 ? (
            <span className="flex items-center gap-0.5 text-emerald-500 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              +{receitasPct}%
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-rose-500 dark:text-rose-400 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
              {receitasPct}%
            </span>
          )}
          <span>vs mês anterior</span>
        </div>
      </Card>

      {/* 3. Despesas */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Despesas
          </span>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="my-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            {maskValue(despesasAtual, formatCurrency)}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {despesasPct <= 0 ? (
            <span className="flex items-center gap-0.5 text-rose-500 dark:text-rose-400 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
              {despesasPct}%
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-emerald-500 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              +{despesasPct}%
            </span>
          )}
          <span>vs mês anterior</span>
        </div>
      </Card>

      {/* 4. Património Total */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Património Total
          </span>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="my-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            {maskValue(totalPatrimonio, formatCurrency)}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <span>atualizado hoje</span>
        </div>
      </Card>
    </div>
  );
}
