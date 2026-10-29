import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { 
  useExpenses, 
  useIncomes, 
  useFixedExpenses, 
  useFixedIncomes, 
  useAssets, 
  useVehicles, 
  useVehicleTasks, 
  useBudgets, 
  useAccounts,
  useAuditAlerts
} from '../hooks/queries';
import { useTrash } from '../contexts/TrashContext';
import { usePrivacy, useDashboard } from '../contexts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Wallet, 
  Car, 
  Copy, 
  Trash2, 
  RefreshCw, 
  FileSpreadsheet, 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  Activity, 
  ChevronRight, 
  Sparkles, 
  ExternalLink,
  Printer,
  Sliders,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  scheduleSheetsBackgroundSync, 
  getStoredSpreadsheetId, 
  getSyncStatus
} from '../lib/googleSheetsDataService';
import { getCachedDriveToken } from '../lib/googleDriveService';
import { useNavigate } from 'react-router-dom';

export default function AuditoriaView() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const navigate = useNavigate();

  const { expenses, deleteExpense } = useExpenses();
  const { incomes } = useIncomes();
  const { fixedExpenses } = useFixedExpenses();
  const { fixedIncomes } = useFixedIncomes();
  const { assets } = useAssets();
  const { vehicles } = useVehicles();
  const { vehicleTasks } = useVehicleTasks();
  const { budgets } = useBudgets();
  const { accounts } = useAccounts();
  const { moveToTrash } = useTrash();
  const { auditAlerts, saveAuditAlerts } = useAuditAlerts();

  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'health' | 'duplicates' | 'budgets' | 'deadlines' | 'sheets'>('health');
  const [whitelistedDuplicates, setWhitelistedDuplicates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fin_audit_whitelisted_dups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currencyFormatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const percentFormatter = new Intl.NumberFormat('pt-PT', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const notify = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // ----------------------------------------------------------------------
  // 1. CALCULATE FINANCIAL HEALTH PILLARS (0 - 100)
  // ----------------------------------------------------------------------
  const healthMetrics = useMemo(() => {
    // Current & Recent data calculations
    const now = new Date();
    const currentMonthPrefix = currentMonth || now.toISOString().slice(0, 7);

    // Liquid balances
    const totalLiquidCash = accounts.reduce((sum: number, acc: any) => {
      const b = Number(acc.balance || 0);
      return acc.active !== false && !isNaN(b) ? sum + b : sum;
    }, 0);

    // Monthly fixed commitments
    const monthlyFixedCommitments = fixedExpenses.reduce((sum: number, fe: any) => {
      if (fe.active === false) return sum;
      const amt = Number(fe.amount || 0);
      const freq = (fe.frequency || 'mensal').toLowerCase();
      if (freq === 'anual') return sum + amt / 12;
      if (freq === 'trimestral') return sum + amt / 3;
      if (freq === 'semestral') return sum + amt / 6;
      return sum + amt;
    }, 0);

    // Monthly fixed income
    const monthlyFixedIncome = fixedIncomes.reduce((sum: number, fi: any) => {
      if (fi.active === false) return sum;
      const amt = Number(fi.amount || 0);
      const freq = (fi.frequency || 'mensal').toLowerCase();
      if (freq === 'anual') return sum + amt / 12;
      return sum + amt;
    }, 0);

    // Actual month expenses and incomes
    const monthExpensesTotal = expenses
      .filter((e: any) => e.date && e.date.startsWith(currentMonthPrefix))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    const monthIncomesTotal = incomes
      .filter((i: any) => i.date && i.date.startsWith(currentMonthPrefix))
      .reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);

    const effectiveMonthlyExpense = monthlyFixedCommitments > 0 ? monthlyFixedCommitments : (monthExpensesTotal || 1000);
    const effectiveMonthlyIncome = monthlyFixedIncome > 0 ? monthlyFixedIncome : (monthIncomesTotal || 1500);

    // --- Pillar 1: Fundo de Emergência & Runway (Max 25 pts) ---
    const runwayMonths = effectiveMonthlyExpense > 0 ? totalLiquidCash / effectiveMonthlyExpense : 0;
    let runwayScore = 0;
    let runwayBadge = 'Insuficiente';
    if (runwayMonths >= 6) {
      runwayScore = 25;
      runwayBadge = 'Excelente (>6 meses)';
    } else if (runwayMonths >= 4) {
      runwayScore = 20;
      runwayBadge = 'Bom (4 a 6 meses)';
    } else if (runwayMonths >= 2) {
      runwayScore = 12;
      runwayBadge = 'Moderado (2 a 4 meses)';
    } else {
      runwayScore = Math.max(3, Math.round(runwayMonths * 5));
      runwayBadge = 'Crítico (<2 meses)';
    }

    // --- Pillar 2: Taxa de Poupança & Aporte (Max 25 pts) ---
    const savingsNet = monthIncomesTotal > 0 ? (monthIncomesTotal - monthExpensesTotal) : (effectiveMonthlyIncome - effectiveMonthlyExpense);
    const baseIncomeForSavings = monthIncomesTotal > 0 ? monthIncomesTotal : effectiveMonthlyIncome;
    const savingsRate = baseIncomeForSavings > 0 ? Math.max(0, savingsNet / baseIncomeForSavings) : 0;
    let savingsScore = 0;
    let savingsBadge = 'Muito Baixa';
    if (savingsRate >= 0.30) {
      savingsScore = 25;
      savingsBadge = 'Excelente (≥30%)';
    } else if (savingsRate >= 0.20) {
      savingsScore = 20;
      savingsBadge = 'Muito Boa (20-30%)';
    } else if (savingsRate >= 0.10) {
      savingsScore = 14;
      savingsBadge = 'Razoável (10-20%)';
    } else if (savingsRate > 0) {
      savingsScore = 8;
      savingsBadge = 'Baixa (<10%)';
    } else {
      savingsScore = 2;
      savingsBadge = 'Défice Mensal';
    }

    // --- Pillar 3: Rácio de Encargos Fixos & Alavancagem (Max 25 pts) ---
    const fixedRatio = effectiveMonthlyIncome > 0 ? monthlyFixedCommitments / effectiveMonthlyIncome : 0.6;
    let fixedScore = 0;
    let fixedBadge = 'Elevada';
    if (fixedRatio <= 0.40) {
      fixedScore = 25;
      fixedBadge = 'Ótimo (≤40% da renda)';
    } else if (fixedRatio <= 0.55) {
      fixedScore = 19;
      fixedBadge = 'Equilibrado (40-55%)';
    } else if (fixedRatio <= 0.70) {
      fixedScore = 12;
      fixedBadge = 'Alerta (55-70%)';
    } else {
      fixedScore = 5;
      fixedBadge = 'Crítico (>70%)';
    }

    // --- Pillar 4: Diversificação Patrimonial (Max 25 pts) ---
    const assetCategories = new Set<string>();
    if (totalLiquidCash > 200) assetCategories.add('liquidez');
    assets.forEach((a: any) => {
      const cat = (a.category || a.subType || '').toLowerCase();
      if (cat.includes('imovel') || cat.includes('imóvel') || cat.includes('terreno') || cat.includes('moradia')) {
        assetCategories.add('imobiliario');
      } else if (cat.includes('ação') || cat.includes('acoes') || cat.includes('etf') || cat.includes('fundo') || cat.includes('bolsa')) {
        assetCategories.add('mercado');
      } else if (cat.includes('cripto') || cat.includes('bitcoin')) {
        assetCategories.add('cripto');
      } else if (cat.includes('aforro') || cat.includes('tesouro') || cat.includes('ppr') || cat.includes('prazo')) {
        assetCategories.add('renda_fixa');
      } else {
        assetCategories.add('outros');
      }
    });

    let diversificationScore = 0;
    let diversificationBadge = 'Pouco Diversificado';
    const distinctClasses = assetCategories.size;
    if (distinctClasses >= 4) {
      diversificationScore = 25;
      diversificationBadge = 'Excelente (4+ classes)';
    } else if (distinctClasses === 3) {
      diversificationScore = 19;
      diversificationBadge = 'Bom (3 classes)';
    } else if (distinctClasses === 2) {
      diversificationScore = 13;
      diversificationBadge = 'Moderado (2 classes)';
    } else {
      diversificationScore = 6;
      diversificationBadge = 'Concentrado (1 classe)';
    }

    // Total Overall Score (0-100)
    const totalScore = Math.min(100, Math.max(0, runwayScore + savingsScore + fixedScore + diversificationScore));

    let ratingGrade = 'Crítico';
    let ratingCode = 'C';
    let ratingColor = 'text-rose-500';
    let ratingBg = 'bg-rose-500/10 border-rose-500/20';

    if (totalScore >= 85) {
      ratingGrade = 'Excelente';
      ratingCode = 'AAA';
      ratingColor = 'text-emerald-500';
      ratingBg = 'bg-emerald-500/10 border-emerald-500/20';
    } else if (totalScore >= 70) {
      ratingGrade = 'Muito Bom';
      ratingCode = 'AA';
      ratingColor = 'text-blue-500';
      ratingBg = 'bg-blue-500/10 border-blue-500/20';
    } else if (totalScore >= 50) {
      ratingGrade = 'Equilibrado';
      ratingCode = 'A';
      ratingColor = 'text-amber-500';
      ratingBg = 'bg-amber-500/10 border-amber-500/20';
    } else if (totalScore >= 35) {
      ratingGrade = 'Vulnerável';
      ratingCode = 'B';
      ratingColor = 'text-orange-500';
      ratingBg = 'bg-orange-500/10 border-orange-500/20';
    }

    return {
      totalScore,
      ratingGrade,
      ratingCode,
      ratingColor,
      ratingBg,
      runwayMonths,
      runwayScore,
      runwayBadge,
      savingsRate,
      savingsScore,
      savingsBadge,
      fixedRatio,
      fixedScore,
      fixedBadge,
      distinctClasses,
      diversificationScore,
      diversificationBadge,
      totalLiquidCash,
      monthlyFixedCommitments,
      monthExpensesTotal,
      monthIncomesTotal
    };
  }, [accounts, fixedExpenses, fixedIncomes, expenses, incomes, assets, currentMonth]);

  // ----------------------------------------------------------------------
  // 2. DETECT POTENTIAL DUPLICATE EXPENSES
  // ----------------------------------------------------------------------
  const potentialDuplicates = useMemo(() => {
    const list = [...expenses].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const duplicatesGroup: Array<{
      original: any;
      duplicate: any;
      matchReason: string;
      pairKey: string;
    }> = [];

    const seenIds = new Set<string>();

    for (let i = 0; i < list.length; i++) {
      const expA = list[i];
      if (!expA || seenIds.has(expA.id)) continue;

      const dateA = new Date(expA.date).getTime();
      const amountA = Number(expA.amount || 0);
      if (amountA <= 0) continue;

      for (let j = i + 1; j < list.length; j++) {
        const expB = list[j];
        if (!expB || seenIds.has(expB.id)) continue;

        const dateB = new Date(expB.date).getTime();
        const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);

        // Scan transactions within a 3-day window with exact same amount
        if (diffDays <= 3) {
          const amountB = Number(expB.amount || 0);
          if (Math.abs(amountA - amountB) < 0.01) {
            const sameCategory = (expA.category || '').toLowerCase() === (expB.category || '').toLowerCase();
            const sameEntity = (expA.entity || '').toLowerCase() === (expB.entity || '').toLowerCase();
            const sameDesc = (expA.name || expA.description || '').toLowerCase() === (expB.name || expB.description || '').toLowerCase();

            if (sameCategory || sameEntity || sameDesc) {
              const pairKey = [expA.id, expB.id].sort().join('___');
              if (!whitelistedDuplicates.includes(pairKey)) {
                duplicatesGroup.push({
                  original: expB,
                  duplicate: expA,
                  matchReason: sameEntity ? `Mesma entidade e valor (€ ${amountA.toFixed(2)}) com intervalo de ${Math.round(diffDays)} dia(s)` : `Mesma categoria e valor idêntico`,
                  pairKey
                });
                seenIds.add(expA.id);
                seenIds.add(expB.id);
                break;
              }
            }
          }
        }
      }
    }

    return duplicatesGroup;
  }, [expenses, whitelistedDuplicates]);

  // ----------------------------------------------------------------------
  // 3. BUDGET OVERRUN AUDITING
  // ----------------------------------------------------------------------
  const budgetAlerts = useMemo(() => {
    const currentMonthPrefix = currentMonth || new Date().toISOString().slice(0, 7);
    const categorySpending: Record<string, number> = {};

    expenses.forEach((e: any) => {
      if (e.date && e.date.startsWith(currentMonthPrefix)) {
        const cat = e.category || 'Outros';
        categorySpending[cat] = (categorySpending[cat] || 0) + (Number(e.amount) || 0);
      }
    });

    return budgets.map((b: any) => {
      const limit = Number(b.amount || b.limit || 0);
      const spent = categorySpending[b.category] || 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const isOver = spent > limit;
      const isWarning = !isOver && percent >= 80;

      return {
        ...b,
        spent,
        limit,
        percent,
        isOver,
        isWarning
      };
    }).filter((b: any) => b.isOver || b.isWarning).sort((a: any, b: any) => b.percent - a.percent);
  }, [budgets, expenses, currentMonth]);

  // ----------------------------------------------------------------------
  // 4. VEHICLE DEADLINES & UPCOMING CONTRACTS (IUC, IPO, MANUTENÇÃO)
  // ----------------------------------------------------------------------
  const vehicleDeadlines = useMemo(() => {
    const now = new Date();
    const alertDaysLimit = 60;

    return vehicleTasks.map((t: any) => {
      const dueDateStr = t.dueDate || t.nextDueDate;
      if (!dueDateStr) return null;

      const due = new Date(dueDateStr);
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= alertDaysLimit && t.status !== 'concluida' && t.status !== 'concluido') {
        const matchedVehicle = vehicles.find((v: any) => String(v.id) === String(t.vehicleId));
        return {
          ...t,
          daysRemaining: diffDays,
          isExpired: diffDays < 0,
          vehiclePlate: matchedVehicle?.plate || matchedVehicle?.matricula || 'Viatura',
          vehicleName: matchedVehicle ? `${matchedVehicle.make || matchedVehicle.marca || ''} ${matchedVehicle.model || matchedVehicle.modelo || ''}`.trim() : 'Viatura'
        };
      }
      return null;
    }).filter(Boolean).sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);
  }, [vehicleTasks, vehicles]);

  // ----------------------------------------------------------------------
  // ACTIONS: RESOLVE DUPLICATE (DELETE EXPENSE)
  // ----------------------------------------------------------------------
  const handleDeleteDuplicate = async (expToDelete: any, pairKey: string) => {
    try {
      // 1. Move to trash
      await moveToTrash(
        'Movimentos',
        expToDelete.id,
        expToDelete,
        expToDelete.description || expToDelete.name || expToDelete.category || 'Despesa Duplicada'
      );

      // 2. Delete from expenses collection
      await deleteExpense(expToDelete.id);

      notify('Registo duplicado eliminado e movido para a reciclagem.', 'success');
      scheduleSheetsBackgroundSync();
    } catch (err: any) {
      notify('Erro ao eliminar duplicado: ' + err.message, 'info');
    }
  };

  const handleWhitelistDuplicate = (pairKey: string) => {
    const updated = [...whitelistedDuplicates, pairKey];
    setWhitelistedDuplicates(updated);
    localStorage.setItem('fin_audit_whitelisted_dups', JSON.stringify(updated));
    notify('Transação marcada como legítima.', 'info');
  };

  // ----------------------------------------------------------------------
  // EXPORT AUDIT FINDINGS TO GOOGLE SHEETS TAB 'Auditoria_Alertas'
  // ----------------------------------------------------------------------
  const handleExportAuditToSheets = async () => {
    const token = getCachedDriveToken();
    const spreadsheetId = getStoredSpreadsheetId();

    if (!token || !spreadsheetId) {
      notify('Google Sheets não está ligado. Ligue a folha nas Configurações.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      // Generate compiled audit alerts for Google Sheets
      const compiledAlerts = [
        ...potentialDuplicates.map((dup, idx) => ({
          id: `dup_${idx}_${Date.now()}`,
          dateDetected: new Date().toISOString().slice(0, 10),
          type: 'duplicate',
          severity: 'high' as const,
          title: `Possível Duplicado: ${dup.duplicate.name || dup.duplicate.entity}`,
          description: `${dup.matchReason}. Registo em ${dup.duplicate.date} de ${currencyFormatter.format(dup.duplicate.amount)}`,
          resolved: false
        })),
        ...budgetAlerts.map((b, idx) => ({
          id: `bud_${idx}_${Date.now()}`,
          dateDetected: new Date().toISOString().slice(0, 10),
          type: 'budget_overrun',
          severity: b.isOver ? ('critical' as const) : ('medium' as const),
          title: b.isOver ? `Orçamento Excedido: ${b.category}` : `Orçamento Quase Esgotado: ${b.category}`,
          description: `Gasto ${currencyFormatter.format(b.spent)} de limite ${currencyFormatter.format(b.limit)} (${b.percent.toFixed(0)}%)`,
          resolved: false
        })),
        ...vehicleDeadlines.map((v, idx) => ({
          id: `veh_${idx}_${Date.now()}`,
          dateDetected: new Date().toISOString().slice(0, 10),
          type: 'vehicle_deadline',
          severity: v.isExpired ? ('critical' as const) : ('high' as const),
          title: `Prazo Viatura: ${v.title} (${v.vehiclePlate})`,
          description: v.isExpired ? `Prazo expirado há ${Math.abs(v.daysRemaining)} dias!` : `Faltam ${v.daysRemaining} dias para a data limite`,
          resolved: false
        })),
        {
          id: `health_score_${Date.now()}`,
          dateDetected: new Date().toISOString().slice(0, 10),
          type: 'health_score',
          severity: 'low' as const,
          title: `Diagnóstico Geral: ${healthMetrics.ratingGrade} (${healthMetrics.totalScore}/100)`,
          description: `Runway: ${healthMetrics.runwayMonths.toFixed(1)} meses | Taxa Poupança: ${(healthMetrics.savingsRate * 100).toFixed(1)}% | Encargos Fixos: ${(healthMetrics.fixedRatio * 100).toFixed(1)}%`,
          resolved: true
        }
      ];

      await saveAuditAlerts(compiledAlerts);
      await scheduleSheetsBackgroundSync(0, true);
      notify('Auditoria e Saúde Financeira gravadas com sucesso no Google Sheets!', 'success');
    } catch (err: any) {
      notify('Erro ao sincronizar auditoria: ' + err.message, 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Cockpit de Auditoria & Saúde Financeira" 
          subtitle="Diagnóstico em tempo real, deteção proativa de anomalias, prazos legais e sincronização institucional com a Google Sheet"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrintAudit} 
            className="gap-2 text-xs h-9 rounded-xl"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir Relatório
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={handleExportAuditToSheets}
            disabled={isSyncing}
            className="gap-2 text-xs h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/10"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            Registar na Google Sheet
          </Button>
        </div>
      </div>

      {/* Floating Feedback Notification */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md",
              feedbackMsg.type === 'success' 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SCORE & HIGHLIGHTS BANNER */}
      <Card className="border-border/60 bg-gradient-to-br from-card via-card/90 to-primary/5 shadow-xl rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score Ring Gauge */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-background/50 backdrop-blur-md rounded-2xl border border-border/40 shadow-inner">
              <div className="relative inline-flex items-center justify-center my-2">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    className="stroke-muted/20 fill-none"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="72"
                    cy="72"
                    r="58"
                    className={cn("fill-none", healthMetrics.ratingColor.replace('text-', 'stroke-'))}
                    strokeWidth="12"
                    strokeDasharray="364"
                    initial={{ strokeDashoffset: 364 }}
                    animate={{ strokeDashoffset: 364 - (364 * healthMetrics.totalScore) / 100 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black tracking-tight">{healthMetrics.totalScore}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">de 100</span>
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className={cn("text-xs font-black px-2 py-0.5 rounded-full border", healthMetrics.ratingBg, healthMetrics.ratingColor)}>
                    Rating {healthMetrics.ratingCode}
                  </span>
                  <span className="text-sm font-bold">{healthMetrics.ratingGrade}</span>
                </div>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  Diagnóstico holístico ponderado por solvência, capacidade de aporte, liquidez e resiliência.
                </p>
              </div>
            </div>

            {/* 4 Pillars Summary Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pillar 1 */}
              <div className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <Wallet className="w-4 h-4 text-blue-500" />
                    <span>Runway & Fundo Emergência</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {healthMetrics.runwayScore}/25 pts
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black">{healthMetrics.runwayMonths.toFixed(1)} meses</span>
                  <span className="text-xs text-muted-foreground">Saldo: {maskValue(currencyFormatter.format(healthMetrics.totalLiquidCash))}</span>
                </div>
                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(healthMetrics.runwayScore / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Status: <strong className="text-foreground">{healthMetrics.runwayBadge}</strong>
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>Taxa de Poupança Líquida</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {healthMetrics.savingsScore}/25 pts
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black">{percentFormatter.format(healthMetrics.savingsRate)}</span>
                  <span className="text-xs text-muted-foreground">Objetivo: ≥20%</span>
                </div>
                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(healthMetrics.savingsScore / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Status: <strong className="text-foreground">{healthMetrics.savingsBadge}</strong>
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Compromissos Fixos</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {healthMetrics.fixedScore}/25 pts
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black">{percentFormatter.format(healthMetrics.fixedRatio)}</span>
                  <span className="text-xs text-muted-foreground">da renda mensal</span>
                </div>
                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(healthMetrics.fixedScore / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Fixos: <strong className="text-foreground">{maskValue(currencyFormatter.format(healthMetrics.monthlyFixedCommitments))}/mês</strong> ({healthMetrics.fixedBadge})
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Diversificação de Ativos</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {healthMetrics.diversificationScore}/25 pts
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black">{healthMetrics.distinctClasses} classes</span>
                  <span className="text-xs text-muted-foreground">Ativos: {assets.length} registos</span>
                </div>
                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(healthMetrics.diversificationScore / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Status: <strong className="text-foreground">{healthMetrics.diversificationBadge}</strong>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS SWITCHER */}
      <div className="no-print flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('health')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
            activeTab === 'health' 
              ? "bg-foreground text-background shadow-md" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Activity className="w-4 h-4" /> Diagnóstico & Recomendações
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative",
            activeTab === 'duplicates' 
              ? "bg-foreground text-background shadow-md" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Copy className="w-4 h-4" /> Deteção de Duplicados
          {potentialDuplicates.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold">
              {potentialDuplicates.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative",
            activeTab === 'budgets' 
              ? "bg-foreground text-background shadow-md" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <AlertTriangle className="w-4 h-4" /> Orçamentos em Risco
          {budgetAlerts.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-bold">
              {budgetAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('deadlines')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative",
            activeTab === 'deadlines' 
              ? "bg-foreground text-background shadow-md" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Car className="w-4 h-4" /> Prazos Legais (IUC & IPO)
          {vehicleDeadlines.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-blue-500 text-white text-[10px] rounded-full font-bold">
              {vehicleDeadlines.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
            activeTab === 'sheets' 
              ? "bg-foreground text-background shadow-md" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileSpreadsheet className="w-4 h-4" /> Registo na Google Sheets
        </button>
      </div>

      {/* TAB CONTENT: 1. HEALTH DIAGNOSIS & ACTION PLAN */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recommendation 1: Runway */}
            <Card className="border-border/60 bg-card rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={healthMetrics.runwayMonths >= 6 ? "default" : "destructive"}>
                    {healthMetrics.runwayMonths >= 6 ? "Objetivo Cumprido" : "Requer Ação"}
                  </Badge>
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base mt-2">Fundo de Emergência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Dispõe de <strong>{healthMetrics.runwayMonths.toFixed(1)} meses</strong> de autonomia face aos seus encargos fixos mensais de {maskValue(currencyFormatter.format(healthMetrics.monthlyFixedCommitments))}.
                </p>
                {healthMetrics.runwayMonths < 6 ? (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    Sugestão: canalize os próximos excedentes de tesouraria para atingir pelo menos 6 meses de segurança ({maskValue(currencyFormatter.format(healthMetrics.monthlyFixedCommitments * 6))}).
                  </p>
                ) : (
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Excelente solidez de liquidez. O capital excedente aos 6 meses pode ser canalizado para investimentos de maior rendimento.
                  </p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/investimentos')}
                  className="w-full text-xs h-8 mt-2"
                >
                  Ver Carteira de Investimentos <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Recommendation 2: Savings Rate */}
            <Card className="border-border/60 bg-card rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={healthMetrics.savingsRate >= 0.20 ? "default" : "secondary"}>
                    {healthMetrics.savingsRate >= 0.20 ? "Alta Capacidade" : "Otimizável"}
                  </Badge>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base mt-2">Taxa de Poupança & Aporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Atualmente poupa <strong>{percentFormatter.format(healthMetrics.savingsRate)}</strong> dos seus rendimentos.
                </p>
                {healthMetrics.savingsRate < 0.20 ? (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    Para acelerar a sua independência financeira (FIRE), procure rever custos discricionários em categorias como Lazer e Restaurantes.
                  </p>
                ) : (
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                    A sua taxa de poupança está acima do benchmark recomendado (20%). O efeito do juro composto terá forte impacto na sua riqueza futura.
                  </p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/projecoes')}
                  className="w-full text-xs h-8 mt-2"
                >
                  Simular Independência FIRE <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Recommendation 3: Fixed Expenses & Subscriptions */}
            <Card className="border-border/60 bg-card rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={healthMetrics.fixedRatio <= 0.50 ? "default" : "outline"}>
                    {healthMetrics.fixedRatio <= 0.50 ? "Controlo Efetivo" : "Atenção a Custos"}
                  </Badge>
                  <Sliders className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base mt-2">Estrutura de Custos Fixos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Os seus compromissos fixos comprometem <strong>{percentFormatter.format(healthMetrics.fixedRatio)}</strong> da sua receita prevista.
                </p>
                <p className="text-foreground/80">
                  Total de {fixedExpenses.length} despesas fixas ativas. Recomendamos renegociar contratos de telecomunicações, seguros e eletricidade a cada 12 meses.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/despesas-fixas')}
                  className="w-full text-xs h-8 mt-2"
                >
                  Gerir Despesas Fixas <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. POTENTIAL DUPLICATES DETECTOR */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold">Deteção Inteligente de Despesas Duplicadas</h3>
              <p className="text-xs text-muted-foreground">
                Algoritmo heurístico que identifica transações com valores idênticos e mesma entidade/categoria no intervalo de 3 dias.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-bold">
              {potentialDuplicates.length} caso(s) em análise
            </Badge>
          </div>

          {potentialDuplicates.length === 0 ? (
            <Card className="border-border/60 bg-card rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Sem Duplicados Detetados</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Todas as transações do seu extrato parecem ser legítimas e não foram encontrados lançamentos idênticos repetidos em datas próximas.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {potentialDuplicates.map(({ original, duplicate, matchReason, pairKey }, index) => (
                <Card key={pairKey || index} className="border-amber-500/30 bg-amber-500/5 rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-sm text-foreground">
                          {duplicate.name || duplicate.entity || 'Despesa'}
                        </span>
                        <Badge variant="destructive" className="text-[10px] font-bold">
                          {maskValue(currencyFormatter.format(duplicate.amount))}
                        </Badge>
                      </div>

                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        {matchReason}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-background/70 p-3 rounded-xl border border-border/40">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">Transação A (Original):</span>
                          <strong>{original.date}</strong> &bull; {original.entity} &bull; <span className="text-muted-foreground">{original.category}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-rose-500 block">Transação B (Possível Duplicado):</span>
                          <strong>{duplicate.date}</strong> &bull; {duplicate.entity} &bull; <span className="text-muted-foreground">{duplicate.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWhitelistDuplicate(pairKey)}
                        className="text-xs h-9 rounded-xl hover:bg-background"
                      >
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> É Legítimo
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDuplicate(duplicate, pairKey)}
                        className="text-xs h-9 rounded-xl gap-1.5 font-bold shadow-md shadow-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar Duplicado
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. BUDGET OVERRUN AUDITING */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold">Monitorização Contínua de Orçamentos</h3>
              <p className="text-xs text-muted-foreground">
                Categorias que já ultrapassaram o teto estipulado ou atingiram o limiar crítico de 80%.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/orcamentos')}
              className="text-xs h-8 rounded-xl"
            >
              Gerir Todos os Orçamentos <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {budgetAlerts.length === 0 ? (
            <Card className="border-border/60 bg-card rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Orçamentos sob Controlo</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Nenhuma categoria atingiu 80% do teto mensal para o período de {currentMonth}.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgetAlerts.map((b: any) => (
                <Card key={b.id || b.category} className={cn(
                  "border rounded-2xl p-5 space-y-3 shadow-sm",
                  b.isOver ? "border-rose-500/30 bg-rose-500/5" : "border-amber-500/30 bg-amber-500/5"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{b.category}</span>
                    <Badge variant={b.isOver ? "destructive" : "secondary"} className="text-[10px] font-bold">
                      {b.isOver ? "Ultrapassado!" : "Atenção (≥80%)"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Execução:</span>
                      <span className="font-bold">{maskValue(currencyFormatter.format(b.spent))} de {maskValue(currencyFormatter.format(b.limit))}</span>
                    </div>

                    <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", b.isOver ? "bg-rose-500" : "bg-amber-500")}
                        style={{ width: `${Math.min(100, b.percent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{b.isOver ? `Excesso de ${maskValue(currencyFormatter.format(b.spent - b.limit))}` : `Disponível: ${maskValue(currencyFormatter.format(b.limit - b.spent))}`}</span>
                    <span className="font-bold">{b.percent.toFixed(0)}%</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. VEHICLE DEADLINES (IUC & IPO) */}
      {activeTab === 'deadlines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold">Auditoria de Prazos Legais e Manutenção</h3>
              <p className="text-xs text-muted-foreground">
                Avisos automáticos para Inspeção Periódica Obrigatória (IPO), Imposto Único de Circulação (IUC) e revisões agendadas.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/viaturas')}
              className="text-xs h-8 rounded-xl"
            >
              Aceder às Viaturas <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {vehicleDeadlines.length === 0 ? (
            <Card className="border-border/60 bg-card rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Sem Prazos Urgentes</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Não existem inspeções periódicas ou pagamentos de IUC previstos para os próximos 60 dias.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicleDeadlines.map((item: any, index: number) => (
                <Card key={item.id || index} className={cn(
                  "border rounded-2xl p-5 space-y-2",
                  item.isExpired ? "border-rose-500/40 bg-rose-500/5" : "border-blue-500/30 bg-blue-500/5"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{item.title}</span>
                    <Badge variant={item.isExpired ? "destructive" : "outline"} className="text-[10px] font-bold">
                      {item.isExpired ? "Expirado!" : `${item.daysRemaining} dias`}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Viatura: <strong>{item.vehicleName}</strong> ({item.vehiclePlate}) &bull; Data Limite: <strong>{item.dueDate || item.nextDueDate}</strong>
                  </p>

                  {item.cost > 0 && (
                    <p className="text-xs text-foreground font-semibold">
                      Custo Estimado: {maskValue(currencyFormatter.format(item.cost))}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 5. GOOGLE SHEETS AUDIT REGISTRY */}
      {activeTab === 'sheets' && (
        <Card className="border-border/60 bg-card rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Sincronização Institucional com Google Sheets
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Folha conectada: <strong>{getStoredSpreadsheetId() || 'Nenhuma selecionada'}</strong>
              </p>
            </div>

            <Button
              onClick={handleExportAuditToSheets}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Sincronizar Agora com Google Sheets
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Estrutura de Abas Atualizada na Folha de Cálculo:
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { name: 'Despesas', desc: 'Com Parcelas, Tags e Recorrência' },
                { name: 'Patrimonio', desc: 'Com Quantidade, Preço Médio e Ticker' },
                { name: 'Auditoria_Alertas', desc: 'Snapshots de Saúde e Anomalias' },
                { name: 'Dashboard_Calculos', desc: 'Totais de Portfólio e P&L em Tempo Real' },
                { name: 'Receitas_Pontuais', desc: 'Entradas avulso' },
                { name: 'Receitas_Fixas_Registadas', desc: 'Execuções de ordenados/pensões' },
                { name: 'Veiculos_Tarefas', desc: 'Prazos legais IUC e IPO' },
                { name: 'Orcamentos', desc: 'Tetos e limites mensais' },
              ].map(sheet => (
                <div key={sheet.name} className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-0.5">
                  <span className="font-bold text-foreground block">{sheet.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight block">{sheet.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
