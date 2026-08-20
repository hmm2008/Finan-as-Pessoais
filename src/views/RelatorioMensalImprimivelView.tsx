import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, useIncomes } from '../hooks/queries';
import { Button } from '../components/ui/button';
import { 
  Printer, 
  ArrowLeft, 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  FileText,
  Award,
  CircleDollarSign
} from 'lucide-react';

export default function RelatorioMensalImprimivelView() {
  const navigate = useNavigate();
  const { expenses, isLoading: loadingExpenses } = useExpenses();
  const { incomes, isLoading: loadingIncomes } = useIncomes();

  // Find all distinct months available in our records to populate the dropdown
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Default fallback to current month if nothing is present
    const currentMonth = new Date().toISOString().substring(0, 7);
    monthsSet.add(currentMonth);

    expenses.forEach((e: any) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 7) {
        monthsSet.add(e.date.substring(0, 7));
      }
    });

    incomes.forEach((i: any) => {
      if (i.date && typeof i.date === 'string' && i.date.length >= 7) {
        monthsSet.add(i.date.substring(0, 7));
      }
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes]);

  // Selected Month State (defaults to newest available month, which is typically the current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths[0] || new Date().toISOString().substring(0, 7);
  });

  // Filter and compute data for selected month
  const monthlyData = useMemo(() => {
    const filteredExpenses = expenses.filter((e: any) => e.date && e.date.startsWith(selectedMonth));
    const filteredIncomes = incomes.filter((i: any) => i.date && i.date.startsWith(selectedMonth));

    const totalIncomes = filteredIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const balance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? ((balance / totalIncomes) * 100) : 0;

    // Group Expenses by Category
    const expGroupMap: Record<string, number> = {};
    filteredExpenses.forEach((e: any) => {
      const cat = e.category || 'Outros';
      const amt = Number(e.amount) || 0;
      expGroupMap[cat] = (expGroupMap[cat] || 0) + amt;
    });

    const expensesByCategory = Object.entries(expGroupMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Group Incomes by Category
    const incGroupMap: Record<string, number> = {};
    filteredIncomes.forEach((i: any) => {
      const cat = i.category || 'Outros';
      const amt = Number(i.amount) || 0;
      incGroupMap[cat] = (incGroupMap[cat] || 0) + amt;
    });

    const incomesByCategory = Object.entries(incGroupMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalIncomes > 0 ? (amount / totalIncomes) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Combine and sort all transactions chronological/reverse-chronological for the table
    const allTransactions = [
      ...filteredExpenses.map(e => ({ ...e, type: 'expense' })),
      ...filteredIncomes.map(i => ({ ...i, type: 'income' }))
    ].sort((a, b) => b.date.localeCompare(a.date));

    return {
      filteredExpenses,
      filteredIncomes,
      totalIncomes,
      totalExpenses,
      balance,
      savingsRate,
      expensesByCategory,
      incomesByCategory,
      allTransactions
    };
  }, [expenses, incomes, selectedMonth]);

  // Format Helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // Human-readable Month Label
  const monthName = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 15);
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  if (loadingExpenses || loadingIncomes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-2 animate-pulse">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">A carregar registos financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900/10 dark:bg-black/20 text-foreground transition-colors duration-300">
      
      {/* 20.1: no-print controls wrapper - visible on screen, completely hidden during print */}
      <div className="no-print p-4 flex flex-col sm:flex-row gap-3 justify-between items-center bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div className="h-4 w-[1px] bg-border hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <LabelWithNoStyles className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período:</LabelWithNoStyles>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-secondary text-foreground text-sm rounded-lg border border-border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableMonths.map(m => {
                const [y, mn] = m.split('-');
                const d = new Date(Number(y), Number(mn) - 1, 15);
                const label = d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <Button onClick={handlePrint} className="bg-primary text-primary-foreground font-semibold hover:opacity-90 w-full sm:w-auto">
          <Printer className="w-4 h-4 mr-2" /> Imprimir Relatório
        </Button>
      </div>

      {/* 20.1: Printable Paper Section - optimized for physical A4 dimensions */}
      <div className="print-page max-w-[210mm] mx-auto p-8 bg-white text-slate-900 min-h-[297mm] shadow-lg print:shadow-none print:p-0 my-8 print:my-0 rounded-none border border-slate-200 print:border-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-6 h-6 text-indigo-600 print:text-black" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 print:text-black">Relatório de Gestão</span>
            </div>
            <h1 className="text-3xl font-extrabold font-serif tracking-tight text-slate-900">Finanças Pessoais</h1>
            <p className="text-slate-600 mt-1 text-sm font-medium">Período: <span className="capitalize text-slate-900 font-semibold">{monthName}</span></p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <p className="font-semibold text-slate-800">Utilizador: Manuel Francisco</p>
            <p>Gerado em: {new Date().toLocaleDateString('pt-PT')}</p>
          </div>
        </div>

        {/* 1. Resumo Financeiro */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
            <CircleDollarSign className="w-4 h-4 text-indigo-600 print:text-black" />
            1. Resumo Financeiro do Mês
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Receitas</p>
              <p className="text-lg font-bold mt-1 text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {formatCurrency(monthlyData.totalIncomes)}
              </p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Despesas</p>
              <p className="text-lg font-bold mt-1 text-rose-700 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                {formatCurrency(monthlyData.totalExpenses)}
              </p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Saldo Mensal</p>
              <p className={`text-lg font-bold mt-1 ${monthlyData.balance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                {formatCurrency(monthlyData.balance)}
              </p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Taxa de Poupança</p>
              <p className="text-lg font-bold mt-1 text-slate-800 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-600 print:text-black" />
                {monthlyData.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* 2. Distribuição de Categorias (Visual Vector Graphs) */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          
          {/* Expenses by Category */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
              2. Despesas por Categoria
            </h2>
            {monthlyData.expensesByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Nenhuma despesa registada neste mês.</p>
            ) : (
              <div className="space-y-3">
                {monthlyData.expensesByCategory.map(item => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.category}</span>
                      <span className="text-slate-900 font-bold">{formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)</span>
                    </div>
                    {/* Native high-contrast print vector bars */}
                    <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 print:bg-slate-700 h-full rounded-full"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incomes by Category */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
              3. Receitas por Categoria
            </h2>
            {monthlyData.incomesByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Nenhuma receita registada neste mês.</p>
            ) : (
              <div className="space-y-3">
                {monthlyData.incomesByCategory.map(item => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.category}</span>
                      <span className="text-slate-900 font-bold">{formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)</span>
                    </div>
                    {/* Native vector bars */}
                    <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 print:bg-slate-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 3. Detalhe dos Movimentos */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600 print:text-black" />
            4. Registo Completo de Transações ({monthlyData.allTransactions.length})
          </h2>
          
          {monthlyData.allTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
              Sem movimentos financeiros efetuados neste período.
            </p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-900 text-slate-700 font-bold">
                  <th className="py-2 px-1">Data</th>
                  <th className="py-2 px-1">Entidade / Descrição</th>
                  <th className="py-2 px-1">Categoria</th>
                  <th className="py-2 px-1">Método</th>
                  <th className="py-2 px-1 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.allTransactions.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-2 px-1 whitespace-nowrap text-slate-600">
                      {t.date ? new Date(t.date).toLocaleDateString('pt-PT') : '-'}
                    </td>
                    <td className="py-2 px-1">
                      <p className="font-semibold text-slate-800">{t.entity || t.description || 'Geral'}</p>
                      {t.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{t.notes}</p>}
                    </td>
                    <td className="py-2 px-1 text-slate-600">{t.category || '-'}</td>
                    <td className="py-2 px-1 text-slate-500">{t.method || '-'}</td>
                    <td className={`py-2 px-1 text-right font-bold ${t.type === 'expense' ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Notes */}
        <div className="mt-12 pt-5 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Gestão Financeira Pessoal — Controlo & Independência Financeira</p>
          <p>Este extrato foi consolidado via base de dados local segura e processado em conformidade com as normas contabilísticas de uso privado.</p>
        </div>

      </div>
    </div>
  );
}

// Minimalist Label fallback wrapper
function LabelWithNoStyles({ children, className, ...props }: any) {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}
