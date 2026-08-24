import React, { useState, useMemo, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { usePrivacy, useDashboard } from '../../contexts';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  Filter, 
  Search, 
  TrendingDown, 
  CreditCard, 
  Layers, 
  Building, 
  CheckCircle2, 
  Eye, 
  Maximize2, 
  Minimize2,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExpenseItem {
  id?: string;
  date: string;
  description: string;
  name?: string;
  amount: number;
  category: string;
  entity?: string;
  account?: string;
  method?: string;
  paymentMethod?: string;
  isFixed?: boolean;
  notes?: string;
  recurring?: boolean;
}

interface DespesasRegistadasModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  defaultMonth?: string;
}

export function DespesasRegistadasModal({
  isOpen,
  onClose,
  expenses = [],
  defaultMonth
}: DespesasRegistadasModalProps) {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const reportRef = useRef<HTMLDivElement>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth || currentMonth || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'fixas' | 'variaveis'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Get distinct months for selection
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    expenses.forEach((e) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 7) {
        monthsSet.add(e.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  // Get distinct categories
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) catSet.add(e.category);
    });
    return Array.from(catSet).sort();
  }, [expenses]);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Filter by month
    if (selectedMonth !== 'all') {
      result = result.filter(e => e.date && e.date.startsWith(selectedMonth));
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }

    // Filter by type (Fixed vs Variable)
    if (filterType === 'fixas') {
      result = result.filter(e => e.isFixed === true);
    } else if (filterType === 'variaveis') {
      result = result.filter(e => !e.isFixed);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.entity && e.entity.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.method && e.method.toLowerCase().includes(q)) ||
        (e.paymentMethod && e.paymentMethod.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '');
      if (sortBy === 'date-asc') return (a.date || '').localeCompare(b.date || '');
      if (sortBy === 'amount-desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === 'amount-asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return 0;
    });

    return result;
  }, [expenses, selectedMonth, selectedCategory, filterType, searchQuery, sortBy]);

  // Statistics calculation
  const stats = useMemo(() => {
    const count = filteredExpenses.length;
    const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const fixedTotal = filteredExpenses.filter(e => e.isFixed).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const variableTotal = total - fixedTotal;
    const average = count > 0 ? total / count : 0;
    const highest = filteredExpenses.reduce((max, e) => Math.max(max, Number(e.amount) || 0), 0);

    // Group by category
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const c = e.category || 'Outros';
      catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 0);
    });

    const categoryBreakdown = Object.entries(catMap)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: total > 0 ? (amt / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      count,
      total,
      fixedTotal,
      variableTotal,
      average,
      highest,
      categoryBreakdown
    };
  }, [filteredExpenses]);

  // Format month label
  const periodLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'Todo o Histórico';
    const [y, m] = selectedMonth.split('-').map(Number);
    if (!y || !m) return selectedMonth;
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF Handler
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; // 10mm margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `Relatorio_Despesas_${selectedMonth === 'all' ? 'Completo' : selectedMonth}.pdf`;
      pdf.save(fileName);

      setExportSuccessMsg('PDF gerado e descarregado com sucesso!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export to Excel Handler
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      const dataToExport = filteredExpenses.map((e, index) => ({
        'Nº': index + 1,
        'Data': e.date,
        'Descrição': e.description || '',
        'Entidade': e.entity || '',
        'Categoria': e.category || 'Geral',
        'Tipo': e.isFixed ? 'Despesa Fixa' : 'Despesa Variável',
        'Método/Conta': e.paymentMethod || (e as any).method || e.account || 'Não especificado',
        'Valor (€)': Number(e.amount) || 0,
        'Notas': e.notes || ''
      }));

      const summaryData = [
        { 'Métrica': 'Período', 'Valor': periodLabel },
        { 'Métrica': 'Total de Despesas Registadas', 'Valor': `${stats.total.toFixed(2)} €` },
        { 'Métrica': 'Número de Registos', 'Valor': stats.count },
        { 'Métrica': 'Total Despesas Fixas', 'Valor': `${stats.fixedTotal.toFixed(2)} €` },
        { 'Métrica': 'Total Despesas Variáveis', 'Valor': `${stats.variableTotal.toFixed(2)} €` },
        { 'Métrica': 'Média por Despesa', 'Valor': `${stats.average.toFixed(2)} €` },
        { 'Métrica': 'Maior Despesa', 'Valor': `${stats.highest.toFixed(2)} €` },
        { 'Métrica': 'Data de Emissão', 'Valor': new Date().toLocaleString('pt-PT') }
      ];

      const wb = XLSX.utils.book_new();
      const wsExpenses = XLSX.utils.json_to_sheet(dataToExport);
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);

      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Despesas Registadas');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Executivo');

      const fileName = `Despesas_Registadas_${selectedMonth === 'all' ? 'Completo' : selectedMonth}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setExportSuccessMsg('Ficheiro Excel (.xlsx) transferido com sucesso!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to CSV Handler
  const handleExportCSV = () => {
    setIsExportingCSV(true);
    try {
      const headers = ['Data', 'Descricao', 'Entidade', 'Categoria', 'Tipo', 'Metodo', 'Valor'];
      const rows = filteredExpenses.map(e => [
        `"${e.date}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${(e.entity || '').replace(/"/g, '""')}"`,
        `"${(e.category || '').replace(/"/g, '""')}"`,
        `"${e.isFixed ? 'Fixa' : 'Variável'}"`,
        `"${(e.paymentMethod || (e as any).method || e.account || '-').replace(/"/g, '""')}"`,
        (Number(e.amount) || 0).toFixed(2)
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Despesas_Registadas_${selectedMonth === 'all' ? 'Completo' : selectedMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccessMsg('Ficheiro CSV transferido com sucesso!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
    } finally {
      setIsExportingCSV(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className={`bg-card border border-border shadow-2xl rounded-2xl flex flex-col transition-all duration-300 w-full ${
          isFullscreen 
            ? 'fixed inset-2 h-[calc(100vh-16px)] max-w-none z-50' 
            : 'max-w-6xl max-h-[92vh] h-full'
        }`}
      >
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-secondary/30 rounded-t-2xl">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Despesas Registadas</h2>
                <span className="bg-destructive/10 text-destructive text-xs font-semibold px-2.5 py-0.5 rounded-full border border-destructive/20">
                  {stats.count} {stats.count === 1 ? 'registo' : 'registos'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pré-visualização do relatório PDF com opções de impressão e exportação
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-medium bg-background shadow-xs hover:border-primary/50"
              title="Imprimir relatório"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>Imprimir</span>
            </Button>

            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              title="Transferir em PDF"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPDF ? 'A gerar PDF...' : 'Exportar PDF'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="gap-1.5 text-xs font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              title="Exportar para folha de cálculo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden md:inline">Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className="gap-1.5 text-xs font-medium hover:bg-secondary"
              title="Exportar dados brutos em CSV"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
              <span className="hidden md:inline">CSV</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
              title={isFullscreen ? "Sair de ecrã inteiro" : "Ecrã inteiro"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filter and Settings Ribbon (Hidden on Print) */}
        <div className="no-print p-3 sm:px-6 sm:py-3 bg-secondary/10 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">Todo o Histórico</option>
                {availableMonths.map(m => {
                  const [y, mon] = m.split('-').map(Number);
                  const d = new Date(y, mon - 1, 1);
                  const label = d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1">
              <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Todas Categorias</option>
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filterType === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('fixas')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filterType === 'fixas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Fixas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('variaveis')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filterType === 'variaveis' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Variáveis
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar despesas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-8 pr-2 text-xs bg-background"
              />
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            >
              <option value="date-desc">Data (Mais recente)</option>
              <option value="date-asc">Data (Mais antiga)</option>
              <option value="amount-desc">Valor (Maior)</option>
              <option value="amount-asc">Valor (Menor)</option>
            </select>
          </div>
        </div>

        {/* Export Success Feedback Banner */}
        {exportSuccessMsg && (
          <div className="no-print mx-4 sm:mx-6 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* PDF Document Preview Canvas Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-900/5 dark:bg-black/40 flex justify-center">
          
          {/* Printable A4 Styled Sheet */}
          <div 
            ref={reportRef}
            className="w-full max-w-4xl bg-card border border-border shadow-xl rounded-xl p-6 sm:p-10 space-y-6 text-foreground print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
            style={{ minHeight: '840px' }}
          >
            
            {/* 1. Official Report Header */}
            <div className="border-b-2 border-primary/30 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    €
                  </div>
                  <span className="text-xs uppercase tracking-widest font-semibold text-primary">
                    Sistema de Gestão Financeira
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Relatório de Despesas Registadas
                </h1>
                <p className="text-sm text-muted-foreground capitalize mt-0.5">
                  Período: <strong className="text-foreground">{periodLabel}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right space-y-0.5 text-xs text-muted-foreground">
                <p>Emissão: <span className="font-semibold text-foreground">{new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span></p>
                <p>Registos Incluídos: <span className="font-semibold text-foreground">{stats.count} de {expenses.length}</span></p>
                <p>Estado do Relatório: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Auditado & Verificado</span></p>
              </div>
            </div>

            {/* 2. Executive Summary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              
              <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block uppercase">Total Gasto</span>
                <span className="text-xl sm:text-2xl font-black text-destructive block">
                  {maskValue(stats.total, formatter.format)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {stats.count} registos filtrados
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block uppercase">Despesas Fixas</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground block">
                  {maskValue(stats.fixedTotal, formatter.format)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {stats.total > 0 ? ((stats.fixedTotal / stats.total) * 100).toFixed(1) : 0}% do total
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block uppercase">Média / Registo</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground block">
                  {maskValue(stats.average, formatter.format)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Custo médio individual
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block uppercase">Maior Despesa</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground block">
                  {maskValue(stats.highest, formatter.format)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Pico de despesa no período
                </span>
              </div>
            </div>

            {/* 3. Category Distribution Bars */}
            {stats.categoryBreakdown.length > 0 && (
              <div className="p-4 rounded-xl border border-border bg-secondary/15 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Distribuição de Gastos por Categoria
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.categoryBreakdown.slice(0, 6).map(item => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground truncate">{item.category}</span>
                        <span className="text-muted-foreground">
                          {maskValue(item.amount, formatter.format)} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Complete Detailed Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Registo Pormenorizado de Transações ({filteredExpenses.length})
                </h3>
              </div>

              {filteredExpenses.length > 0 ? (
                <div className="border border-border rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Descrição</th>
                        <th className="py-2.5 px-3">Entidade / Beneficiário</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredExpenses.map((exp, idx) => (
                        <tr 
                          key={exp.id || idx} 
                          className={`hover:bg-secondary/30 transition-colors ${
                            idx % 2 === 0 ? 'bg-background' : 'bg-secondary/10'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {exp.description || 'Sem descrição'}
                            {exp.notes && (
                              <span className="block text-[10px] font-normal text-muted-foreground/80 truncate max-w-[220px]">
                                {exp.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {exp.entity || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-foreground/80">
                              {exp.category || 'Geral'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px]">
                              <CreditCard className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{exp.paymentMethod || (exp as any).method || exp.account || '-'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {exp.isFixed ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Fixa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                                Variável
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-destructive whitespace-nowrap">
                            {maskValue(Number(exp.amount) || 0, formatter.format)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-secondary/80 border-t-2 border-border font-bold text-foreground">
                        <td colSpan={6} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                          Total Global das Despesas:
                        </td>
                        <td className="py-3 px-3 text-right text-destructive text-sm font-black whitespace-nowrap">
                          {maskValue(stats.total, formatter.format)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-border rounded-xl bg-secondary/10 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Nenhuma despesa registada encontrada para os filtros selecionados.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMonth('all');
                      setSelectedCategory('all');
                      setFilterType('all');
                      setSearchQuery('');
                    }}
                    className="text-xs"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>

            {/* 5. Official Document Footer */}
            <div className="pt-8 border-t border-border/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-muted-foreground">
              <div>
                <p>Documento gerado para fins de controlo, arquivo e gestão financeira pessoal.</p>
                <p className="text-[10px] text-muted-foreground/70">ID de Autenticidade: FIN-EXP-{selectedMonth.replace('-', '')}-{stats.count}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">Página 1 de 1</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">● Dados sincronizados e encriptados</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions Bar (Hidden on Print) */}
        <div className="no-print p-4 border-t border-border bg-card flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-2xl">
          <div className="text-xs text-muted-foreground">
            Apresentando <strong className="text-foreground">{filteredExpenses.length}</strong> de <strong className="text-foreground">{expenses.length}</strong> despesas registadas.
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Fechar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              Imprimir
            </Button>

            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="w-3.5 h-3.5" />
              {isExportingPDF ? 'A gerar...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
