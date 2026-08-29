import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { X, ChevronLeft, ChevronRight, Calendar, CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';
import { useDashboard } from '../../contexts';
import { useExpenses, useFixedExpenses, useIncomes, useFixedIncomes, sanitizeForFirestore } from '../../hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../../lib/firebase';
import { scheduleSheetsBackgroundSync } from '../../lib/googleSheetsDataService';
import { doc, setDoc } from 'firebase/firestore';

interface RegisterMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function RegisterMonthModal({ isOpen, onClose }: RegisterMonthModalProps) {
  const { currentMonth, setCurrentMonth } = useDashboard();
  const queryClient = useQueryClient();

  const { expenses, addExpense } = useExpenses();
  const { fixedExpenses } = useFixedExpenses();
  const { incomes, addIncome } = useIncomes();
  const { fixedIncomes } = useFixedIncomes();

  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (currentMonth) {
      const y = parseInt(currentMonth.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  });

  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    if (currentMonth) return [currentMonth];
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return [`${now.getFullYear()}-${mm}`];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ countExp: number; countInc: number; months: string[] } | null>(null);

  // Determine active fixed expenses and active fixed incomes
  const activeFixedExpenses = useMemo(() => {
    return (fixedExpenses || []).filter((fe: any) => fe.active !== false);
  }, [fixedExpenses]);

  const activeFixedIncomes = useMemo(() => {
    return (fixedIncomes || []).filter((fi: any) => fi.active !== false);
  }, [fixedIncomes]);

  // Determine which months already have prepared/launched transactions
  const preparedMonthsSet = useMemo(() => {
    const set = new Set<string>();

    // Check stored explicit prepared months
    try {
      const stored = localStorage.getItem('fin_prepared_months');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((m: string) => set.add(m));
        }
      }
    } catch {
      // ignore
    }

    // Check expenses with recurring flag or existing months with historical data
    (expenses || []).forEach((e: any) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 7) {
        const m = e.date.substring(0, 7);
        if (e.recurring || e.id?.startsWith('exp_prep') || e.id?.startsWith('exp_fixed') || e.id?.startsWith('exp_jul') || e.id?.startsWith('exp_jun') || e.id?.startsWith('exp_may')) {
          set.add(m);
        }
      }
    });

    // Check incomes with recurring flag
    (incomes || []).forEach((i: any) => {
      if (i.date && typeof i.date === 'string' && i.date.length >= 7) {
        const m = i.date.substring(0, 7);
        if (i.recurring || i.id?.startsWith('inc_prep') || i.id?.startsWith('inc_fixed') || i.id?.startsWith('inc_jul') || i.id?.startsWith('inc_jun') || i.id?.startsWith('inc_may')) {
          set.add(m);
        }
      }
    });

    return set;
  }, [expenses, incomes]);

  if (!isOpen) return null;

  const handlePrevYear = () => setCurrentYear(y => y - 1);
  const handleNextYear = () => setCurrentYear(y => y + 1);

  const toggleMonth = (monthKey: string) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthKey)) {
        return prev.filter(m => m !== monthKey);
      } else {
        return [...prev, monthKey];
      }
    });
  };

  const handlePrepare = async () => {
    if (selectedMonths.length === 0) return;

    setIsProcessing(true);
    setSuccessInfo(null);

    try {
      const user = auth.currentUser;
      let totalNewExpenses = 0;
      let totalNewIncomes = 0;

      // 1. Read existing from localStorage
      const rawExp = localStorage.getItem('fin_expenses');
      const existingExpenses: any[] = rawExp ? JSON.parse(rawExp) : [];

      const rawInc = localStorage.getItem('fin_incomes');
      const existingPunctualIncomes: any[] = rawInc ? JSON.parse(rawInc) : [];
      
      const rawIncFixed = localStorage.getItem('fin_incomes_fixed_realized');
      const existingFixedIncomes: any[] = rawIncFixed ? JSON.parse(rawIncFixed) : [];
      
      const existingIncomes = [...existingPunctualIncomes, ...existingFixedIncomes];

      const newlyAddedExpenses: any[] = [];
      const newlyAddedIncomes: any[] = [];

      selectedMonths.forEach(monthKey => {
        const [yStr, mStr] = monthKey.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        const maxDays = new Date(y, m, 0).getDate();

        // 1. Process active fixed expenses for this month
        activeFixedExpenses.forEach((fe: any) => {
          const day = Math.min(maxDays, Math.max(1, Number(fe.dueDay || fe.day || 1)));
          const dateStr = `${yStr}-${mStr.padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entityName = fe.entity || fe.description || fe.name || 'Despesa Fixa';
          const amount = Number(fe.amount) || 0;

          // Duplicate check
          const isDuplicate = existingExpenses.some((e: any) => {
            const sameMonth = e.date && e.date.startsWith(monthKey);
            const sameEntity = (e.entity || '').toLowerCase().trim() === entityName.toLowerCase().trim();
            const sameAmount = Math.abs((Number(e.amount) || 0) - amount) < 0.01;
            return sameMonth && sameEntity && sameAmount;
          }) || newlyAddedExpenses.some((e: any) => {
            return e.date && e.date.startsWith(monthKey) && e.entity === entityName && Math.abs(e.amount - amount) < 0.01;
          });

          if (!isDuplicate) {
            const newExp = {
              id: `exp_fixed_${monthKey}_${fe.id || Math.random().toString(36).substring(2, 8)}`,
              amount,
              category: fe.category || 'Outros',
              date: dateStr,
              entity: entityName,
              method: fe.method || 'Débito Direto',
              notes: fe.notes || 'Lançamento automático de despesa fixa',
              recurring: true,
              vehicle: !!fe.vehicle,
              fixedExpenseId: fe.id
            };
            newlyAddedExpenses.push(newExp);
            totalNewExpenses++;
          }
        });

        // 2. Process active fixed incomes for this month
        activeFixedIncomes.forEach((fi: any) => {
          let day = Math.min(maxDays, Math.max(1, Number(fi.dueDateDay || fi.dueDay || 1)));
          let dateStr = `${yStr}-${mStr.padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          if (fi.exactDate && fi.frequency !== 'Mensal') {
            if (!fi.exactDate.startsWith(monthKey)) {
              return; // Skip if exact date doesn't match this month
            }
            dateStr = fi.exactDate;
          }

          const entityName = fi.entity || fi.name || 'Receita Fixa';
          const amount = Number(fi.amount) || 0;

          // Duplicate check
          const isDuplicate = existingIncomes.some((i: any) => {
            const sameMonth = i.date && i.date.startsWith(monthKey);
            const sameEntity = (i.entity || '').toLowerCase().trim() === entityName.toLowerCase().trim();
            const sameAmount = Math.abs((Number(i.amount) || 0) - amount) < 0.01;
            return sameMonth && sameEntity && sameAmount;
          }) || newlyAddedIncomes.some((i: any) => {
            return i.date && i.date.startsWith(monthKey) && i.entity === entityName && Math.abs(i.amount - amount) < 0.01;
          });

          if (!isDuplicate) {
            const newInc = {
              id: `inc_fixed_${monthKey}_${fi.id || Math.random().toString(36).substring(2, 8)}`,
              amount,
              category: fi.category || 'Outros',
              date: dateStr,
              entity: entityName,
              method: fi.method || 'Transferência Bancária',
              notes: fi.notes || 'Lançamento automático de receita fixa',
              recurring: true,
              fixedIncomeId: fi.id
            };
            newlyAddedIncomes.push(newInc);
            totalNewIncomes++;
          }
        });
      });

      // Save new items using hooks
      for (const exp of newlyAddedExpenses) {
        await addExpense(exp);
      }
      for (const inc of newlyAddedIncomes) {
        await addIncome(inc);
      }

      // Mark months as prepared in storage
      try {
        const rawPrep = localStorage.getItem('fin_prepared_months');
        const prepArr: string[] = rawPrep ? JSON.parse(rawPrep) : [];
        selectedMonths.forEach(m => {
          if (!prepArr.includes(m)) prepArr.push(m);
        });
        localStorage.setItem('fin_prepared_months', JSON.stringify(prepArr));
      } catch {
        // ignore
      }

      // Switch active dashboard month to the last prepared month
      if (selectedMonths.length > 0) {
        setCurrentMonth(selectedMonths[selectedMonths.length - 1]);
      }

      // Invalidate queries to refresh charts and widgets
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });

      setSuccessInfo({
        countExp: totalNewExpenses,
        countInc: totalNewIncomes,
        months: selectedMonths
      });

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Erro ao preparar meses:', err);
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      
      <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-slate-900 dark:text-slate-100 flex flex-col">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-primary dark:text-primary/80 flex items-center justify-center shrink-0 shadow-xs">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Preparar Meses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Meses a cinzento já estão preparados
            </p>
          </div>
        </div>

        {/* Year Navigator (< 2026 >) */}
        <div className="flex items-center justify-center gap-6 my-2">
          <button 
            onClick={handlePrevYear}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Ano anterior"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {currentYear}
          </span>
          <button 
            onClick={handleNextYear}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Ano seguinte"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-4 gap-2.5 my-3.5">
          {MONTH_NAMES_SHORT.map((monthName, idx) => {
            const mStr = String(idx + 1).padStart(2, '0');
            const monthKey = `${currentYear}-${mStr}`;
            const isPrepared = preparedMonthsSet.has(monthKey);
            const isSelected = selectedMonths.includes(monthKey);

            if (isSelected) {
              // Selected state (blue filled button)
              return (
                <button
                  key={monthKey}
                  type="button"
                  onClick={() => toggleMonth(monthKey)}
                  className="py-2.5 px-1 bg-primary text-white rounded-xl text-sm font-semibold shadow-xs transition-transform active:scale-95 border border-indigo-600 flex items-center justify-center cursor-pointer"
                >
                  {monthName}
                </button>
              );
            }

            if (isPrepared) {
              // Greyed out / already prepared state (matching mockup)
              return (
                <button
                  key={monthKey}
                  type="button"
                  onClick={() => toggleMonth(monthKey)}
                  title="Mês já preparado (clique para selecionar novamente se desejar relançar)"
                  className="py-2.5 px-1 bg-slate-100/90 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800/50 rounded-xl text-sm font-medium transition-all hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center cursor-pointer opacity-80"
                >
                  <span className="line-through decoration-slate-300 dark:decoration-slate-600">{monthName}</span>
                </button>
              );
            }

            // Normal available month button
            return (
              <button
                key={monthKey}
                type="button"
                onClick={() => toggleMonth(monthKey)}
                className="py-2.5 px-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm font-medium transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
              >
                {monthName}
              </button>
            );
          })}
        </div>

        {/* Informational Box */}
        <div className="bg-slate-50/90 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-1.5 my-2.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>Despesas fixas mensais ativas ({activeFixedExpenses.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Receitas recorrentes do mês anterior ({activeFixedIncomes.length})</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-4 mt-0.5">
            Duplicados ignorados automaticamente.
          </p>
        </div>

        {/* Success message banner during confirmation */}
        {successInfo && (
          <div className="mb-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successInfo.countExp} despesas e {successInfo.countInc} receitas lançadas com sucesso!</span>
          </div>
        )}

        {/* Footer Actions (Cancelar / Preparar (N)) */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={onClose}
            className="rounded-xl h-11 text-sm font-medium border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </Button>

          <Button 
            type="button"
            onClick={handlePrepare}
            disabled={selectedMonths.length === 0 || isProcessing}
            className="bg-primary hover:bg-indigo-700 text-white rounded-xl h-11 text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> A Lançar...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" /> Preparar ({selectedMonths.length})
              </>
            )}
          </Button>
        </div>

      </div>

    </div>
  );
}
