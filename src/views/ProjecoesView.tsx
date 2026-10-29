import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { 
  useExpenses, 
  useIncomes, 
  useFixedExpenses, 
  useFixedIncomes, 
  useAssets, 
  useVehicles 
} from '../hooks/queries';
import { usePrivacy, useDashboard } from '../contexts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  Target, 
  Calendar, 
  Flame, 
  Wallet, 
  Activity, 
  CheckCircle2, 
  Play, 
  Plus, 
  Trash2, 
  Info, 
  RotateCw, 
  Sliders,
  DollarSign,
  ArrowUpRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { getSuggestedCategory, CategorizationRule } from '../components/financas/AutoCategorization';
import { scheduleSheetsBackgroundSync } from '../lib/googleSheetsDataService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 14
    }
  }
};

export function ProjecoesView() {
  const { maskValue } = usePrivacy();
  const { currentMonth } = useDashboard();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const percentFormatter = new Intl.NumberFormat('pt-PT', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 });

  const { expenses, updateExpense } = useExpenses();
  const { incomes } = useIncomes();
  const { fixedExpenses } = useFixedExpenses();
  const { fixedIncomes } = useFixedIncomes();
  const { assets } = useAssets();
  const { vehicles } = useVehicles();

  // Tab state
  const [activeTab, setActiveTab] = useState<'tesouraria' | 'fire' | 'regras'>('tesouraria');

  // Forecast Horizon in Months (3, 6, 12)
  const [forecastMonths, setForecastMonths] = useState<number>(6);

  // FIRE Parameters
  const [swrPercent, setSwrPercent] = useState<number>(4.0); // 4% rule
  const [monthlyAdditionalSavings, setMonthlyAdditionalSavings] = useState<number>(500);
  const [expectedAnnualReturn, setExpectedAnnualReturn] = useState<number>(7.0); // 7% annual nominal
  const [expectedInflation, setExpectedInflation] = useState<number>(2.0); // 2% inflation

  // Categorization Rules state
  const [customRules, setCustomRules] = useState<CategorizationRule[]>(() => {
    try {
      const saved = localStorage.getItem('fin_categorization_rules');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar regras:', e);
    }
    return [];
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [ruleMessage, setRuleMessage] = useState<string | null>(null);
  const [isApplyingRules, setIsApplyingRules] = useState(false);

  // 1. Calculations: Liquid Assets & Burn Rate
  const liquidAssets = useMemo(() => {
    return assets.reduce((sum: number, a: any) => {
      const cat = (a.category || '').toLowerCase();
      const subType = (a.subType || '').toLowerCase();
      const isLiquid = 
        subType.includes('ordem') || 
        subType.includes('poupança') || 
        subType.includes('poupanca') || 
        subType.includes('aforro') || 
        subType.includes('depósito') ||
        cat === 'checking';
      return isLiquid ? sum + (Number(a.currentValue ?? a.value) || 0) : sum;
    }, 0);
  }, [assets]);

  const investedAssets = useMemo(() => {
    return assets.reduce((sum: number, a: any) => {
      const cat = (a.category || '').toLowerCase();
      const isInvested = cat === 'financeiro' || cat === 'ações' || cat === 'cripto' || cat === 'etf' || cat === 'fundos';
      return isInvested ? sum + (Number(a.currentValue ?? a.value) || 0) : sum;
    }, 0);
  }, [assets]);

  const realEstateAssets = useMemo(() => {
    return assets.reduce((sum: number, a: any) => {
      const cat = (a.category || '').toLowerCase();
      return cat === 'imovel' ? sum + (Number(a.currentValue ?? a.value) || 0) : sum;
    }, 0);
  }, [assets]);

  const vehiclesAssets = useMemo(() => {
    return vehicles.reduce((sum: number, v: any) => sum + (Number(v.value) || 0), 0);
  }, [vehicles]);

  const netWorth = liquidAssets + investedAssets + realEstateAssets + vehiclesAssets;

  // Monthly Recurring Baseline
  const monthlyFixedIncome = useMemo(() => {
    return fixedIncomes
      .filter((fi: any) => fi.active !== false)
      .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
  }, [fixedIncomes]);

  const monthlyFixedExpense = useMemo(() => {
    return fixedExpenses
      .filter((fe: any) => fe.active !== false)
      .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
  }, [fixedExpenses]);

  // Average Variable Expenses (last 3 recorded months)
  const averageVariableExpense = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    
    // Group variable expenses by month (YYYY-MM)
    const monthlyTotals: Record<string, number> = {};
    expenses.forEach((e: any) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 7) {
        const ym = e.date.substring(0, 7);
        monthlyTotals[ym] = (monthlyTotals[ym] || 0) + (Number(e.amount) || 0);
      }
    });

    const months = Object.keys(monthlyTotals).sort().slice(-3);
    if (months.length === 0) return 0;
    const sum = months.reduce((acc, m) => acc + monthlyTotals[m], 0);
    return sum / months.length;
  }, [expenses]);

  // Total Estimated Monthly Burn Rate
  const totalMonthlyBurnRate = monthlyFixedExpense + averageVariableExpense;
  const totalMonthlyEstimatedIncome = monthlyFixedIncome > 0 ? monthlyFixedIncome : 2500; // sensible fallback if no fixed income registered

  // Emergency Runway (Months of Survival)
  const emergencyRunwayMonths = totalMonthlyBurnRate > 0 ? liquidAssets / totalMonthlyBurnRate : 99;

  // Monthly Savings Rate
  const savingsRate = totalMonthlyEstimatedIncome > 0 
    ? Math.max(0, ((totalMonthlyEstimatedIncome - totalMonthlyBurnRate) / totalMonthlyEstimatedIncome) * 100) 
    : 0;

  // 2. Multi-Month Cash Flow Forecast Generator
  const forecastData = useMemo(() => {
    const data = [];
    let rollingBalance = liquidAssets;
    const now = new Date();

    for (let i = 1; i <= forecastMonths; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = futureDate.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
      const capitalized = label.charAt(0).toUpperCase() + label.slice(1);

      const projectedInflow = totalMonthlyEstimatedIncome;
      const projectedOutflow = totalMonthlyBurnRate;
      const netMonth = projectedInflow - projectedOutflow;
      rollingBalance += netMonth;

      data.push({
        month: capitalized,
        monthIndex: i,
        inflow: projectedInflow,
        outflow: projectedOutflow,
        net: netMonth,
        balance: rollingBalance,
        safetyThreshold: totalMonthlyBurnRate * 3 // 3 months emergency buffer
      });
    }

    return data;
  }, [liquidAssets, totalMonthlyEstimatedIncome, totalMonthlyBurnRate, forecastMonths]);

  // 3. FIRE (Financial Independence, Retire Early) Calculations
  const annualTotalExpense = totalMonthlyBurnRate * 12;
  const annualFixedExpense = monthlyFixedExpense * 12;

  // FIRE Numbers based on SWR
  const standardFireNumber = swrPercent > 0 ? annualTotalExpense / (swrPercent / 100) : 0;
  const leanFireNumber = swrPercent > 0 ? annualFixedExpense / (swrPercent / 100) : 0;
  const fatFireNumber = swrPercent > 0 ? (annualTotalExpense * 1.25) / (swrPercent / 100) : 0;

  const currentInvestedForFire = investedAssets + (liquidAssets > (totalMonthlyBurnRate * 6) ? liquidAssets - (totalMonthlyBurnRate * 6) : 0);
  const fireProgressPercent = standardFireNumber > 0 ? Math.min(100, (currentInvestedForFire / standardFireNumber) * 100) : 0;

  // Real Expected Return Rate (nominal minus inflation)
  const realReturnRate = Math.max(0.5, (expectedAnnualReturn - expectedInflation) / 100);
  const monthlyRealRate = realReturnRate / 12;

  // Calculate Years to FIRE with compound interest simulation
  const yearsToFire = useMemo(() => {
    if (standardFireNumber <= 0) return 0;
    if (currentInvestedForFire >= standardFireNumber) return 0;
    
    const monthlyContribution = Math.max(50, monthlyAdditionalSavings);
    let wealth = currentInvestedForFire;
    let monthsCount = 0;
    const MAX_MONTHS = 1200; // 100 years max cap

    while (wealth < standardFireNumber && monthsCount < MAX_MONTHS) {
      wealth = wealth * (1 + monthlyRealRate) + monthlyContribution;
      monthsCount++;
    }

    return (monthsCount / 12).toFixed(1);
  }, [standardFireNumber, currentInvestedForFire, monthlyRealRate, monthlyAdditionalSavings]);

  // Curve of FIRE Capital Accumulation over next 20 years
  const fireGrowthCurve = useMemo(() => {
    const points = [];
    let currentWealth = currentInvestedForFire;
    const monthlyContribution = Math.max(50, monthlyAdditionalSavings);
    const target = standardFireNumber;

    for (let yr = 0; yr <= 25; yr += 2) {
      points.push({
        ano: `+${yr}a`,
        patrimonio: Math.round(currentWealth),
        metaFire: Math.round(target)
      });

      // Compound 2 years forward
      for (let m = 0; m < 24; m++) {
        currentWealth = currentWealth * (1 + monthlyRealRate) + monthlyContribution;
      }
    }

    return points;
  }, [currentInvestedForFire, standardFireNumber, monthlyRealRate, monthlyAdditionalSavings]);

  // 4. Categorization Rules Handlers
  const handleAddRule = () => {
    if (!newKeyword.trim() || !newCategory.trim()) return;

    const updated: CategorizationRule[] = [
      ...customRules.filter(r => r.keyword.toLowerCase() !== newKeyword.trim().toLowerCase()),
      { keyword: newKeyword.trim(), category: newCategory.trim(), priority: 10 }
    ];

    setCustomRules(updated);
    localStorage.setItem('fin_categorization_rules', JSON.stringify(updated));
    setNewKeyword('');
    setNewCategory('');
    setRuleMessage('Regra adicionada com sucesso.');
    setTimeout(() => setRuleMessage(null), 3000);
  };

  const handleDeleteRule = (keyword: string) => {
    const updated = customRules.filter(r => r.keyword !== keyword);
    setCustomRules(updated);
    localStorage.setItem('fin_categorization_rules', JSON.stringify(updated));
  };

  const handleApplyRulesRetroactively = async () => {
    setIsApplyingRules(true);
    setRuleMessage('A analisar e categorizar transações...');
    let categorizedCount = 0;

    try {
      for (const exp of expenses) {
        // If uncategorized or marked as 'Outros' or empty
        const cat = (exp.category || '').toLowerCase();
        if (!cat || cat === 'outros' || cat === 'sem categoria') {
          const suggested = getSuggestedCategory(exp.description || '', customRules);
          if (suggested && suggested.toLowerCase() !== cat) {
            await updateExpense({ ...exp, category: suggested });
            categorizedCount++;
          }
        }
      }

      if (categorizedCount > 0) {
        scheduleSheetsBackgroundSync();
        setRuleMessage(`Sucesso! ${categorizedCount} transações foram categorizadas automaticamente.`);
      } else {
        setRuleMessage('Nenhuma transação pendente necessitou de nova categorização.');
      }
    } catch (e) {
      console.error('Erro ao aplicar regras retroativas:', e);
      setRuleMessage('Erro ao processar categorização.');
    } finally {
      setIsApplyingRules(false);
      setTimeout(() => setRuleMessage(null), 4000);
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PageHeader 
          title="Projeções & Engenharia Financeira" 
          subtitle="Previsão de tesouraria, runway de emergência, independência financeira (FIRE) e inteligência de regras"
        />
      </motion.div>

      {/* Top Engineering KPIs */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Património Líquido Consolidado</p>
                <h3 className="text-3xl font-black text-foreground tracking-tighter tabular-nums">
                  {maskValue(netWorth, formatter.format)}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 pt-1">
                  Ativos - Passivos em carteira
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Runway de Emergência</p>
                <h3 className="text-3xl font-black text-foreground tracking-tighter tabular-nums flex items-baseline gap-1.5">
                  <span>{emergencyRunwayMonths > 50 ? '> 50' : emergencyRunwayMonths.toFixed(1)}</span>
                  <span className="text-sm font-bold text-muted-foreground">meses</span>
                </h3>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    emergencyRunwayMonths >= 6 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : emergencyRunwayMonths >= 3 
                        ? 'bg-amber-500/10 text-amber-600' 
                        : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {emergencyRunwayMonths >= 6 ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {emergencyRunwayMonths >= 6 ? 'Excelente (>6m)' : emergencyRunwayMonths >= 3 ? 'Moderado (3-6m)' : 'Crítico (<3m)'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Taxa de Poupança Projetada</p>
                <h3 className="text-3xl font-black text-blue-500 tracking-tighter tabular-nums">
                  {savingsRate.toFixed(1)}%
                </h3>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="bg-blue-500/10 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-lg">
                    {savingsRate >= 30 ? 'Alta Velocidade' : savingsRate >= 15 ? 'Equilibrado' : 'Ajuste Recomendado'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progresso FIRE (4% Rule)</p>
                <h3 className="text-3xl font-black text-emerald-500 tracking-tighter tabular-nums">
                  {fireProgressPercent.toFixed(1)}%
                </h3>
                <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${fireProgressPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Tab Controls */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/30 pb-4">
          <TabsList className="bg-card/60 backdrop-blur-md p-1 rounded-2xl border border-border/40 h-auto">
            <TabsTrigger 
              value="tesouraria" 
              className="rounded-xl px-5 py-2.5 font-black text-xs uppercase tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Previsão de Tesouraria
            </TabsTrigger>
            <TabsTrigger 
              value="fire" 
              className="rounded-xl px-5 py-2.5 font-black text-xs uppercase tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Flame className="w-4 h-4 mr-2" />
              Simulador FIRE
            </TabsTrigger>
            <TabsTrigger 
              value="regras" 
              className="rounded-xl px-5 py-2.5 font-black text-xs uppercase tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Motor de Regras
            </TabsTrigger>
          </TabsList>

          {activeTab === 'tesouraria' && (
            <div className="hidden sm:flex items-center gap-2 bg-card/60 p-1 rounded-2xl border border-border/40">
              {[3, 6, 12].map(m => (
                <button
                  key={m}
                  onClick={() => setForecastMonths(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    forecastMonths === m ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m} Meses
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1. Previsão de Tesouraria Tab */}
        <TabsContent value="tesouraria" className="space-y-6 m-0">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2.5rem] p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/20">
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Projeção da Curva de Liquidez</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Evolução prevista do saldo disponível considerando receitas fixas, compromissos agendados e média de despesas variáveis.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Saldo Projetado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                  <span>Threshold de Segurança (3m)</span>
                </div>
              </div>
            </div>

            {/* Projection Chart */}
            <div className="h-72 w-full pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} 
                    tick={{ fontSize: 11, fontWeight: 700 }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    formatter={(val: any) => maskValue(Number(val), formatter.format)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '16px', 
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                  />
                  <ReferenceLine 
                    y={totalMonthlyBurnRate * 3} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Buffer 3M', fill: '#ef4444', fontSize: 10, position: 'right' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    name="Saldo Acumulado"
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#balanceGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Forecast Table */}
            <div className="pt-8 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/30 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Mês</th>
                    <th className="py-3 px-4 text-right">Receitas Estimadas</th>
                    <th className="py-3 px-4 text-right">Despesas Estimadas</th>
                    <th className="py-3 px-4 text-right">Saldo Líquido Mês</th>
                    <th className="py-3 px-4 text-right">Saldo Final Projetado</th>
                    <th className="py-3 px-4 text-center">Estado Tesouraria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-medium">
                  {forecastData.map((f, idx) => {
                    const isDeficit = f.net < 0;
                    const isBelowBuffer = f.balance < (totalMonthlyBurnRate * 3);

                    return (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 px-4 font-black text-foreground">{f.month}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600">
                          {maskValue(f.inflow, formatter.format)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-rose-500">
                          {maskValue(f.outflow, formatter.format)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-mono font-black ${isDeficit ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {maskValue(f.net, (v) => `${v >= 0 ? '+' : ''}${formatter.format(v)}`)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-foreground">
                          {maskValue(f.balance, formatter.format)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isBelowBuffer ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {isBelowBuffer ? 'Atenção Buffer' : 'Confortável'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 2. Simulador FIRE Tab */}
        <TabsContent value="fire" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FIRE Configuration & Parameters */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl font-black text-foreground tracking-tight">Parâmetros FIRE</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Simulação de independência financeira ajustada ao seu custo de vida e objetivos.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="font-bold">Safe Withdrawal Rate (SWR)</Label>
                    <span className="font-mono font-black text-primary">{swrPercent.toFixed(1)}%</span>
                  </div>
                  <Input 
                    type="range" 
                    min="3.0" 
                    max="5.0" 
                    step="0.1" 
                    value={swrPercent} 
                    onChange={(e) => setSwrPercent(parseFloat(e.target.value))}
                    className="cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Regra dos 4% (25x despesas anuais) com base no clássico Trinity Study.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Poupança Mensal Adicional (€)</Label>
                  <Input 
                    type="number" 
                    value={monthlyAdditionalSavings} 
                    onChange={(e) => setMonthlyAdditionalSavings(Number(e.target.value))}
                    className="rounded-xl font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Retorno Esperado (%)</Label>
                    <Input 
                      type="number" 
                      step="0.5" 
                      value={expectedAnnualReturn} 
                      onChange={(e) => setExpectedAnnualReturn(Number(e.target.value))}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Inflação (%)</Label>
                    <Input 
                      type="number" 
                      step="0.5" 
                      value={expectedInflation} 
                      onChange={(e) => setExpectedInflation(Number(e.target.value))}
                      className="rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/20 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Tempo Estimado até FIRE</p>
                  <p className="text-3xl font-black text-foreground tracking-tight flex items-baseline gap-1">
                    <span>{yearsToFire}</span>
                    <span className="text-sm font-bold text-muted-foreground">anos</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Considerando {formatter.format(monthlyAdditionalSavings)}/mês e {realReturnRate * 100}% de retorno real anual.
                  </p>
                </div>
              </div>
            </Card>

            {/* FIRE Benchmarks & Scenarios */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Lean FIRE (Essencial)</p>
                  <h4 className="text-2xl font-black text-foreground tracking-tight tabular-nums mt-1">
                    {maskValue(leanFireNumber, formatter.format)}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1">Cobre apenas despesas fixas</p>
                </Card>

                <Card className="border-border/40 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-500/10 rounded-[2rem] p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Standard FIRE (Atual)</p>
                  <h4 className="text-2xl font-black text-white tracking-tight tabular-nums mt-1">
                    {maskValue(standardFireNumber, formatter.format)}
                  </h4>
                  <p className="text-[10px] text-white/70 mt-1">Mantém o estilo de vida atual</p>
                </Card>

                <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Fat FIRE (+25% Folga)</p>
                  <h4 className="text-2xl font-black text-foreground tracking-tight tabular-nums mt-1">
                    {maskValue(fatFireNumber, formatter.format)}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1">Estilo de vida com abundância</p>
                </Card>
              </div>

              {/* Accumulation Curve Chart */}
              <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2.5rem] p-6 sm:p-8">
                <div className="flex items-center justify-between pb-6 border-b border-border/20">
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight">Curva de Acumulação vs Meta FIRE</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Projeção do crescimento do património investido (juro composto) até cruzar o Número FIRE.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fireGrowthCurve} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                      <XAxis dataKey="ano" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
                      <YAxis 
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} 
                        tick={{ fontSize: 11, fontWeight: 700 }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        formatter={(val: any) => maskValue(Number(val), formatter.format)}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          borderRadius: '16px', 
                          border: 'none',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                        }}
                      />
                      <ReferenceLine 
                        y={standardFireNumber} 
                        stroke="#f59e0b" 
                        strokeDasharray="4 4" 
                        label={{ value: 'Meta FIRE', fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="patrimonio" 
                        name="Património Projetado"
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#fireGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 3. Motor de Regras de Categorização Tab */}
        <TabsContent value="regras" className="space-y-6 m-0">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/20">
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Motor de Regras Inteligentes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Classificação automática de transações baseada em palavras-chave no descritivo (ex.: Continente, Galp, EDP).
                </p>
              </div>

              <Button
                onClick={handleApplyRulesRetroactively}
                disabled={isApplyingRules}
                className="h-11 px-5 rounded-2xl items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] shadow-xl"
              >
                <Play className={`w-4 h-4 ${isApplyingRules ? 'animate-spin' : ''}`} />
                {isApplyingRules ? 'A Processar...' : 'Executar nas Despesas Existentes'}
              </Button>
            </div>

            {ruleMessage && (
              <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{ruleMessage}</span>
              </div>
            )}

            {/* Add New Rule Form */}
            <div className="p-5 rounded-2xl bg-muted/20 border border-border/30 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Palavra-Chave no Descritivo</Label>
                <Input 
                  placeholder="Ex: Pingo Doce, Uber, Spotify" 
                  value={newKeyword} 
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Categoria a Atribuir</Label>
                <Input 
                  placeholder="Ex: Alimentação, Transportes, Lazer" 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <Button 
                onClick={handleAddRule} 
                className="h-10 rounded-xl font-black uppercase text-[10px] tracking-wider"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Adicionar Regra
              </Button>
            </div>

            {/* Active Rules List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Regras Ativas ({customRules.length} personalizadas)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {customRules.map((rule) => (
                  <div 
                    key={rule.keyword} 
                    className="p-3.5 rounded-2xl bg-card border border-border/40 flex items-center justify-between text-xs hover:border-border transition-colors"
                  >
                    <div>
                      <span className="font-black text-foreground">{rule.keyword}</span>
                      <span className="text-muted-foreground mx-1.5">➔</span>
                      <span className="font-bold text-primary">{rule.category}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.keyword)}
                      className="h-7 w-7 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}

                {customRules.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-full py-4 text-center">
                    Não existem regras personalizadas. O sistema utiliza as regras base incorporadas (Supermercados, Combustível, Saúde e Telecomunicações).
                  </p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjecoesView;
