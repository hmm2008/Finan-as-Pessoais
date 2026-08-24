import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { ExpenseRow, IncomeRow, FinancasCharts, ComparativeAnalysis, ExpenseForm, IncomeForm, CSVImportModal, ExportPDFModal } from '../components/financas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { usePrivacy, useDashboard } from '../contexts';
import { usePreferences } from '../contexts/PreferencesContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Info, Plus, Upload, FileText, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wallet, ArrowDownRight, ArrowUpRight, CheckSquare, Square, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, useIncomes, useFixedExpenses, useFixedIncomes } from '../hooks/queries';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

export default function FinancasView() {
  const { maskValue } = usePrivacy();
  const { currentMonth, setMonth } = useDashboard();
  const { prefs } = usePreferences();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const navigate = useNavigate();

  const customTitles = prefs.pageTitles || {};
  const customSubtitles = prefs.pageSubtitles || {};
  const pageTitle = customTitles['/financas'] || 'Finanças';
  const pageSubtitle = customSubtitles['/financas'] ?? 'Gestão de receitas e despesas';

  const { expenses, deleteExpense } = useExpenses();
  const { fixedExpenses, deleteFixedExpense } = useFixedExpenses();
  const { incomes, deleteIncome } = useIncomes();
  const { fixedIncomes, deleteFixedIncome } = useFixedIncomes();

  // Modal states
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'expense' | 'fixed_expense' | 'income' | 'fixed_income', item: any } | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportPDFOpen, setExportPDFOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('despesas');
  const [period, setPeriod] = useState<'Mensal' | 'Anual'>('Mensal');
  const [filterCategory, setFilterCategory] = useState('Todas as categorias');
  const [filterMethod, setFilterMethod] = useState('Todos os métodos de pagamento');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { paymentMethods } = usePaymentMethods();

  const availablePaymentMethods = useMemo(() => {
    const set = new Set<string>(paymentMethods);
    expenses.forEach((e: any) => { if (e.method) set.add(e.method); });
    incomes.forEach((i: any) => { if (i.method) set.add(i.method); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }, [paymentMethods, expenses, incomes]);

  // Multi-selection states for bulk actions
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [selectedFixedExpenseIds, setSelectedFixedExpenseIds] = useState<string[]>([]);
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<string[]>([]);

  const [bulkToDelete, setBulkToDelete] = useState<{
    type: 'expense' | 'fixed_expense' | 'income';
    ids: string[];
    items: any[];
  } | null>(null);

  // Month parsing
  const current = currentMonth || new Date().toISOString().slice(0, 7);
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const monthNameYear = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
  const capitalizedMonthYear = monthNameYear.charAt(0).toUpperCase() + monthNameYear.slice(1);

  // One-by-one month / year navigation
  const prevMonth = () => {
    if (period === 'Anual') {
      const prevYear = year - 1;
      setMonth(`${prevYear}-${String(month).padStart(2, '0')}`);
    } else {
      if (month === 1) {
        // From Janeiro, go to Dezembro of previous year
        setMonth(`${year - 1}-12`);
      } else {
        // Go to previous month
        setMonth(`${year}-${String(month - 1).padStart(2, '0')}`);
      }
    }
  };

  const nextMonth = () => {
    if (period === 'Anual') {
      const nextYear = year + 1;
      setMonth(`${nextYear}-${String(month).padStart(2, '0')}`);
    } else {
      if (month === 12) {
        // From Dezembro, go to Janeiro of next year
        setMonth(`${year + 1}-01`);
      } else {
        // Go to next month
        setMonth(`${year}-${String(month + 1).padStart(2, '0')}`);
      }
    }
  };

  // Dynamic nav buttons (all 12 months for year in monthly mode, or range of years in annual mode)
  const dynamicMonths = useMemo(() => {
    if (period === 'Anual') {
      return Array.from({ length: 6 }).map((_, i) => {
        const y = year - 3 + i;
        return { label: y.toString(), value: `${y}-01` };
      });
    } else {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return monthNames.map((label, idx) => {
        const mNum = String(idx + 1).padStart(2, '0');
        return {
          label,
          value: `${year}-${mNum}`
        };
      });
    }
  }, [period, year]);

  // Filter Data
  const periodMatch = (dateStr: string) => {
    if (!dateStr) return true;
    if (period === 'Anual') {
      return dateStr.startsWith(year.toString());
    }
    return dateStr.startsWith(current);
  };

  // Helper to sort items from most recent date to oldest date
  const sortByDateDesc = (a: any, b: any) => {
    const dateStrA = String(a.date || a.createdAt || '');
    const dateStrB = String(b.date || b.createdAt || '');
    
    const timeA = new Date(a.date || a.createdAt || 0).getTime();
    const timeB = new Date(b.date || b.createdAt || 0).getTime();
    
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }
    
    if (dateStrB && dateStrA && dateStrB !== dateStrA) {
      return dateStrB.localeCompare(dateStrA);
    }
    
    const createdTimeA = new Date(a.createdAt || 0).getTime();
    const createdTimeB = new Date(b.createdAt || 0).getTime();
    if (!isNaN(createdTimeA) && !isNaN(createdTimeB) && createdTimeB !== createdTimeA) {
      return createdTimeB - createdTimeA;
    }
    
    return String(b.id || '').localeCompare(String(a.id || ''));
  };

  // Despesas registadas pontuais from expenses database (sorted most recent to oldest)
  const filteredRegisteredExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      const matchPeriod = periodMatch(e.date);
      const matchSearch = (e.entity || '').toLowerCase().includes(search.toLowerCase()) || 
                          (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
                          (e.method || '').toLowerCase().includes(search.toLowerCase()) ||
                          (e.notes || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory && filterCategory !== 'Todas as categorias' ? e.category === filterCategory : true;
      const matchMethod = filterMethod && filterMethod !== 'Todos os métodos de pagamento' ? (e.method || 'Outro') === filterMethod : true;
      const isPunctual = (!e.recurring || e.recurring === 'false' || e.recurring === 'Não') && !e.isFixed && !e.fixedExpenseId;
      
      return isPunctual && matchPeriod && matchSearch && matchCategory && matchMethod;
    }).sort(sortByDateDesc);
  }, [expenses, period, current, year, search, filterCategory, filterMethod]);

  // Despesas fixas registadas pelo utilizador para o período
  const filteredFixedExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      const isFixed = e.recurring === true || e.recurring === 'true' || e.recurring === 'Sim' || e.isFixed === true || !!e.fixedExpenseId;
      const matchPeriod = periodMatch(e.date);
      const matchSearch = (e.entity || '').toLowerCase().includes(search.toLowerCase()) || 
                          (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
                          (e.method || '').toLowerCase().includes(search.toLowerCase()) ||
                          (e.notes || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory && filterCategory !== 'Todas as categorias' ? e.category === filterCategory : true;
      const matchMethod = filterMethod && filterMethod !== 'Todos os métodos de pagamento' ? (e.method || 'Outro') === filterMethod : true;
      
      return isFixed && matchPeriod && matchSearch && matchCategory && matchMethod;
    }).sort(sortByDateDesc);
  }, [expenses, period, current, year, search, filterCategory, filterMethod]);

  const DEFAULT_EXPENSE_CATS = ['Alimentação', 'Habitação', 'Transportes', 'Combustível', 'Saúde', 'Lazer'];
  const DEFAULT_FIXED_EXPENSE_CATS = ['Habitação', 'Saúde', 'Transportes', 'Educação', 'Seguros', 'Subscrições', 'Telecomunicações', 'Impostos', 'Outros'];
  const DEFAULT_INCOME_CATS = ['Salário', 'Rendimentos Prediais', 'Reembolso', 'Prémio/Bónus'];

  // Receitas registadas pelo utilizador para o período (sorted most recent to oldest)
  const filteredIncomes = useMemo(() => {
    return incomes.filter((i: any) => {
      const matchPeriod = periodMatch(i.date);
      const matchSearch = (i.entity || '').toLowerCase().includes(search.toLowerCase()) || 
                          (i.category || '').toLowerCase().includes(search.toLowerCase()) ||
                          (i.method || '').toLowerCase().includes(search.toLowerCase()) ||
                          (i.notes || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory && filterCategory !== 'Todas as categorias' ? i.category === filterCategory : true;
      const matchMethod = filterMethod && filterMethod !== 'Todos os métodos de pagamento' ? (i.method || 'Outro') === filterMethod : true;
      
      return matchPeriod && matchSearch && matchCategory && matchMethod;
    }).sort(sortByDateDesc);
  }, [incomes, period, current, year, search, filterCategory, filterMethod]);

  // Selection helpers for bulk actions
  const toggleSelectExpense = (id: string) => {
    setSelectedExpenseIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const allExpensesSelected = useMemo(() => {
    return filteredRegisteredExpenses.length > 0 && filteredRegisteredExpenses.every(e => selectedExpenseIds.includes(e.id));
  }, [filteredRegisteredExpenses, selectedExpenseIds]);

  const toggleSelectAllExpenses = () => {
    if (allExpensesSelected) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(filteredRegisteredExpenses.map(e => e.id));
    }
  };

  const toggleSelectFixedExpense = (id: string) => {
    setSelectedFixedExpenseIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const allFixedExpensesSelected = useMemo(() => {
    return filteredFixedExpenses.length > 0 && filteredFixedExpenses.every(e => selectedFixedExpenseIds.includes(e.id));
  }, [filteredFixedExpenses, selectedFixedExpenseIds]);

  const toggleSelectAllFixedExpenses = () => {
    if (allFixedExpensesSelected) {
      setSelectedFixedExpenseIds([]);
    } else {
      setSelectedFixedExpenseIds(filteredFixedExpenses.map(e => e.id));
    }
  };

  const toggleSelectIncome = (id: string) => {
    setSelectedIncomeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const allIncomesSelected = useMemo(() => {
    return filteredIncomes.length > 0 && filteredIncomes.every(i => selectedIncomeIds.includes(i.id));
  }, [filteredIncomes, selectedIncomeIds]);

  const toggleSelectAllIncomes = () => {
    if (allIncomesSelected) {
      setSelectedIncomeIds([]);
    } else {
      setSelectedIncomeIds(filteredIncomes.map(i => i.id));
    }
  };

  // Summary calculations - calculated strictly from registered incomes and expenses in the selected period
  const summary = useMemo(() => {
    const periodIncomes = incomes.filter((i: any) => periodMatch(i.date));
    
    // 1. Receitas Fixas: Registered recurring/fixed incomes in the period
    const receitasFixas = periodIncomes
      .filter((i: any) => i.recurring === true || i.recurring === 'true' || i.recurring === 'Sim' || i.isFixed === true || !!i.fixedIncomeId)
      .reduce((acc: number, val: any) => acc + (Number(val.amount) || 0), 0);

    // 2. Receitas Pontuais: Strictly punctual / non-recurring period incomes
    const receitasPontuais = periodIncomes
      .filter((i: any) => (!i.recurring || i.recurring === 'false' || i.recurring === 'Não') && !i.isFixed && !i.fixedIncomeId)
      .reduce((acc: number, val: any) => acc + (Number(val.amount) || 0), 0);

    const totalReceitas = receitasFixas + receitasPontuais;

    // 3. Despesas Pontuais: Strictly punctual period expenses
    const periodExpenses = expenses.filter((e: any) => periodMatch(e.date));
    const despesasPontuais = periodExpenses
      .filter((e: any) => (!e.recurring || e.recurring === 'false' || e.recurring === 'Não') && !e.isFixed && !e.fixedExpenseId)
      .reduce((acc: number, val: any) => acc + (Number(val.amount) || 0), 0);

    // 4. Despesas Fixas: Registered recurring/fixed period expenses
    const despesasFixas = periodExpenses
      .filter((e: any) => e.recurring === true || e.recurring === 'true' || e.recurring === 'Sim' || e.isFixed === true || !!e.fixedExpenseId)
      .reduce((acc: number, val: any) => acc + (Number(val.amount) || 0), 0);

    const totalDespesas = despesasPontuais + despesasFixas;
    const despesasRegistadas = totalDespesas;
    const saldo = totalReceitas - totalDespesas;

    return {
      receitasFixas,
      receitasPontuais,
      totalReceitas,
      despesasPontuais,
      despesasRegistadas,
      despesasFixas,
      totalDespesas,
      saldo
    };
  }, [incomes, expenses, period, current, year, month]);

  // Categories defined and available strictly in function of the selected tab
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();

    const safeParse = (key: string): string[] => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
      } catch {
        return [];
      }
    };

    if (activeTab === 'despesas') {
      // Only categories defined / present in Despesas Registadas
      expenses.forEach((e: any) => {
        if (e.category && e.category.trim()) cats.add(e.category.trim());
      });
      DEFAULT_EXPENSE_CATS.forEach(c => cats.add(c));
      safeParse('expense_custom_categories').forEach(c => { if (c) cats.add(c.trim()); });
    } else if (activeTab === 'despesas-fixas') {
      // Only categories defined / present in Despesas Fixas
      fixedExpenses.forEach((fe: any) => {
        if (fe.category && fe.category.trim()) cats.add(fe.category.trim());
      });
      DEFAULT_FIXED_EXPENSE_CATS.forEach(c => cats.add(c));
      safeParse('fixed_expense_custom_categories').forEach(c => { if (c) cats.add(c.trim()); });
    } else if (activeTab === 'receitas') {
      // Only categories defined / present in Receitas
      incomes.forEach((i: any) => {
        if (i.category && i.category.trim()) cats.add(i.category.trim());
      });
      DEFAULT_INCOME_CATS.forEach(c => cats.add(c));
      safeParse('income_custom_categories').forEach(c => { if (c) cats.add(c.trim()); });
      safeParse('fixed_income_custom_categories').forEach(c => { if (c) cats.add(c.trim()); });
    } else {
      // For graficos / tendencias: combine all
      expenses.forEach((e: any) => { if (e.category) cats.add(e.category.trim()); });
      fixedExpenses.forEach((fe: any) => { if (fe.category) cats.add(fe.category.trim()); });
      incomes.forEach((i: any) => { if (i.category) cats.add(i.category.trim()); });
    }

    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [activeTab, expenses, fixedExpenses, incomes]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{pageTitle}</h1>
          {pageSubtitle && (
            <p className="text-muted-foreground mt-1 text-sm">{pageSubtitle}</p>
          )}
        </div>
        
        {/* Buttons Stack */}
        <div className="flex flex-col items-start gap-2.5 w-full lg:w-auto">
          {/* Row 1: Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 text-sm font-semibold" onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Nova Despesa <Info className="w-3 h-3 opacity-70 ml-0.5" />
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 h-9 text-sm font-semibold" onClick={() => { setEditingIncome(null); setIncomeModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Nova Receita Pontual <Info className="w-3 h-3 opacity-70 ml-0.5" />
            </Button>
          </div>

          {/* Row 2: Secondary / Export & Import Actions placed underneath and aligned with Nova Despesa */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="gap-2 h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-medium" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-3.5 h-3.5" /> Importar Ficheiro <Info className="w-3 h-3 opacity-70 ml-0.5" />
            </Button>
            <Button variant="outline" className="gap-1.5 h-8 text-xs font-medium" onClick={() => setExportPDFOpen(true)}>
              <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Gerar PDF <Info className="w-3 h-3 opacity-70 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-border">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground mb-1">Receitas Fixas</p>
            <p className="text-2xl font-bold text-emerald-500">{maskValue(summary.receitasFixas, formatter.format)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground mb-1">Receitas Pontuais</p>
            <p className="text-2xl font-bold text-emerald-500">{maskValue(summary.receitasPontuais, formatter.format)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground mb-1">Despesas registadas</p>
            <p className="text-2xl font-bold text-destructive">{maskValue(summary.despesasRegistadas, formatter.format)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-rose-50/40 dark:bg-rose-950/10 border-rose-100/60 dark:border-rose-900/20">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground mb-1">Despesas fixas</p>
            <p className="text-2xl font-bold text-destructive">{maskValue(summary.despesasFixas, formatter.format)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground mb-1">Saldo</p>
            <p className={`text-2xl font-bold ${summary.saldo >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>{maskValue(summary.saldo, formatter.format)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => {
          setActiveTab(val);
          setFilterCategory('Todas as categorias');
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-secondary/50 rounded-xl p-1 mb-4 h-auto">
          <TabsTrigger value="despesas" className="rounded-lg py-2 text-xs sm:text-sm font-medium">Despesas Registadas</TabsTrigger>
          <TabsTrigger value="despesas-fixas" className="rounded-lg py-2 text-xs sm:text-sm font-medium">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="receitas" className="rounded-lg py-2 text-xs sm:text-sm font-medium">Receitas</TabsTrigger>
          <TabsTrigger value="graficos" className="rounded-lg py-2 text-xs sm:text-sm font-medium">Gráficos</TabsTrigger>
          <TabsTrigger value="tendencias" className="rounded-lg py-2 text-xs sm:text-sm font-medium">Tendências</TabsTrigger>
        </TabsList>
        
        {/* Compact Navigation & Filter Bar */}
        <Card className="shadow-xs mb-4 border-border bg-card">
          <CardContent className="p-2.5 sm:p-3 space-y-2.5">
            {/* Top Row: Period Selector + Month/Year Navigation + Quick Months */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center bg-secondary/70 p-0.5 rounded-lg border border-border/40">
                  <button 
                    type="button"
                    onClick={() => setPeriod('Mensal')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${period === 'Mensal' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Mensal
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPeriod('Anual')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${period === 'Anual' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Anual
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-secondary/40 px-2 py-0.5 rounded-lg border border-border/50">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={prevMonth}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs sm:text-sm font-semibold min-w-[105px] text-center">
                    {period === 'Anual' ? year : capitalizedMonthYear}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={nextMonth}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Month Pills */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 scrollbar-thin">
                {dynamicMonths.map(m => {
                  const isActive = period === 'Anual' 
                    ? m.value.startsWith(year.toString()) 
                    : current === m.value;
                  return (
                    <button 
                      key={m.value} 
                      type="button"
                      onClick={() => setMonth(m.value)}
                      className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors font-medium ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-xs' 
                          : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Datepicker Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  className="flex items-center gap-1.5 h-7 px-2.5 text-xs bg-secondary/30 rounded-lg hover:bg-secondary/60 transition-colors border border-border"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{period === 'Anual' ? year.toString() : monthNameYear.toLowerCase()}</span>
                </button>

                {datePickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDatePickerOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-border bg-card shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between mb-2">
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7" 
                          onClick={() => {
                            const newDate = new Date(year - 1, month - 1, 1);
                            setMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-sm">{year}</span>
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7" 
                          onClick={() => {
                            const newDate = new Date(year + 1, month - 1, 1);
                            setMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {period !== 'Anual' && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {Array.from({ length: 12 }).map((_, i) => {
                            const d = new Date(year, i, 1);
                            const mStr = d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '');
                            const mLabel = mStr.charAt(0).toUpperCase() + mStr.slice(1);
                            const fullVal = `${year}-${String(i + 1).padStart(2, '0')}`;
                            const isCurrent = current === fullVal;

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setMonth(fullVal);
                                  setDatePickerOpen(false);
                                }}
                                className={`py-1 text-xs font-medium rounded-md transition-colors ${
                                  isCurrent ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'
                                }`}
                              >
                                {mLabel}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {period === 'Anual' && (
                        <div className="text-center text-xs text-muted-foreground py-2">
                          Ano: {year}. Use as setas para mudar.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Row: Search, Category Filter and Payment Method Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-border/40">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar por descrição, entidade, categoria ou método..." 
                  className="pl-8 h-8 text-xs bg-background shadow-none rounded-lg border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select 
                className="w-full sm:w-48 h-8 px-2.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/30"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="Todas as categorias">Todas as categorias</option>
                {availableCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="w-full sm:w-48 h-8 px-2.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/30"
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
              >
                <option value="Todos os métodos de pagamento">Todos os métodos</option>
                {availablePaymentMethods.map((m: string) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tab Content: Despesas Registadas */}
        <TabsContent value="despesas" className="mt-0 outline-none space-y-3">
          {filteredRegisteredExpenses.length > 0 && (
            <div className="flex items-center justify-between bg-card p-2.5 px-3 rounded-lg border border-border shadow-xs text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllExpenses}
                className="h-8 gap-2 font-medium"
              >
                {allExpensesSelected ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>Desseleccionar Todas</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-muted-foreground" />
                    <span>Seleccionar Todas ({filteredRegisteredExpenses.length})</span>
                  </>
                )}
              </Button>

              {selectedExpenseIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <span className="text-muted-foreground font-medium">
                    {selectedExpenseIds.length} {selectedExpenseIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      const items = expenses.filter((e: any) => selectedExpenseIds.includes(e.id));
                      setBulkToDelete({
                        type: 'expense',
                        ids: selectedExpenseIds,
                        items: items.length > 0 ? items : selectedExpenseIds.map(id => ({ id }))
                      });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Selección</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="max-h-[500px] overflow-y-auto pr-1.5 space-y-3">
            {filteredRegisteredExpenses.length > 0 ? (
              <ExpenseRow 
                expenses={filteredRegisteredExpenses} 
                selectedIds={selectedExpenseIds}
                onToggleSelect={toggleSelectExpense}
                onDelete={(id) => {
                  const expItem = expenses.find((e: any) => e.id === id);
                  setItemToDelete({ 
                    id, 
                    type: 'expense', 
                    item: expItem || { id } 
                  });
                }} 
                onEdit={(e: any) => {
                  setEditingExpense(e);
                  setExpenseModalOpen(true);
                }}
              />
            ) : (
              <Card className="shadow-sm border-border border-dashed h-40 flex flex-col items-center justify-center text-muted-foreground">
                <ArrowDownRight className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Sem despesas registadas encontradas</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Content: Despesas Fixas */}
        <TabsContent value="despesas-fixas" className="mt-0 outline-none space-y-3">
          {filteredFixedExpenses.length > 0 && (
            <div className="flex items-center justify-between bg-card p-2.5 px-3 rounded-lg border border-border shadow-xs text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllFixedExpenses}
                className="h-8 gap-2 font-medium"
              >
                {allFixedExpensesSelected ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>Desseleccionar Todas</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-muted-foreground" />
                    <span>Seleccionar Todas ({filteredFixedExpenses.length})</span>
                  </>
                )}
              </Button>

              {selectedFixedExpenseIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <span className="text-muted-foreground font-medium">
                    {selectedFixedExpenseIds.length} {selectedFixedExpenseIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      const items = filteredFixedExpenses.filter((fe: any) => selectedFixedExpenseIds.includes(fe.id));
                      setBulkToDelete({
                        type: 'fixed_expense',
                        ids: selectedFixedExpenseIds,
                        items: items.length > 0 ? items : selectedFixedExpenseIds.map(id => ({ id }))
                      });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Selección</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="max-h-[500px] overflow-y-auto pr-1.5 space-y-3">
            {filteredFixedExpenses.length > 0 ? (
              <ExpenseRow 
                expenses={filteredFixedExpenses} 
                selectedIds={selectedFixedExpenseIds}
                onToggleSelect={toggleSelectFixedExpense}
                onDelete={(id) => {
                  const expItem = expenses.find((e: any) => e.id === id);
                  const fixedItem = fixedExpenses.find((fe: any) => fe.id === id);
                  setItemToDelete({ 
                    id, 
                    type: fixedItem ? 'fixed_expense' : 'expense', 
                    item: fixedItem || expItem || { id } 
                  });
                }} 
                onEdit={(e: any) => {
                  setEditingExpense(e.originalFixedData || e);
                  setExpenseModalOpen(true);
                }}
              />
            ) : (
              <Card className="shadow-sm border-border border-dashed h-40 flex flex-col items-center justify-center text-muted-foreground">
                <ArrowDownRight className="w-8 h-8 mb-2 opacity-20 text-rose-500" />
                <p className="text-sm">Sem despesas fixas encontradas</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Content: Receitas */}
        <TabsContent value="receitas" className="mt-0 outline-none space-y-3">
          {filteredIncomes.length > 0 && (
            <div className="flex items-center justify-between bg-card p-2.5 px-3 rounded-lg border border-border shadow-xs text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllIncomes}
                className="h-8 gap-2 font-medium"
              >
                {allIncomesSelected ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>Desseleccionar Todas</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-muted-foreground" />
                    <span>Seleccionar Todas ({filteredIncomes.length})</span>
                  </>
                )}
              </Button>

              {selectedIncomeIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <span className="text-muted-foreground font-medium">
                    {selectedIncomeIds.length} {selectedIncomeIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      const items = incomes.filter((i: any) => selectedIncomeIds.includes(i.id));
                      setBulkToDelete({
                        type: 'income',
                        ids: selectedIncomeIds,
                        items: items.length > 0 ? items : selectedIncomeIds.map(id => ({ id }))
                      });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Selección</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="max-h-[500px] overflow-y-auto pr-1.5 space-y-3">
            {filteredIncomes.length > 0 ? (
              <IncomeRow 
                incomes={filteredIncomes} 
                selectedIds={selectedIncomeIds}
                onToggleSelect={toggleSelectIncome}
                onDelete={(id) => {
                  const incItem = incomes.find((i: any) => i.id === id);
                  const fixedItem = fixedIncomes.find((fi: any) => fi.id === id);
                  setItemToDelete({ 
                    id, 
                    type: fixedItem ? 'fixed_income' : 'income', 
                    item: fixedItem || incItem || { id } 
                  });
                }}
                onEdit={(i: any) => { 
                  setEditingIncome(i.originalFixedData || i); 
                  setIncomeModalOpen(true); 
                }}
              />
            ) : (
              <Card className="shadow-sm border-border border-dashed h-40 flex flex-col items-center justify-center text-muted-foreground">
                <ArrowUpRight className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Sem receitas encontradas</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Content: Gráficos */}
        <TabsContent value="graficos" className="mt-0 outline-none">
          <div className="max-h-[600px] overflow-y-auto pr-1.5">
            <FinancasCharts expenses={[...filteredRegisteredExpenses, ...filteredFixedExpenses]} incomes={filteredIncomes} />
          </div>
        </TabsContent>

        {/* Tab Content: Tendências */}
        <TabsContent value="tendencias" className="mt-0 outline-none">
          <div className="max-h-[600px] overflow-y-auto pr-1.5">
            <ComparativeAnalysis expenses={expenses} incomes={incomes} />
          </div>
        </TabsContent>
      </Tabs>


      {/* Modals */}
      <ExpenseForm isOpen={expenseModalOpen} onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }} initialData={editingExpense} />
      <IncomeForm isOpen={incomeModalOpen} onClose={() => { setIncomeModalOpen(false); setEditingIncome(null); }} initialData={editingIncome} />
      <CSVImportModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        defaultYear={year}
        defaultMonth={month}
      />
      <ExportPDFModal isOpen={exportPDFOpen} onClose={() => setExportPDFOpen(false)} defaultMonth={currentMonth} />
      
      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmDeleteModal
          open={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirmPermanent={async () => {
            if (itemToDelete.type === 'fixed_expense') {
              await deleteFixedExpense(itemToDelete.id);
            } else if (itemToDelete.type === 'fixed_income') {
              await deleteFixedIncome(itemToDelete.id);
            } else if (itemToDelete.type === 'expense') {
              await deleteExpense(itemToDelete.id);
            } else {
              await deleteIncome(itemToDelete.id);
            }
          }}
          entityLabel={
            itemToDelete.item 
              ? `${itemToDelete.item.category || (itemToDelete.type === 'income' || itemToDelete.type === 'fixed_income' ? 'Receita' : 'Despesa')} ${itemToDelete.item.amount ? `(${itemToDelete.item.amount}€)` : ''}` 
              : 'Registo'
          }
          entityName={itemToDelete.type === 'income' || itemToDelete.type === 'fixed_income' ? 'Receitas' : 'Movimentos'}
          entityId={itemToDelete.id}
          entityData={itemToDelete.item}
          onMoveToTrashSuccess={async () => {
            if (itemToDelete.type === 'fixed_expense') {
              await deleteFixedExpense(itemToDelete.id);
            } else if (itemToDelete.type === 'fixed_income') {
              await deleteFixedIncome(itemToDelete.id);
            } else if (itemToDelete.type === 'expense') {
              await deleteExpense(itemToDelete.id);
            } else {
              await deleteIncome(itemToDelete.id);
            }
          }}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkToDelete && (
        <ConfirmDeleteModal
          open={!!bulkToDelete}
          onClose={() => setBulkToDelete(null)}
          onConfirmPermanent={async () => {
            if (bulkToDelete.type === 'fixed_expense') {
              for (const id of bulkToDelete.ids) {
                const isFixed = fixedExpenses.some((fe: any) => fe.id === id);
                if (isFixed) {
                  await deleteFixedExpense(id);
                } else {
                  await deleteExpense(id);
                }
              }
              setSelectedFixedExpenseIds([]);
            } else if (bulkToDelete.type === 'expense') {
              for (const id of bulkToDelete.ids) {
                await deleteExpense(id);
              }
              setSelectedExpenseIds([]);
            } else {
              for (const id of bulkToDelete.ids) {
                const isFixed = (fixedIncomes || []).some((fi: any) => fi.id === id);
                if (isFixed) {
                  await deleteFixedIncome(id);
                } else {
                  await deleteIncome(id);
                }
              }
              setSelectedIncomeIds([]);
            }
            setBulkToDelete(null);
          }}
          entityLabel={`${bulkToDelete.ids.length} ${
            bulkToDelete.type === 'income' 
              ? (bulkToDelete.ids.length === 1 ? 'receita seleccionada' : 'receitas seleccionadas') 
              : bulkToDelete.type === 'fixed_expense' 
              ? (bulkToDelete.ids.length === 1 ? 'despesa fixa seleccionada' : 'despesas fixas seleccionadas')
              : (bulkToDelete.ids.length === 1 ? 'despesa registada seleccionada' : 'despesas registadas seleccionadas')
          }`}
          entityName={bulkToDelete.type === 'income' ? 'Receitas' : 'Movimentos'}
          entityId={`bulk_${bulkToDelete.type}`}
          entityData={bulkToDelete.items}
          onMoveToTrashSuccess={async () => {
            if (bulkToDelete.type === 'fixed_expense') {
              for (const id of bulkToDelete.ids) {
                const isFixed = fixedExpenses.some((fe: any) => fe.id === id);
                if (isFixed) {
                  await deleteFixedExpense(id);
                } else {
                  await deleteExpense(id);
                }
              }
              setSelectedFixedExpenseIds([]);
            } else if (bulkToDelete.type === 'expense') {
              for (const id of bulkToDelete.ids) {
                await deleteExpense(id);
              }
              setSelectedExpenseIds([]);
            } else {
              for (const id of bulkToDelete.ids) {
                const isFixed = (fixedIncomes || []).some((fi: any) => fi.id === id);
                if (isFixed) {
                  await deleteFixedIncome(id);
                } else {
                  await deleteIncome(id);
                }
              }
              setSelectedIncomeIds([]);
            }
            setBulkToDelete(null);
          }}
        />
      )}

    </div>
  );
}
