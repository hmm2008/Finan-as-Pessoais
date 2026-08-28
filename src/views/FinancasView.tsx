import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { 
  ExpenseRow, 
  IncomeRow, 
  FinancasCharts, 
  ComparativeAnalysis, 
  ExpenseForm, 
  IncomeForm, 
  CSVImportModal, 
  ExportPDFModal, 
  FinancasSummaryCards,
  FinancasNavigation,
  FinancasBulkActions,
  FinancasTabContent
} from '../components/financas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { usePrivacy, useDashboard } from '../contexts';
import { usePreferences } from '../contexts/PreferencesContext';
import { Button } from '../components/ui/button';
import { Search, Info, Plus, Upload, FileText, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, useIncomes, useFixedExpenses, useFixedIncomes } from '../hooks/queries';
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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
      const q = search.toLowerCase();
      const matchSearch = !q || 
                          (e.description || '').toLowerCase().includes(q) ||
                          (e.name || '').toLowerCase().includes(q) ||
                          (e.entity || '').toLowerCase().includes(q) || 
                          (e.category || '').toLowerCase().includes(q) ||
                          (e.method || '').toLowerCase().includes(q) ||
                          (e.paymentMethod || '').toLowerCase().includes(q) ||
                          (e.notes || '').toLowerCase().includes(q);
      const matchCategory = filterCategory && filterCategory !== 'Todas as categorias' ? e.category === filterCategory : true;
      const isPunctual = true; // Include all expenses, including fixed ones
      
      return matchPeriod && matchSearch && matchCategory;
    }).sort(sortByDateDesc);
  }, [expenses, period, current, year, search, filterCategory]);

  // Despesas fixas registadas pelo utilizador para o período
  const filteredFixedExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      const isFixed = e.recurring === true || e.recurring === 'true' || e.recurring === 'Sim' || e.isFixed === true || !!e.fixedExpenseId;
      const matchPeriod = periodMatch(e.date);
      const q = search.toLowerCase();
      const matchSearch = !q || 
                          (e.description || '').toLowerCase().includes(q) ||
                          (e.name || '').toLowerCase().includes(q) ||
                          (e.entity || '').toLowerCase().includes(q) || 
                          (e.category || '').toLowerCase().includes(q) ||
                          (e.method || '').toLowerCase().includes(q) ||
                          (e.paymentMethod || '').toLowerCase().includes(q) ||
                          (e.notes || '').toLowerCase().includes(q);
      const matchCategory = filterCategory && filterCategory !== 'Todas as categorias' ? e.category === filterCategory : true;
      
      return isFixed && matchPeriod && matchSearch && matchCategory;
    }).sort(sortByDateDesc);
  }, [expenses, period, current, year, search, filterCategory]);

  const DEFAULT_EXPENSE_CATS = ['Alimentação', 'Habitação', 'Transportes', 'Combustível', 'Saúde', 'Lazer'];
  const DEFAULT_FIXED_EXPENSE_CATS = ['Habitação', 'Saúde', 'Transportes', 'Educação', 'Seguros', 'Subscrições', 'Telecomunicações', 'Impostos', 'Outros'];
  const DEFAULT_INCOME_CATS = ['Salário', 'Pensões', 'Rendimentos Prediais', 'Reembolso', 'Prémio/Bónus'];

  // Receitas registadas pelo utilizador para o período (sorted most recent to oldest)
  const filteredIncomes = useMemo(() => {
    return incomes.filter((i: any) => {
      const matchPeriod = periodMatch(i.date);
      const q = search.toLowerCase();
      const matchSearch = !q || 
                          (i.description || '').toLowerCase().includes(q) ||
                          (i.name || '').toLowerCase().includes(q) ||
                          (i.entity || '').toLowerCase().includes(q) || 
                          (i.category || '').toLowerCase().includes(q) ||
                          (i.method || '').toLowerCase().includes(q) ||
                          (i.paymentMethod || '').toLowerCase().includes(q) ||
                          (i.notes || '').toLowerCase().includes(q);
      const matchCategory = filterCategory && filterCategory !== 'Todas as categorias' ? i.category === filterCategory : true;
      
      return matchPeriod && matchSearch && matchCategory;
    }).sort(sortByDateDesc);
  }, [incomes, period, current, year, search, filterCategory]);

  // Category total calculation for the selected filter
  const categoryTotal = useMemo(() => {
    if (filterCategory === 'Todas as categorias') return 0;
    
    let list: any[] = [];
    if (activeTab === 'despesas') list = filteredRegisteredExpenses;
    else if (activeTab === 'despesas-fixas') list = filteredFixedExpenses;
    else if (activeTab === 'receitas') list = filteredIncomes;
    
    return list.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [filterCategory, activeTab, filteredRegisteredExpenses, filteredFixedExpenses, filteredIncomes]);

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
      <PageHeader title={pageTitle} subtitle={pageSubtitle}>
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
      </PageHeader>

      {/* Summary Cards */}
      <FinancasSummaryCards 
        summary={summary} 
        maskValue={maskValue} 
        formatter={formatter} 
      />

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
        <FinancasNavigation 
          period={period}
          setPeriod={setPeriod}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          capitalizedMonthYear={capitalizedMonthYear}
          year={year}
          current={current}
          setMonth={setMonth}
          datePickerOpen={datePickerOpen}
          setDatePickerOpen={setDatePickerOpen}
          dynamicMonths={dynamicMonths}
          search={search}
          setSearch={setSearch}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          availableCategories={availableCategories}
          monthNameYear={monthNameYear}
        />

        {/* Tab Content: Despesas Registadas */}
        <TabsContent value="despesas" className="mt-0 outline-none">
          <FinancasTabContent
            type="expense"
            filteredItems={filteredRegisteredExpenses}
            selectedIds={selectedExpenseIds}
            onToggleSelectAll={toggleSelectAllExpenses}
            onDeleteBulk={() => {
              const items = expenses.filter((e: any) => selectedExpenseIds.includes(e.id));
              setBulkToDelete({
                type: 'expense',
                ids: selectedExpenseIds,
                items: items.length > 0 ? items : selectedExpenseIds.map(id => ({ id }))
              });
            }}
          >
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
          </FinancasTabContent>
        </TabsContent>

        {/* Tab Content: Despesas Fixas */}
        <TabsContent value="despesas-fixas" className="mt-0 outline-none">
          <FinancasTabContent
            type="fixed_expense"
            filteredItems={filteredFixedExpenses}
            selectedIds={selectedFixedExpenseIds}
            onToggleSelectAll={toggleSelectAllFixedExpenses}
            onDeleteBulk={() => {
              const items = filteredFixedExpenses.filter((fe: any) => selectedFixedExpenseIds.includes(fe.id));
              setBulkToDelete({
                type: 'fixed_expense',
                ids: selectedFixedExpenseIds,
                items: items.length > 0 ? items : selectedFixedExpenseIds.map(id => ({ id }))
              });
            }}
          >
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
          </FinancasTabContent>
        </TabsContent>

        {/* Tab Content: Receitas */}
        <TabsContent value="receitas" className="mt-0 outline-none">
          <FinancasTabContent
            type="income"
            filteredItems={filteredIncomes}
            selectedIds={selectedIncomeIds}
            onToggleSelectAll={toggleSelectAllIncomes}
            onDeleteBulk={() => {
              const items = incomes.filter((i: any) => selectedIncomeIds.includes(i.id));
              setBulkToDelete({
                type: 'income',
                ids: selectedIncomeIds,
                items: items.length > 0 ? items : selectedIncomeIds.map(id => ({ id }))
              });
            }}
          >
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
          </FinancasTabContent>
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

      {/* Floating Category Total Indicator */}
      {filterCategory !== 'Todas as categorias' && categoryTotal > 0 && (
        <div className="fixed bottom-20 right-6 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-white/70 uppercase tracking-wider leading-tight">
                    Total: {filterCategory}
                  </p>
                  <p className="text-xl font-black text-white leading-tight">
                    {maskValue(categoryTotal, formatter.format)}
                  </p>
                </div>
                <button 
                  onClick={() => setFilterCategory('Todas as categorias')}
                  className="ml-2 w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-white/50" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
