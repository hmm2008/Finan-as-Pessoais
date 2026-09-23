import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Asset, PropertyExpense } from './types';
import { usePrivacy } from '../../contexts';
import { useExpenses, useFixedExpenses } from '../../hooks/queries';
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Tag, 
  CreditCard, 
  Plus, 
  ExternalLink, 
  Search,
  Filter,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Receipt,
  Layers,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface PropertyRealExpensesCardProps {
  asset: Asset;
  propertyExpenses: PropertyExpense[];
  onAddExpenseClick?: () => void;
}

const MONTHS_LIST = [
  { value: 'all', label: 'Todos os Meses', short: 'Todos' },
  { value: '01', label: 'Janeiro', short: 'Jan' },
  { value: '02', label: 'Fevereiro', short: 'Fev' },
  { value: '03', label: 'Março', short: 'Mar' },
  { value: '04', label: 'Abril', short: 'Abr' },
  { value: '05', label: 'Maio', short: 'Mai' },
  { value: '06', label: 'Junho', short: 'Jun' },
  { value: '07', label: 'Julho', short: 'Jul' },
  { value: '08', label: 'Agosto', short: 'Ago' },
  { value: '09', label: 'Setembro', short: 'Set' },
  { value: '10', label: 'Outubro', short: 'Out' },
  { value: '11', label: 'Novembro', short: 'Nov' },
  { value: '12', label: 'Dezembro', short: 'Dez' },
];

export function PropertyRealExpensesCard({
  asset,
  propertyExpenses,
  onAddExpenseClick
}: PropertyRealExpensesCardProps) {
  const { maskValue } = usePrivacy();
  const navigate = useNavigate();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  
  const { expenses: allExpenses } = useExpenses();
  const { fixedExpenses } = useFixedExpenses();

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Group accordion state (record of groupKey -> boolean)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Track expanded individual transaction details
  const [expandedTxIds, setExpandedTxIds] = useState<Record<string, boolean>>({});

  // 1. Identify all real expenses belonging to this property from Finanças (fin_expenses)
  const realExpenses = useMemo(() => {
    if (!asset || !allExpenses || !Array.isArray(allExpenses)) return [];
    
    const assetIdStr = String(asset.id);
    const assetNameLower = (asset.name || '').trim().toLowerCase();
    
    // IDs of property expenses for this asset
    const thisPropExpenseIds = new Set(
      propertyExpenses
        .filter(pe => String(pe.assetId) === assetIdStr)
        .map(pe => String(pe.id))
    );
    
    const thisPropExpenseTitles = propertyExpenses
      .filter(pe => String(pe.assetId) === assetIdStr)
      .map(pe => (pe.title || '').trim().toLowerCase())
      .filter(t => t.length >= 2);

    const thisPropExpenseEntities = propertyExpenses
      .filter(pe => String(pe.assetId) === assetIdStr)
      .map(pe => (pe.entity || '').trim().toLowerCase())
      .filter(e => e.length >= 2);

    // Fixed expense IDs linked to this asset or this asset's property expenses
    const thisFixedExpenseIds = new Set<string>();
    propertyExpenses
      .filter(pe => String(pe.assetId) === assetIdStr)
      .forEach(pe => {
        if (pe.fixedExpenseId) thisFixedExpenseIds.add(String(pe.fixedExpenseId));
      });
    
    (fixedExpenses || []).forEach((fe: any) => {
      const feIdStr = String(fe.id);
      if (fe.assetId && String(fe.assetId) === assetIdStr) {
        thisFixedExpenseIds.add(feIdStr);
      }
      if (fe.propertyExpenseId && thisPropExpenseIds.has(String(fe.propertyExpenseId))) {
        thisFixedExpenseIds.add(feIdStr);
      }

      const feName = (fe.name || '').toLowerCase();
      const feDesc = (fe.description || '').toLowerCase();
      const feEntity = (fe.entity || '').toLowerCase();
      const feNotes = (fe.notes || '').toLowerCase();

      // If the fixed expense name/description/notes mentions the property name
      if (assetNameLower && assetNameLower.length >= 3) {
        if (feName.includes(assetNameLower) || feDesc.includes(assetNameLower) || feNotes.includes(assetNameLower)) {
          thisFixedExpenseIds.add(feIdStr);
        }
      }

      // If this fixed expense matches any property expense title/entity of this property
      if (thisPropExpenseTitles.some(t => feName.includes(t) || feDesc.includes(t))) {
        thisFixedExpenseIds.add(feIdStr);
      }
      if (thisPropExpenseEntities.some(ent => feEntity.includes(ent))) {
        thisFixedExpenseIds.add(feIdStr);
      }
    });

    return allExpenses.filter((exp: any) => {
      if (!exp) return false;
      
      // Direct asset link
      if (exp.assetId && String(exp.assetId) === assetIdStr) return true;
      
      // Link via Property Expense ID
      if (exp.propertyExpenseId && thisPropExpenseIds.has(String(exp.propertyExpenseId))) return true;
      
      // Link via Fixed Expense ID
      if (exp.fixedExpenseId && thisFixedExpenseIds.has(String(exp.fixedExpenseId))) return true;
      
      const nameLower = (exp.name || '').toLowerCase();
      const descLower = (exp.description || '').toLowerCase();
      const entityLower = (exp.entity || '').toLowerCase();
      const catLower = (exp.category || '').toLowerCase();
      const notesLower = (exp.notes || '').toLowerCase();

      // Fallback matching by name/description/entity/notes when they explicitly mention this property
      if (assetNameLower && assetNameLower.length >= 3) {
        if (
          nameLower.includes(assetNameLower) ||
          descLower.includes(assetNameLower) ||
          entityLower.includes(assetNameLower) ||
          notesLower.includes(`imóvel: ${assetNameLower}`) ||
          notesLower.includes(`imovel: ${assetNameLower}`) ||
          notesLower.includes(assetNameLower)
        ) {
          return true;
        }
      }

      // Match if this expense matches any Property Expense title (e.g. "Luz", "Condomínio", "IMI") or entity (e.g. "EDP") of this asset
      if (thisPropExpenseTitles.length > 0) {
        const matchesTitle = thisPropExpenseTitles.some(t => 
          nameLower.includes(t) || descLower.includes(t) || catLower === t
        );
        if (matchesTitle) return true;
      }

      if (thisPropExpenseEntities.length > 0) {
        const matchesEntity = thisPropExpenseEntities.some(ent => 
          entityLower.includes(ent) || nameLower.includes(ent) || descLower.includes(ent)
        );
        if (matchesEntity) return true;
      }
      
      return false;
    }).map((exp: any) => {
      // Resolve the Name of the Expense (Nome da Despesa) following the exact same criteria as Finanças
      let resolvedName = '';
      
      // 1. If it links to a Fixed Expense, prioritize the name of that Fixed Expense
      if (exp.fixedExpenseId) {
        const matchedFE = (fixedExpenses || []).find((fe: any) => String(fe.id) === String(exp.fixedExpenseId));
        if (matchedFE && (matchedFE.name || matchedFE.description)) {
          resolvedName = matchedFE.name || matchedFE.description;
        }
      }

      // 2. If it links to a Property Expense, use its title or name
      if (!resolvedName && exp.propertyExpenseId) {
        const matchedPE = propertyExpenses.find((pe: any) => String(pe.id) === String(exp.propertyExpenseId));
        if (matchedPE && (matchedPE.title || (matchedPE as any).name)) {
          resolvedName = matchedPE.title || (matchedPE as any).name;
        }
      }

      // 3. If there is an explicit name on the expense record itself
      if (!resolvedName && exp.name && exp.name.trim()) {
        resolvedName = exp.name.trim();
      }

      // 4. Try matching with property expenses of this asset by title or category
      if (!resolvedName) {
        const matchingPE = propertyExpenses.find((pe: any) => 
          String(pe.assetId) === assetIdStr && (
            (pe.title && ((exp.notes || '').toLowerCase().includes(pe.title.toLowerCase()) || (exp.description || '').toLowerCase().includes(pe.title.toLowerCase()))) ||
            (pe.category && exp.category && pe.category.toLowerCase() === exp.category.toLowerCase())
          )
        );
        if (matchingPE && (matchingPE.title || (matchingPE as any).name)) {
          resolvedName = matchingPE.title || (matchingPE as any).name;
        }
      }

      // 5. Fallback to description, entity or 'Despesa'
      if (!resolvedName) {
        resolvedName = exp.description || exp.entity || 'Despesa';
      }

      return {
        ...exp,
        name: resolvedName,
        displayName: resolvedName,
        displayEntity: (exp.entity && exp.entity !== resolvedName) ? exp.entity : ''
      };
    }).sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [asset, allExpenses, propertyExpenses, fixedExpenses]);

  // Available years from real expenses
  const availableYears = useMemo(() => {
    const currentYr = new Date().getFullYear().toString();
    const yrs = new Set<string>([currentYr]);
    realExpenses.forEach((e: any) => {
      if (e.date) {
        const y = e.date.substring(0, 4);
        if (y && y.length === 4) yrs.add(y);
      }
    });
    return Array.from(yrs).sort((a, b) => Number(b) - Number(a));
  }, [realExpenses]);

  // Available months present in data for the selected year (or all)
  const availableMonths = useMemo(() => {
    const activeMonths = new Set<string>();
    realExpenses.forEach((e: any) => {
      if (e.date) {
        const y = e.date.substring(0, 4);
        const m = e.date.substring(5, 7);
        if (selectedYear === 'all' || y === selectedYear) {
          if (m && m.length === 2) activeMonths.add(m);
        }
      }
    });
    return activeMonths;
  }, [realExpenses, selectedYear]);

  // Filtered real expenses by Year, Month, Category, Search
  const filteredRealExpenses = useMemo(() => {
    return realExpenses.filter((e: any) => {
      if (selectedYear !== 'all') {
        const y = (e.date || '').substring(0, 4);
        if (y !== selectedYear) return false;
      }
      if (selectedMonth !== 'all') {
        const m = (e.date || '').substring(5, 7);
        if (m !== selectedMonth) return false;
      }
      if (selectedCategory !== 'all') {
        if (e.category !== selectedCategory) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = (e.name || '').toLowerCase().includes(term);
        const matchDesc = (e.description || '').toLowerCase().includes(term);
        const matchEntity = (e.entity || '').toLowerCase().includes(term);
        const matchCategory = (e.category || '').toLowerCase().includes(term);
        const matchMethod = (e.method || e.paymentMethod || '').toLowerCase().includes(term);
        const matchNotes = (e.notes || '').toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchEntity && !matchCategory && !matchMethod && !matchNotes) return false;
      }
      return true;
    });
  }, [realExpenses, selectedYear, selectedMonth, selectedCategory, searchTerm]);

  // Group filtered expenses by Year-Month
  const groupedExpenses = useMemo(() => {
    const groups: { [key: string]: { key: string; label: string; year: string; month: string; items: any[]; totalAmount: number } } = {};
    
    const monthNames: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };

    filteredRealExpenses.forEach((exp: any) => {
      const dateStr = exp.date || '';
      const year = dateStr.substring(0, 4) || 'Outros';
      const month = dateStr.substring(5, 7) || '00';
      const key = dateStr.length >= 7 ? dateStr.substring(0, 7) : 'sem-data';
      
      const label = key !== 'sem-data' && monthNames[month] 
        ? `${monthNames[month]} de ${year}`
        : 'Outros Lançamentos';
      
      if (!groups[key]) {
        groups[key] = {
          key,
          label,
          year,
          month,
          items: [],
          totalAmount: 0
        };
      }
      groups[key].items.push(exp);
      groups[key].totalAmount += Number(exp.amount) || 0;
    });
    
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredRealExpenses]);

  // Toggle single group accordion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      // Default to expanded (true) if undefined, so click flips it to false
      [groupKey]: prev[groupKey] === undefined ? false : !prev[groupKey]
    }));
  };

  // Expand or Collapse All groups
  const isAllGroupsExpanded = groupedExpenses.length > 0 && groupedExpenses.every(g => expandedGroups[g.key] !== false);

  const toggleAllGroups = () => {
    if (isAllGroupsExpanded) {
      // Collapse all
      const next: Record<string, boolean> = {};
      groupedExpenses.forEach(g => { next[g.key] = false; });
      setExpandedGroups(next);
    } else {
      // Expand all
      const next: Record<string, boolean> = {};
      groupedExpenses.forEach(g => { next[g.key] = true; });
      setExpandedGroups(next);
    }
  };

  const toggleTxExpand = (txId: string) => {
    setExpandedTxIds(prev => ({
      ...prev,
      [txId]: !prev[txId]
    }));
  };

  // Categories in real expenses, property expenses & fixed expenses
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();

    // Standard property & household categories
    [
      'Luz',
      'Eletricidade',
      'Água',
      'Gás',
      'Condomínio',
      'IMI',
      'Seguro Multirriscos',
      'Seguros',
      'Manutenção',
      'Telecomunicações / Internet',
      'Internet',
      'Habitação',
      'Limpeza',
      'Obras / Reparações',
      'Segurança / Alarme',
      'Jardinagem',
      'Impostos',
      'Outro',
      'Outros'
    ].forEach(c => cats.add(c));

    // Categories present in real expenses
    realExpenses.forEach((e: any) => {
      if (e.category) cats.add(e.category);
    });

    // Categories present in property expenses
    (propertyExpenses || []).forEach((pe: any) => {
      if (pe.category) cats.add(pe.category);
    });

    // Categories present in fixed expenses linked to this property
    (fixedExpenses || []).forEach((fe: any) => {
      if (fe.category) cats.add(fe.category);
    });

    return Array.from(cats).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }, [realExpenses, propertyExpenses, fixedExpenses]);

  // 2. Budgeted / Predicted Costs Calculation
  const pExpensesForAsset = useMemo(() => {
    return propertyExpenses.filter(e => String(e.assetId) === String(asset.id));
  }, [propertyExpenses, asset.id]);

  const annualPredictedExpenses = useMemo(() => {
    return pExpensesForAsset.reduce((sum, e) => {
      const amount = Number(e.amount) || 0;
      const freq = (e.frequency || 'mensal').toLowerCase();
      if (freq === 'pontual') return sum + amount;
      return sum + (
        freq === 'mensal' ? amount * 12 : 
        freq === 'trimestral' ? amount * 4 : 
        freq === 'semestral' ? amount * 2 : 
        amount
      );
    }, 0);
  }, [pExpensesForAsset]);

  const monthlyPredictedExpenses = useMemo(() => {
    return pExpensesForAsset.reduce((sum, e) => {
      const amount = Number(e.amount) || 0;
      const freq = (e.frequency || 'mensal').toLowerCase();
      if (freq === 'pontual') return sum;
      return sum + (
        freq === 'mensal' ? amount : 
        freq === 'trimestral' ? amount / 3 : 
        freq === 'semestral' ? amount / 6 : 
        amount / 12
      );
    }, 0);
  }, [pExpensesForAsset]);

  // 3. Real Expenses Totals
  const totalRealPaidAllTime = useMemo(() => {
    return realExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [realExpenses]);

  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = `${currentYearStr}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const totalRealPaidCurrentYear = useMemo(() => {
    return realExpenses
      .filter((e: any) => (e.date || '').startsWith(currentYearStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [realExpenses, currentYearStr]);

  const totalRealPaidCurrentMonth = useMemo(() => {
    return realExpenses
      .filter((e: any) => (e.date || '').startsWith(currentMonthStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [realExpenses, currentMonthStr]);

  const totalFilteredRealPaid = useMemo(() => {
    return filteredRealExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredRealExpenses]);

  // Compare Real vs Predicted for the selected period
  const comparisonYear = selectedYear === 'all' ? currentYearStr : selectedYear;
  const realPaidForComp = selectedYear === 'all' 
    ? totalRealPaidCurrentYear 
    : realExpenses
        .filter((e: any) => (e.date || '').startsWith(selectedYear))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const varianceAmount = realPaidForComp - annualPredictedExpenses;
  const variancePercent = annualPredictedExpenses > 0 
    ? (varianceAmount / annualPredictedExpenses) * 100 
    : 0;
  
  const isOverBudget = varianceAmount > 0;
  const isUnderBudget = varianceAmount < 0;

  return (
    <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-xl overflow-hidden border border-border/40">
      {/* Top Banner / Header */}
      <div className="p-6 sm:p-8 pb-6 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-sm shrink-0">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Custos Reais Pagos
                </h3>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronizado com Finanças
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registo de pagamentos e despesas efetivas realizadas em <strong className="text-foreground">{asset.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/financas')}
              className="rounded-2xl h-10 px-4 gap-2 text-xs font-bold border-border/60 hover:bg-secondary/50 text-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              Ver em Finanças
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-2xl h-10 w-10 hover:bg-secondary/50 text-muted-foreground"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Head-to-Head Comparison Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Real Paid This Year */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Real Pago ({comparisonYear})
              </span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              {maskValue(realPaidForComp, formatter.format)}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/80 mt-1">
              {realExpenses.filter((e: any) => (e.date || '').startsWith(comparisonYear)).length} pagamentos realizados
            </p>
          </div>

          {/* Card 2: Previsão Anual Contratual */}
          <div className="p-4 sm:p-5 rounded-2xl bg-secondary/40 border border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Previsão Anual
              </span>
              <div className="w-6 h-6 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {maskValue(annualPredictedExpenses, formatter.format)}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/80 mt-1">
              Encargos fixos e pontuais orçamentados
            </p>
          </div>

          {/* Card 3: Desvio Real vs Previsão */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isUnderBudget 
              ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20' 
              : isOverBudget 
                ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20' 
                : 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Desvio Real vs Previsão
              </span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isUnderBudget 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : isOverBudget 
                    ? 'bg-rose-500/10 text-rose-600' 
                    : 'bg-blue-500/10 text-blue-600'
              }`}>
                {isUnderBudget ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div className={`text-2xl font-black tracking-tight ${
              isUnderBudget ? 'text-emerald-600 dark:text-emerald-400' : isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600'
            }`}>
              {varianceAmount > 0 ? '+' : ''}{maskValue(varianceAmount, formatter.format)}
            </div>
            <p className={`text-[10px] font-bold mt-1 ${
              isUnderBudget ? 'text-emerald-600' : isOverBudget ? 'text-rose-600' : 'text-blue-600'
            }`}>
              {isUnderBudget 
                ? `Poupança de ${Math.abs(variancePercent).toFixed(1)}%` 
                : isOverBudget 
                  ? `Derrapagem de +${variancePercent.toFixed(1)}%` 
                  : 'Dentro da previsão'}
            </p>
          </div>

          {/* Card 4: Mês Atual */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Mês Atual Real
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {maskValue(totalRealPaidCurrentMonth, formatter.format)}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/80 mt-1">
              Previsto mensal: {maskValue(monthlyPredictedExpenses, formatter.format)}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Content: Filters + Grouped Accordions of Real Transactions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 sm:p-8 space-y-6"
          >
            {/* Filter Bar with Years, Months, Categories & Search */}
            <div className="space-y-3 bg-secondary/20 p-4 rounded-3xl border border-border/40">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Years Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Ano:
                  </span>
                  <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50">
                    <Button
                      type="button"
                      variant={selectedYear === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setSelectedYear('all');
                        setSelectedMonth('all');
                      }}
                      className="h-7 px-2.5 rounded-lg text-xs font-bold"
                    >
                      Todos
                    </Button>
                    {availableYears.map(yr => (
                      <Button
                        key={yr}
                        type="button"
                        variant={selectedYear === yr ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedYear(yr)}
                        className="h-7 px-2.5 rounded-lg text-xs font-bold"
                      >
                        {yr}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search & Category */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter */}
                  {availableCategories.length > 0 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-secondary/50 border border-border/50 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="all">Todas as Categorias</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}

                  {/* Search Field */}
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Pesquisar lançamentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 rounded-xl bg-secondary/40 border-border/50 text-xs"
                    >
                    </Input>
                  </div>
                </div>
              </div>

              {/* Month Selector Pills */}
              <div className="pt-2 border-t border-border/30 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Mês:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {MONTHS_LIST.map(m => {
                    const isSelected = selectedMonth === m.value;
                    const hasData = m.value === 'all' || availableMonths.has(m.value);
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setSelectedMonth(m.value)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : hasData
                              ? 'bg-secondary/60 hover:bg-secondary text-foreground hover:text-primary'
                              : 'bg-transparent text-muted-foreground/50 hover:bg-secondary/30'
                        }`}
                      >
                        {m.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List / Grouped Accordions of Real Expenses */}
            {groupedExpenses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>{filteredRealExpenses.length} Lançamentos em {groupedExpenses.length} {groupedExpenses.length === 1 ? 'Período' : 'Períodos'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Total: <strong className="text-foreground">{maskValue(totalFilteredRealPaid, formatter.format)}</strong></span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllGroups}
                      className="h-7 px-2 text-[11px] font-black uppercase tracking-wider gap-1 hover:bg-secondary/50 rounded-lg text-primary"
                    >
                      {isAllGroupsExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Recolher Todos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Expandir Todos
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Group Accordions */}
                <div className="space-y-3">
                  {groupedExpenses.map((group) => {
                    // Group is expanded by default (unless explicitly false)
                    const isGroupOpen = expandedGroups[group.key] !== false;

                    return (
                      <div 
                        key={group.key}
                        className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden shadow-sm transition-all"
                      >
                        {/* Group Header / Expand Arrow */}
                        <div 
                          onClick={() => toggleGroup(group.key)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-foreground flex items-center gap-2">
                                {group.label}
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground border border-border/40">
                                  {group.items.length} {group.items.length === 1 ? 'lançamento' : 'lançamentos'}
                                </span>
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                -{maskValue(group.totalAmount, formatter.format)}
                              </span>
                            </div>
                            <div className={`w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Group Items Accordion Content */}
                        <AnimatePresence initial={false}>
                          {isGroupOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                              <div className="divide-y divide-border/40 border-t border-border/30 bg-card/40">
                                {group.items.map((exp: any) => {
                                  const expDate = exp.date ? new Date(exp.date).toLocaleDateString('pt-PT') : 'Data não def.';
                                  const isFromFixed = Boolean(exp.fixedExpenseId || exp.recurring);
                                  const displayName = exp.name || exp.description || exp.entity || 'Despesa';
                                  const displayEntity = (exp.entity && exp.entity !== displayName) ? exp.entity : '';
                                  const isTxDetailsOpen = expandedTxIds[exp.id] === true;

                                  return (
                                    <div 
                                      key={exp.id}
                                      className="p-4 sm:p-5 hover:bg-secondary/20 transition-colors"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3.5 min-w-0">
                                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/20">
                                            <CreditCard className="w-5 h-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h5 className="font-bold text-sm text-foreground truncate" title={displayName}>
                                                {displayName}
                                              </h5>
                                              {isFromFixed && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                  Despesa Fixa Realizada
                                                </span>
                                              )}
                                              {exp.category && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border/40">
                                                  {exp.category}
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                              <span className="flex items-center gap-1 font-medium">
                                                <Calendar className="w-3 h-3 text-muted-foreground/70" />
                                                {expDate}
                                              </span>
                                              {displayEntity && (
                                                <span className="text-foreground/75 font-medium">· {displayEntity}</span>
                                              )}
                                              {exp.method && (
                                                <span>· {exp.method}</span>
                                              )}
                                              {exp.notes && !isTxDetailsOpen && (
                                                <span className="text-muted-foreground/80 italic truncate max-w-md">
                                                  · "{exp.notes}"
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
                                          <div className="text-left sm:text-right">
                                            <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                              -{maskValue(Number(exp.amount) || 0, formatter.format)}
                                            </span>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                              Valor Real Pago
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => toggleTxExpand(exp.id)}
                                            className="w-7 h-7 rounded-lg hover:bg-secondary/60 flex items-center justify-center text-muted-foreground transition-all"
                                            title="Ver detalhes do lançamento"
                                          >
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isTxDetailsOpen ? 'rotate-180 text-primary' : ''}`} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Transaction Detail Card */}
                                      <AnimatePresence>
                                        {isTxDetailsOpen && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground space-y-1.5 bg-secondary/15 p-3 rounded-xl"
                                          >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 block">Nome Registado:</span>
                                                <span className="font-bold text-foreground">{exp.name || exp.description || '—'}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 block">Entidade / Beneficiário:</span>
                                                <span className="font-bold text-foreground">{exp.entity || '—'}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 block">Método de Pagamento:</span>
                                                <span className="font-bold text-foreground">{exp.method || exp.paymentMethod || '—'}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 block">Origem do Registo:</span>
                                                <span className="font-bold text-foreground">{isFromFixed ? 'Despesa Fixa / Contrato' : 'Despesa Pontual'}</span>
                                              </div>
                                            </div>
                                            {exp.notes && (
                                              <div className="pt-1.5 border-t border-border/20">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 block">Notas & Observações:</span>
                                                <p className="font-medium text-foreground italic mt-0.5">"{exp.notes}"</p>
                                              </div>
                                            )}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 rounded-2xl border border-dashed border-border/60 bg-muted/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/30 text-muted-foreground flex items-center justify-center mx-auto">
                  <Receipt className="w-6 h-6 opacity-40" />
                </div>
                <h4 className="font-bold text-base text-foreground">
                  Nenhum custo real pago encontrado
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {searchTerm || selectedCategory !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all'
                    ? 'Não existem despesas registadas para os filtros de ano, mês ou pesquisa selecionados.'
                    : 'Quando regista ou edita despesas e encargos na página Finanças / Despesas Fixas, os pagamentos reais aparecem aqui automaticamente com os valores efetivamente pagos.'}
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/financas')}
                    className="rounded-xl font-bold text-xs gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ir para Finanças
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
