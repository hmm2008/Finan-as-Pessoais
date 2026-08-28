import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useExpenses, useIncomes } from '../hooks/queries';
import { usePrivacy } from '../contexts';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Calendar, 
  CalendarDays, 
  Database, 
  RotateCcw, 
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../components/layout';
import { UtilitariosMensal, UtilitariosAnual, UtilitariosBackup } from '../components/utilitarios';

type ReportType = 'mensal' | 'anual' | 'backup';
type ExportFormat = 'pdf' | 'json' | 'excel';

export default function UtilitariosView() {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { maskValue } = usePrivacy();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<ReportType>('mensal');

  // Month selector for Monthly Report
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const current = new Date().toISOString().substring(0, 7);
    monthsSet.add(current);

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

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths[0] || '2026-08';
  });

  // Year selector for Annual Report
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    yearsSet.add(currentYear);
    yearsSet.add('2026');

    expenses.forEach((e: any) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 4) {
        yearsSet.add(e.date.substring(0, 4));
      }
    });

    incomes.forEach((i: any) => {
      if (i.date && typeof i.date === 'string' && i.date.length >= 4) {
        yearsSet.add(i.date.substring(0, 4));
      }
    });

    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return availableYears[0] || '2026';
  });

  // Export Formats
  const [monthlyFormat, setMonthlyFormat] = useState<ExportFormat>('pdf');
  const [annualFormat, setAnnualFormat] = useState<ExportFormat>('pdf');

  // UI status
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // ----------------------------------------------------
  // Computations for Monthly Data
  // ----------------------------------------------------
  const monthlyData = useMemo(() => {
    const filteredExpenses = expenses.filter((e: any) => e.date && e.date.startsWith(selectedMonth));
    const filteredIncomes = incomes.filter((i: any) => i.date && i.date.startsWith(selectedMonth));

    const totalIncomes = filteredIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const balance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? (balance / totalIncomes) * 100 : 0;

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

    // All transactions combined
    const allTransactions = [
      ...filteredExpenses.map(e => ({ ...e, type: 'expense' })),
      ...filteredIncomes.map(i => ({ ...i, type: 'income' }))
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const [year, month] = selectedMonth.split('-');
    const monthDate = new Date(Number(year), Number(month) - 1, 15);
    const monthName = monthDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    return {
      monthKey: selectedMonth,
      monthName,
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

  // ----------------------------------------------------
  // Computations for Annual Data
  // ----------------------------------------------------
  const annualData = useMemo(() => {
    const filteredExpenses = expenses.filter((e: any) => e.date && e.date.startsWith(selectedYear));
    const filteredIncomes = incomes.filter((i: any) => i.date && i.date.startsWith(selectedYear));

    const totalIncomes = filteredIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const balance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? (balance / totalIncomes) * 100 : 0;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthsBreakdown = Array.from({ length: 12 }, (_, index) => {
      const mStr = String(index + 1).padStart(2, '0');
      const monthPrefix = `${selectedYear}-${mStr}`;
      
      const mExpenses = filteredExpenses.filter((e: any) => e.date && e.date.startsWith(monthPrefix));
      const mIncomes = filteredIncomes.filter((i: any) => i.date && i.date.startsWith(monthPrefix));

      const expTotal = mExpenses.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const incTotal = mIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const bal = incTotal - expTotal;
      const savRate = incTotal > 0 ? (bal / incTotal) * 100 : 0;

      return {
        monthIndex: index + 1,
        monthCode: monthPrefix,
        name: monthNames[index],
        incomes: incTotal,
        expenses: expTotal,
        balance: bal,
        savingsRate: savRate,
        txCount: mExpenses.length + mIncomes.length
      };
    });

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

    const allTransactions = [
      ...filteredExpenses.map(e => ({ ...e, type: 'expense' })),
      ...filteredIncomes.map(i => ({ ...i, type: 'income' }))
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return {
      year: selectedYear,
      filteredExpenses,
      filteredIncomes,
      totalIncomes,
      totalExpenses,
      balance,
      savingsRate,
      monthsBreakdown,
      expensesByCategory,
      allTransactions
    };
  }, [expenses, incomes, selectedYear]);

  // ----------------------------------------------------
  // Export Handlers
  // ----------------------------------------------------
  const handleDownloadMonthly = () => {
    if (monthlyFormat === 'json') {
      const payload = {
        title: `Relatório Mensal de Gestão Financeira - ${monthlyData.monthName}`,
        periodo: monthlyData.monthKey,
        dataEmissao: new Date().toISOString(),
        utilizador: 'Manuel Francisco',
        resumo: {
          totalReceitas: monthlyData.totalIncomes,
          totalDespesas: monthlyData.totalExpenses,
          saldo: monthlyData.balance,
          taxaPoupancaPercentual: Number(monthlyData.savingsRate.toFixed(2))
        },
        despesasPorCategoria: monthlyData.expensesByCategory,
        receitasPorCategoria: monthlyData.incomesByCategory,
        transacoes: monthlyData.allTransactions
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Mensal_${monthlyData.monthKey}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Ficheiro JSON de ${monthlyData.monthName} descarregado com sucesso.`);
    } else if (monthlyFormat === 'excel') {
      const wb = XLSX.utils.book_new();

      const resumoRows = [
        { Item: 'Período', Valor: monthlyData.monthName },
        { Item: 'Total Receitas (€)', Valor: monthlyData.totalIncomes },
        { Item: 'Total Despesas (€)', Valor: monthlyData.totalExpenses },
        { Item: 'Saldo Mensal (€)', Valor: monthlyData.balance },
        { Item: 'Taxa de Poupança (%)', Valor: `${monthlyData.savingsRate.toFixed(2)}%` },
        { Item: 'Total de Transações', Valor: monthlyData.allTransactions.length }
      ];
      const wsResumo = XLSX.utils.json_to_sheet(resumoRows);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Mensal');

      const expRows = monthlyData.allTransactions
        .filter(t => t.type === 'expense')
        .map(t => ({
          Data: t.date,
          Entidade: t.entity || t.description || 'Geral',
          Categoria: t.category || 'Geral',
          Método: t.method || t.paymentMethod || '',
          Notas: t.notes || '',
          'Valor (€)': Number(t.amount)
        }));
      const wsExp = XLSX.utils.json_to_sheet(expRows);
      XLSX.utils.book_append_sheet(wb, wsExp, 'Despesas');

      const incPunctualRows = monthlyData.allTransactions
        .filter(t => t.type === 'income' && !t.isFixed && !t.fixedIncomeId)
        .map(t => ({
          Data: t.date,
          Entidade: t.entity || t.description || 'Geral',
          Categoria: t.category || 'Geral',
          Método: t.method || '',
          Notas: t.notes || '',
          'Valor (€)': Number(t.amount)
        }));
      const wsIncPunctual = XLSX.utils.json_to_sheet(incPunctualRows);
      XLSX.utils.book_append_sheet(wb, wsIncPunctual, 'Receitas Pontuais');

      const incFixedRows = monthlyData.allTransactions
        .filter(t => t.type === 'income' && (t.isFixed || t.fixedIncomeId))
        .map(t => ({
          Data: t.date,
          Entidade: t.entity || t.description || 'Geral',
          Categoria: t.category || 'Geral',
          Método: t.method || '',
          Notas: t.notes || '',
          'Valor (€)': Number(t.amount)
        }));
      const wsIncFixed = XLSX.utils.json_to_sheet(incFixedRows);
      XLSX.utils.book_append_sheet(wb, wsIncFixed, 'Receitas Fixas Reg');

      const wsCat = XLSX.utils.json_to_sheet(monthlyData.expensesByCategory.map(c => ({
        Categoria: c.category,
        'Total Gasto (€)': c.amount,
        'Percentagem (%)': `${c.percentage.toFixed(1)}%`
      })));
      XLSX.utils.book_append_sheet(wb, wsCat, 'Categorias Despesa');

      XLSX.writeFile(wb, `Relatorio_Mensal_${monthlyData.monthKey}.xlsx`);
      showToast(`Ficheiro Excel de ${monthlyData.monthName} descarregado com sucesso.`);
    } else {
      window.print();
    }
  };

  const handleDownloadAnnual = () => {
    if (annualFormat === 'json') {
      const payload = {
        title: `Relatório Anual de Gestão Financeira - Ano ${annualData.year}`,
        ano: annualData.year,
        dataEmissao: new Date().toISOString(),
        utilizador: 'Manuel Francisco',
        resumoAnual: {
          totalReceitas: annualData.totalIncomes,
          totalDespesas: annualData.totalExpenses,
          saldoAcumulado: annualData.balance,
          taxaPoupancaAnualPercentual: Number(annualData.savingsRate.toFixed(2))
        },
        evolucaoMensal: annualData.monthsBreakdown,
        despesasPorCategoria: annualData.expensesByCategory,
        totalTransacoes: annualData.allTransactions.length,
        transacoes: annualData.allTransactions
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Anual_${annualData.year}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Ficheiro JSON Anual de ${annualData.year} descarregado com sucesso.`);
    } else if (annualFormat === 'excel') {
      const wb = XLSX.utils.book_new();

      const resumoRows = [
        { Item: 'Ano de Exercício', Valor: annualData.year },
        { Item: 'Total Receitas Anuais (€)', Valor: annualData.totalIncomes },
        { Item: 'Total Despesas Anuais (€)', Valor: annualData.totalExpenses },
        { Item: 'Saldo Acumulado (€)', Valor: annualData.balance },
        { Item: 'Taxa Poupança Anual (%)', Valor: `${annualData.savingsRate.toFixed(2)}%` },
        { Item: 'Total Movimentos no Ano', Valor: annualData.allTransactions.length }
      ];
      const wsResumo = XLSX.utils.json_to_sheet(resumoRows);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Anual');

      const mesesRows = annualData.monthsBreakdown.map(m => ({
        Mês: m.name,
        Código: m.monthCode,
        'Receitas (€)': m.incomes,
        'Despesas (€)': m.expenses,
        'Saldo (€)': m.balance,
        'Taxa Poupança (%)': `${m.savingsRate.toFixed(1)}%`,
        'Nº Movimentos': m.txCount
      }));
      const wsMeses = XLSX.utils.json_to_sheet(mesesRows);
      XLSX.utils.book_append_sheet(wb, wsMeses, 'Evolução Mensal');

      const expRows = annualData.allTransactions
        .filter(t => t.type === 'expense')
        .map(t => ({
          Data: t.date,
          Entidade: t.entity || t.description || 'Geral',
          Categoria: t.category || 'Geral',
          Método: t.method || t.paymentMethod || '',
          Notas: t.notes || '',
          'Valor (€)': Number(t.amount)
        }));
      const wsExp = XLSX.utils.json_to_sheet(expRows);
      XLSX.utils.book_append_sheet(wb, wsExp, 'Despesas');

      const incPunctualRows = annualData.allTransactions
        .filter(t => t.type === 'income' && !t.isFixed && !t.fixedIncomeId)
        .map(t => ({
          Data: t.date,
          Entidade: t.entity || t.description || 'Geral',
          Categoria: t.category || 'Geral',
          Método: t.method || '',
          Notas: t.notes || '',
          'Valor (€)': Number(t.amount)
        }));
      const wsIncPunctual = XLSX.utils.json_to_sheet(incPunctualRows);
      XLSX.utils.book_append_sheet(wb, wsIncPunctual, 'Receitas Pontuais');

      const incFixedRows = annualData.allTransactions
        .filter(t => t.type === 'income' && (t.isFixed || t.fixedIncomeId))
        .map(t => ({
          Data: t.date,
          Entidade: t.entity || t.description || 'Geral',
          Categoria: t.category || 'Geral',
          Método: t.method || '',
          Notas: t.notes || '',
          'Valor (€)': Number(t.amount)
        }));
      const wsIncFixed = XLSX.utils.json_to_sheet(incFixedRows);
      XLSX.utils.book_append_sheet(wb, wsIncFixed, 'Receitas Fixas Reg');

      XLSX.writeFile(wb, `Relatorio_Anual_${annualData.year}.xlsx`);
      showToast(`Ficheiro Excel Anual de ${annualData.year} descarregado com sucesso.`);
    } else {
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetSelections = () => {
    setSelectedMonth(availableMonths[0] || '2026-08');
    setSelectedYear(availableYears[0] || '2026');
    setMonthlyFormat('pdf');
    setAnnualFormat('pdf');
    showToast('Seleções repostas com sucesso.');
  };

  const jsonMonthlyPreviewString = useMemo(() => {
    return JSON.stringify({
      titulo: `Relatório Mensal - ${monthlyData.monthName}`,
      periodo: monthlyData.monthKey,
      emissao: new Date().toISOString().split('T')[0],
      totais: {
        receitas: monthlyData.totalIncomes,
        despesas: monthlyData.totalExpenses,
        saldo: monthlyData.balance,
        taxaPoupanca: `${monthlyData.savingsRate.toFixed(1)}%`
      },
      topDespesas: monthlyData.expensesByCategory.slice(0, 4),
      totalMovimentos: monthlyData.allTransactions.length,
      amostraTransacoes: monthlyData.allTransactions.slice(0, 5)
    }, null, 2);
  }, [monthlyData]);

  const jsonAnnualPreviewString = useMemo(() => {
    return JSON.stringify({
      titulo: `Relatório Anual - Ano ${annualData.year}`,
      exercicio: annualData.year,
      emissao: new Date().toISOString().split('T')[0],
      totaisAnuais: {
        receitasTotal: annualData.totalIncomes,
        despesasTotal: annualData.totalExpenses,
        saldoAcumulado: annualData.balance,
        taxaPoupancaMedia: `${annualData.savingsRate.toFixed(1)}%`
      },
      mesesAtivos: annualData.monthsBreakdown.filter(m => m.incomes > 0 || m.expenses > 0),
      topCategoriasAnuais: annualData.expensesByCategory.slice(0, 5),
      totalTransacoesAno: annualData.allTransactions.length
    }, null, 2);
  }, [annualData]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Notification */}
      {notification && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-border animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Screen Header (hidden in print) */}
      <PageHeader 
        className="no-print"
        title="Utilitários & Relatórios" 
        subtitle="Geração de relatórios mensais e anuais (PDF, JSON e Excel), cópias de segurança e gestão de dados"
      >
        {/* Global Reset */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetSelections} className="gap-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Repor
          </Button>
        </div>
      </PageHeader>

      {/* Primary Section Switcher Cards (no-print) */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('mensal')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
            activeTab === 'mensal'
              ? 'bg-primary/10 border-primary shadow-sm text-primary ring-1 ring-primary/20'
              : 'bg-card border-border hover:bg-muted/50 text-foreground'
          }`}
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${activeTab === 'mensal' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base">Relatório Mensal</span>
              {activeTab === 'mensal' && <Badge variant="secondary" className="text-[10px] h-4 px-1">Ativo</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Balanço por mês em PDF, JSON ou Excel com pré-visualização
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('anual')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
            activeTab === 'anual'
              ? 'bg-primary/10 border-primary shadow-sm text-primary ring-1 ring-primary/20'
              : 'bg-card border-border hover:bg-muted/50 text-foreground'
          }`}
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${activeTab === 'anual' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base">Relatório Anual</span>
              {activeTab === 'anual' && <Badge variant="secondary" className="text-[10px] h-4 px-1">Ativo</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consolidação de 12 meses, taxas de poupança e evolução anual
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
            activeTab === 'backup'
              ? 'bg-primary/10 border-primary shadow-sm text-primary ring-1 ring-primary/20'
              : 'bg-card border-border hover:bg-muted/50 text-foreground'
          }`}
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${activeTab === 'backup' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base">Backup & Restauro</span>
              {activeTab === 'backup' && <Badge variant="secondary" className="text-[10px] h-4 px-1">Ativo</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cópias de segurança JSON e restauro total do sistema
            </p>
          </div>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        {activeTab === 'mensal' && (
          <UtilitariosMensal 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            availableMonths={availableMonths}
            monthlyFormat={monthlyFormat}
            setMonthlyFormat={setMonthlyFormat}
            monthlyData={monthlyData}
            handleDownloadMonthly={handleDownloadMonthly}
            handlePrint={handlePrint}
            handleResetSelections={handleResetSelections}
            maskValue={maskValue}
            formatCurrency={formatCurrency}
            jsonMonthlyPreviewString={jsonMonthlyPreviewString}
            copiedCode={copiedCode}
            setCopiedCode={setCopiedCode}
          />
        )}

        {activeTab === 'anual' && (
          <UtilitariosAnual 
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
            annualFormat={annualFormat}
            setAnnualFormat={setAnnualFormat}
            annualData={annualData}
            handleDownloadAnnual={handleDownloadAnnual}
            handlePrint={handlePrint}
            handleResetSelections={handleResetSelections}
            maskValue={maskValue}
            formatCurrency={formatCurrency}
            jsonAnnualPreviewString={jsonAnnualPreviewString}
            copiedCode={copiedCode}
            setCopiedCode={setCopiedCode}
          />
        )}

        {activeTab === 'backup' && (
          <UtilitariosBackup 
            isRestoreOpen={isRestoreOpen}
            setIsRestoreOpen={setIsRestoreOpen}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
