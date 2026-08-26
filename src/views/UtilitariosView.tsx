import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useExpenses, useIncomes } from '../hooks/queries';
import { usePrivacy } from '../contexts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  Calendar, 
  CalendarDays, 
  FileSpreadsheet, 
  Code2, 
  TrendingUp, 
  TrendingDown, 
  CircleDollarSign, 
  Award, 
  Check, 
  Copy, 
  Eye, 
  RotateCcw, 
  Database, 
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react';
import { BackupButton, ExcelBackupButton, RestoreBackupModal } from '../components/arquivo';

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
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Utilitários & Relatórios
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Geração de relatórios mensais e anuais (PDF, JSON e Excel), cópias de segurança e gestão de dados
          </p>
        </div>

        {/* Global Reset */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetSelections} className="gap-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Repor
          </Button>
        </div>
      </div>

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

      {/* ========================================================================= */}
      {/* 1. SEÇÃO RELATÓRIO MENSAL                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'mensal' && (
        <div className="space-y-6">
          
          {/* Controls Bar (no-print) */}
          <Card className="no-print border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Configuração do Relatório Mensal
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Escolha o mês e o formato pretendido. Utilize a pré-visualização antes de transferir ou imprimir.
                  </CardDescription>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    onClick={handlePrint}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 text-sm font-semibold"
                  >
                    <Printer className="w-4 h-4" /> Imprimir
                  </Button>

                  <Button 
                    onClick={handleDownloadMonthly}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" /> Transferir ({monthlyFormat.toUpperCase()})
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={handleResetSelections}
                    className="gap-1.5 h-9 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Month Picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Mês do Relatório:
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-background text-foreground text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto min-w-[200px]"
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

                    {/* Quick chips for prominent recent months */}
                    <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                      {['2026-08', '2026-07', '2026-06', '2026-05'].map(mCode => {
                        const [y, mn] = mCode.split('-');
                        const d = new Date(Number(y), Number(mn) - 1, 15);
                        const shortName = d.toLocaleDateString('pt-PT', { month: 'short' });
                        const isSel = selectedMonth === mCode;
                        return (
                          <button
                            key={mCode}
                            onClick={() => setSelectedMonth(mCode)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors capitalize ${
                              isSel
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            {shortName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Format Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Formato do Relatório:
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMonthlyFormat('pdf')}
                      className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                        monthlyFormat === 'pdf'
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-400 font-bold ring-1 ring-rose-500'
                          : 'bg-card border-border hover:bg-muted/50 text-foreground text-xs'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span className="text-xs">Formato PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonthlyFormat('json')}
                      className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                        monthlyFormat === 'json'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-400 font-bold ring-1 ring-amber-500'
                          : 'bg-card border-border hover:bg-muted/50 text-foreground text-xs'
                      }`}
                    >
                      <Code2 className="w-4 h-4 text-amber-600" />
                      <span className="text-xs">Formato JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonthlyFormat('excel')}
                      className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                        monthlyFormat === 'excel'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold ring-1 ring-emerald-500'
                          : 'bg-card border-border hover:bg-muted/50 text-foreground text-xs'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs">Formato Excel</span>
                    </button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* PREVIEW CONTAINER */}
          <div className="space-y-3">
            <div className="no-print flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Pré-visualização do Layout ({monthlyFormat.toUpperCase()}) — <span className="capitalize text-foreground">{monthlyData.monthName}</span>
                </h2>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {monthlyData.allTransactions.length} movimentos encontrados
              </Badge>
            </div>

            {/* FORMAT 1: PDF / PRINT LAYOUT (Standard A4 Paper Preview) */}
            {monthlyFormat === 'pdf' && (
              <div className="print-page max-w-[210mm] mx-auto p-8 sm:p-10 bg-white text-slate-900 min-h-[297mm] shadow-lg print:shadow-none print:p-0 my-2 print:my-0 rounded-xl print:rounded-none border border-slate-200 print:border-0 transition-all">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-6 h-6 text-indigo-600 print:text-black" />
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 print:text-black">Relatório Mensal</span>
                    </div>
                    <h1 className="text-3xl font-extrabold font-serif tracking-tight text-slate-900">Finanças Pessoais</h1>
                    <p className="text-slate-600 mt-1 text-sm font-medium">Período: <span className="capitalize text-slate-900 font-semibold">{monthlyData.monthName}</span></p>
                  </div>
                  <div className="text-right text-xs text-slate-500 space-y-0.5">
                    <p className="font-semibold text-slate-800">Utilizador: Manuel Francisco</p>
                    <p>Gerado em: {new Date().toLocaleDateString('pt-PT')}</p>
                  </div>
                </div>

                {/* 1. Resumo Financeiro */}
                <div className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <CircleDollarSign className="w-4 h-4 text-indigo-600 print:text-black" />
                    1. Resumo Financeiro do Mês
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Receitas</p>
                      <p className="text-lg font-bold mt-1 text-emerald-700 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {maskValue(monthlyData.totalIncomes, formatCurrency)}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Despesas</p>
                      <p className="text-lg font-bold mt-1 text-rose-700 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        {maskValue(monthlyData.totalExpenses, formatCurrency)}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Saldo do Mês</p>
                      <p className={`text-lg font-bold mt-1 ${monthlyData.balance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                        {maskValue(monthlyData.balance, formatCurrency)}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Taxa de Poupança</p>
                      <p className="text-lg font-bold mt-1 text-slate-800 flex items-center gap-1">
                        <Award className="w-4 h-4 text-amber-600 print:text-black" />
                        {monthlyData.savingsRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Distribuição de Categorias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {/* Despesas por Categoria */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                      2. Despesas por Categoria
                    </h2>
                    {monthlyData.expensesByCategory.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Sem despesas registadas neste mês.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {monthlyData.expensesByCategory.map(item => (
                          <div key={item.category} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-700">{item.category}</span>
                              <span className="text-slate-900 font-bold">{maskValue(item.amount, formatCurrency)} ({item.percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 border border-slate-200 h-2 rounded-full overflow-hidden">
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

                  {/* Receitas por Categoria */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                      3. Receitas por Categoria
                    </h2>
                    {monthlyData.incomesByCategory.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Sem receitas registadas neste mês.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {monthlyData.incomesByCategory.map(item => (
                          <div key={item.category} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-700">{item.category}</span>
                              <span className="text-slate-900 font-bold">{maskValue(item.amount, formatCurrency)} ({item.percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 border border-slate-200 h-2 rounded-full overflow-hidden">
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

                {/* 3. Tabela de Transações */}
                <div className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600 print:text-black" />
                    4. Registo Completo de Transações ({monthlyData.allTransactions.length})
                  </h2>
                  
                  {monthlyData.allTransactions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
                      Sem movimentos financeiros efetuados neste período.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs min-w-[600px]">
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
                              {t.type === 'expense' ? '-' : '+'}{maskValue(t.amount, formatCurrency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>

                {/* Footer Notes */}
                <div className="mt-10 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Gestão Financeira Pessoal — Controlo & Independência Financeira</p>
                  <p>Documento gerado para arquivo privado e fiscalização pessoal.</p>
                </div>

              </div>
            )}

            {/* FORMAT 2: JSON LIVE PREVIEW */}
            {monthlyFormat === 'json' && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-mono flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Code2 className="w-4 h-4" />
                      Estrutura JSON: Relatorio_Mensal_{monthlyData.monthKey}.json
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dados completos serializados em JSON padrão prontos para importação ou automações.
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(jsonMonthlyPreviewString);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copiado' : 'Copiar JSON'}
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
                    <code>{jsonMonthlyPreviewString}</code>
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* FORMAT 3: EXCEL LIVE SPREADSHEET PREVIEW */}
            {monthlyFormat === 'excel' && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    Folha de Cálculo Excel: Relatorio_Mensal_{monthlyData.monthKey}.xlsx
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Grelha estruturada com abas separadas de 'Resumo Mensal', 'Transações' e 'Categorias'.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  
                  <div className="border border-emerald-200 dark:border-emerald-950/40 rounded-lg overflow-hidden bg-background">
                    <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5"><TableIcon className="w-3.5 h-3.5" /> Aba: Transações ({monthlyData.monthName})</span>
                      <span className="text-[11px] opacity-90">{monthlyData.allTransactions.length} Linhas</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-emerald-50/70 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900/50 text-muted-foreground font-semibold">
                            <th className="py-2 px-3">Data</th>
                            <th className="py-2 px-3">Tipo</th>
                            <th className="py-2 px-3">Entidade / Descrição</th>
                            <th className="py-2 px-3">Categoria</th>
                            <th className="py-2 px-3">Método</th>
                            <th className="py-2 px-3 text-right">Valor (€)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.allTransactions.slice(0, 8).map((t) => (
                            <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 px-3 font-mono text-muted-foreground">{t.date}</td>
                              <td className="py-2 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.type === 'expense' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'}`}>
                                  {t.type === 'expense' ? 'Despesa' : 'Receita'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-medium text-foreground">{t.entity || t.description || 'Geral'}</td>
                              <td className="py-2 px-3 text-muted-foreground">{t.category || '-'}</td>
                              <td className="py-2 px-3 text-muted-foreground">{t.method || '-'}</td>
                              <td className={`py-2 px-3 text-right font-semibold ${t.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {t.type === 'expense' ? '-' : '+'}{maskValue(t.amount, formatCurrency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEÇÃO RELATÓRIO ANUAL                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'anual' && (
        <div className="space-y-6">
          
          {/* Controls Bar (no-print) */}
          <Card className="no-print border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Configuração do Relatório Anual
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Consolidação completa do ano com os 12 meses, taxas de poupança, categorias e transações.
                  </CardDescription>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    onClick={handlePrint}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 text-sm font-semibold"
                  >
                    <Printer className="w-4 h-4" /> Imprimir
                  </Button>

                  <Button 
                    onClick={handleDownloadAnnual}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" /> Transferir ({annualFormat.toUpperCase()})
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={handleResetSelections}
                    className="gap-1.5 h-9 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Year Picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" />
                    Ano de Exercício:
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="bg-background text-foreground text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto min-w-[160px]"
                    >
                      {availableYears.map(y => (
                        <option key={y} value={y}>
                          Ano {y}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                      {['2026', '2025', '2024'].map(yCode => {
                        const isSel = selectedYear === yCode;
                        return (
                          <button
                            key={yCode}
                            onClick={() => setSelectedYear(yCode)}
                            className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                              isSel
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            {yCode}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Format Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Formato do Relatório:
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAnnualFormat('pdf')}
                      className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                        annualFormat === 'pdf'
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-400 font-bold ring-1 ring-rose-500'
                          : 'bg-card border-border hover:bg-muted/50 text-foreground text-xs'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span className="text-xs">Formato PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnnualFormat('json')}
                      className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                        annualFormat === 'json'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-400 font-bold ring-1 ring-amber-500'
                          : 'bg-card border-border hover:bg-muted/50 text-foreground text-xs'
                      }`}
                    >
                      <Code2 className="w-4 h-4 text-amber-600" />
                      <span className="text-xs">Formato JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnnualFormat('excel')}
                      className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                        annualFormat === 'excel'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold ring-1 ring-emerald-500'
                          : 'bg-card border-border hover:bg-muted/50 text-foreground text-xs'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs">Formato Excel</span>
                    </button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* ANNUAL PREVIEW CONTAINER */}
          <div className="space-y-3">
            <div className="no-print flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Pré-visualização do Layout Anual ({annualFormat.toUpperCase()}) — Exercício {annualData.year}
                </h2>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {annualData.allTransactions.length} movimentos totais no ano
              </Badge>
            </div>

            {/* FORMAT 1: PDF ANNUAL LAYOUT */}
            {annualFormat === 'pdf' && (
              <div className="print-page max-w-[210mm] mx-auto p-8 sm:p-10 bg-white text-slate-900 min-h-[297mm] shadow-lg print:shadow-none print:p-0 my-2 print:my-0 rounded-xl print:rounded-none border border-slate-200 print:border-0 transition-all">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="w-6 h-6 text-indigo-600 print:text-black" />
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 print:text-black">Relatório Consolidado Anual</span>
                    </div>
                    <h1 className="text-3xl font-extrabold font-serif tracking-tight text-slate-900">Balanço do Exercício {annualData.year}</h1>
                    <p className="text-slate-600 mt-1 text-sm font-medium">Consolidação Anual: <span className="text-slate-900 font-semibold">12 Meses</span></p>
                  </div>
                  <div className="text-right text-xs text-slate-500 space-y-0.5">
                    <p className="font-semibold text-slate-800">Utilizador: Manuel Francisco</p>
                    <p>Gerado em: {new Date().toLocaleDateString('pt-PT')}</p>
                  </div>
                </div>

                {/* 1. Resumo Anual */}
                <div className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <CircleDollarSign className="w-4 h-4 text-indigo-600 print:text-black" />
                    1. Balanço Acumulado do Ano {annualData.year}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Receitas Anuais</p>
                      <p className="text-lg font-bold mt-1 text-emerald-700 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {maskValue(annualData.totalIncomes, formatCurrency)}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Despesas Anuais</p>
                      <p className="text-lg font-bold mt-1 text-rose-700 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        {maskValue(annualData.totalExpenses, formatCurrency)}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Saldo Anual Acumulado</p>
                      <p className={`text-lg font-bold mt-1 ${annualData.balance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                        {maskValue(annualData.balance, formatCurrency)}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Taxa Média Poupança</p>
                      <p className="text-lg font-bold mt-1 text-slate-800 flex items-center gap-1">
                        <Award className="w-4 h-4 text-amber-600 print:text-black" />
                        {annualData.savingsRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Tabela de Evolução Mês a Mês (12 Meses) */}
                <div className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4 text-indigo-600 print:text-black" />
                    2. Evolução Mensal Consolidada (Janeiro a Dezembro)
                  </h2>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <th className="py-2 px-3">Mês</th>
                          <th className="py-2 px-3 text-right">Receitas</th>
                          <th className="py-2 px-3 text-right">Despesas</th>
                          <th className="py-2 px-3 text-right">Saldo</th>
                          <th className="py-2 px-3 text-right">Taxa Poupança</th>
                          <th className="py-2 px-2 text-center">Movs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {annualData.monthsBreakdown.map((m) => {
                          const hasData = m.incomes > 0 || m.expenses > 0;
                          return (
                            <tr key={m.monthCode} className={`border-b border-slate-100 ${hasData ? 'hover:bg-slate-50' : 'opacity-40'}`}>
                              <td className="py-2 px-3 font-semibold text-slate-800">{m.name}</td>
                              <td className="py-2 px-3 text-right font-medium text-emerald-700">
                                {hasData ? maskValue(m.incomes, formatCurrency) : '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-rose-700">
                                {hasData ? maskValue(m.expenses, formatCurrency) : '—'}
                              </td>
                              <td className={`py-2 px-3 text-right font-bold ${m.balance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                                {hasData ? maskValue(m.balance, formatCurrency) : '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-slate-700">
                                {hasData ? `${m.savingsRate.toFixed(1)}%` : '—'}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px]">
                                {m.txCount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Top Categorias de Despesa do Ano */}
                <div className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-indigo-600 print:text-black" />
                    3. Principais Categorias de Despesa do Ano
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {annualData.expensesByCategory.slice(0, 6).map(item => (
                      <div key={item.category} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-800 font-semibold">{item.category}</span>
                          <span className="text-slate-900 font-bold">{maskValue(item.amount, formatCurrency)} ({item.percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 print:bg-slate-700 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-10 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Relatório Consolidado Anual de Gestão Financeira Pessoal</p>
                  <p>Documento gerado automaticamente para fins de balanço e arquivo privado.</p>
                </div>

              </div>
            )}

            {/* FORMAT 2: JSON ANNUAL PREVIEW */}
            {annualFormat === 'json' && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-mono flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Code2 className="w-4 h-4" />
                      Estrutura JSON: Relatorio_Anual_{annualData.year}.json
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Agregados anuais, evolução de 12 meses e transações do exercício.
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(jsonAnnualPreviewString);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copiado' : 'Copiar JSON'}
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
                    <code>{jsonAnnualPreviewString}</code>
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* FORMAT 3: EXCEL ANNUAL PREVIEW */}
            {annualFormat === 'excel' && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    Folha de Cálculo Excel: Relatorio_Anual_{annualData.year}.xlsx
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Abas com 'Resumo Anual', 'Evolução Mensal (12 Meses)' e 'Transações do Ano'.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  
                  <div className="border border-emerald-200 dark:border-emerald-950/40 rounded-lg overflow-hidden bg-background">
                    <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5"><TableIcon className="w-3.5 h-3.5" /> Aba: Evolução Mensal ({annualData.year})</span>
                      <span className="text-[11px] opacity-90">12 Linhas de Exercício</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-emerald-50/70 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900/50 text-muted-foreground font-semibold">
                            <th className="py-2 px-3">Mês</th>
                            <th className="py-2 px-3 text-right">Receitas (€)</th>
                            <th className="py-2 px-3 text-right">Despesas (€)</th>
                            <th className="py-2 px-3 text-right">Saldo (€)</th>
                            <th className="py-2 px-3 text-right">Taxa Poupança (%)</th>
                            <th className="py-2 px-3 text-center">Nº Movimentos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annualData.monthsBreakdown.map((m) => (
                            <tr key={m.monthCode} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 px-3 font-semibold text-foreground">{m.name}</td>
                              <td className="py-2 px-3 text-right font-medium text-emerald-600">{maskValue(m.incomes, formatCurrency)}</td>
                              <td className="py-2 px-3 text-right font-medium text-rose-600">{maskValue(m.expenses, formatCurrency)}</td>
                              <td className={`py-2 px-3 text-right font-bold ${m.balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                {maskValue(m.balance, formatCurrency)}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-muted-foreground">{m.savingsRate.toFixed(1)}%</td>
                              <td className="py-2 px-3 text-center text-muted-foreground font-mono">{m.txCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEÇÃO BACKUP & RESTAURO                                                */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Backup Box */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Database className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Criar Backup de Segurança (JSON)</CardTitle>
                <CardDescription className="text-xs">
                  Exporta uma cópia integral de todas as suas despesas, receitas, orçamentos, veículos e configurações para um único ficheiro JSON.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 text-muted-foreground border border-border">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Itens incluídos na cópia:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Todas as transações e movimentos de Finanças ({expenses.length + incomes.length} registos)</li>
                    <li>Orçamentos mensais e limites por categoria</li>
                    <li>Receitas fixas, despesas fixas e património</li>
                    <li>Histórico de veículos e metas de poupança</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <div className="flex-1">
                    <BackupButton onBackupCreated={() => showToast('Cópia de segurança JSON gerada com sucesso!')} />
                  </div>
                  <div className="flex-1">
                    <ExcelBackupButton onSuccess={() => showToast('Backup completo em Excel gerado com sucesso!')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Restore Box */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Restauro de Dados a Partir de Ficheiro</CardTitle>
                <CardDescription className="text-xs">
                  Importe um ficheiro de backup previamente exportado para recuperar dados ou sincronizar registos entre dispositivos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                  <p className="font-semibold mb-1">Aviso de Segurança:</p>
                  <p>O restauro de dados substitui os dados locais com as entidades do ficheiro carregado. É recomendável criar uma cópia prévia.</p>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => setIsRestoreOpen(true)}
                    variant="outline" 
                    className="w-full h-10 gap-2 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" /> Abrir Assistente de Restauro
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          <RestoreBackupModal 
            isOpen={isRestoreOpen}
            onClose={() => setIsRestoreOpen(false)}
            onRestoreComplete={(msg: string) => {
              setIsRestoreOpen(false);
              showToast(msg || 'Dados restaurados com sucesso a partir do backup!');
            }}
          />
        </div>
      )}

    </div>
  );
}
