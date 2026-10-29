import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { useAssets } from '../hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Globe, 
  Bitcoin, 
  Building2, 
  LineChart as LineChartIcon,
  Plus,
  Pencil,
  Trash2,
  Percent,
  Euro,
  Coins,
  ShieldCheck,
  Building,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrivacy } from '../contexts';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { AssetFinanceiroForm } from '../components/patrimonio/AssetFinanceiroForm';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { Asset } from '../components/patrimonio/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6'];

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

export function InvestmentsView() {
  const { maskValue } = usePrivacy();
  const { assets, isLoading, addAsset, updateAsset, deleteAsset } = useAssets();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const percentFormatter = new Intl.NumberFormat('pt-PT', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 });

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Filter only financial assets
  const financialAssets = useMemo(() => {
    return assets.filter((a: any) => {
      const cat = (a.category || '').toLowerCase();
      const assetType = (a.assetType || '').toLowerCase();
      const subType = (a.subType || '').toLowerCase();
      return (
        cat === 'financeiro' ||
        assetType === 'financeiro' ||
        cat === 'ações' ||
        cat === 'cripto' ||
        cat === 'criptomoeda' ||
        cat === 'fundos' ||
        cat === 'etfs' ||
        cat === 'etf' ||
        subType.includes('ação') ||
        subType.includes('etf') ||
        subType.includes('fundo') ||
        subType.includes('cripto') ||
        subType.includes('aforro') ||
        subType.includes('poupança')
      );
    });
  }, [assets]);

  // Aggregate metrics
  const totalValue = useMemo(() => 
    financialAssets.reduce((sum: number, inv: any) => sum + (Number(inv.currentValue ?? inv.value) || 0), 0)
  , [financialAssets]);

  const totalCost = useMemo(() => 
    financialAssets.reduce((sum: number, inv: any) => {
      const cost = Number(inv.purchaseValue) || (Number(inv.averagePrice || 0) * Number(inv.quantity || 0)) || Number(inv.currentValue ?? inv.value) || 0;
      return sum + cost;
    }, 0)
  , [financialAssets]);

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Projected Annual Passive Income (yield)
  const annualPassiveIncome = useMemo(() => {
    return financialAssets.reduce((sum: number, inv: any) => {
      const val = Number(inv.currentValue ?? inv.value) || 0;
      const rate = Number(inv.interestRate) || 0;
      if (rate > 0) {
        return sum + (val * (rate / 100));
      }
      return sum;
    }, 0);
  }, [financialAssets]);

  const averageYield = totalValue > 0 ? (annualPassiveIncome / totalValue) * 100 : 0;

  // Breakdown by Subtype / Category
  const allocationData = useMemo(() => {
    const categories: Record<string, number> = {};
    financialAssets.forEach((inv: any) => {
      const cat = inv.subType || inv.category || 'Outros';
      const val = Number(inv.currentValue ?? inv.value) || 0;
      categories[cat] = (categories[cat] || 0) + val;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [financialAssets]);

  // Breakdown by Custodian / Institution
  const institutionData = useMemo(() => {
    const insts: Record<string, number> = {};
    financialAssets.forEach((inv: any) => {
      const inst = inv.institution?.trim() || 'Sem Custodiante';
      const val = Number(inv.currentValue ?? inv.value) || 0;
      insts[inst] = (insts[inst] || 0) + val;
    });

    return Object.entries(insts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [financialAssets]);

  // Filtered Assets by category pill
  const filteredAssets = useMemo(() => {
    if (selectedCategoryFilter === 'all') return financialAssets;
    return financialAssets.filter((a: any) => (a.subType || a.category) === selectedCategoryFilter);
  }, [financialAssets, selectedCategoryFilter]);

  const getTypeIcon = (subType: string = '', category: string = '') => {
    const text = (subType + ' ' + category).toLowerCase();
    if (text.includes('ação') || text.includes('acoes') || text.includes('stock')) return <Globe className="w-5 h-5 text-blue-500" />;
    if (text.includes('cripto') || text.includes('crypto') || text.includes('bitcoin')) return <Bitcoin className="w-5 h-5 text-amber-500" />;
    if (text.includes('etf') || text.includes('fundo')) return <BarChart3 className="w-5 h-5 text-emerald-500" />;
    if (text.includes('aforro') || text.includes('tesouro')) return <ShieldCheck className="w-5 h-5 text-indigo-500" />;
    if (text.includes('ouro') || text.includes('gold')) return <Coins className="w-5 h-5 text-yellow-500" />;
    if (text.includes('poupança') || text.includes('depósito')) return <Wallet className="w-5 h-5 text-cyan-500" />;
    return <LineChartIcon className="w-5 h-5 text-primary" />;
  };

  const handleSaveAsset = async (assetData: Asset) => {
    try {
      if (editingAsset?.id) {
        await updateAsset({ ...assetData, id: editingAsset.id });
      } else {
        await addAsset({ ...assetData, category: 'financeiro' });
      }
      setIsFormOpen(false);
      setEditingAsset(null);
    } catch (e) {
      console.error('Erro ao guardar investimento:', e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    try {
      await deleteAsset(assetToDelete.id);
      setAssetToDelete(null);
    } catch (e) {
      console.error('Erro ao eliminar investimento:', e);
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-0 -z-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PageHeader 
          title="Investimentos & Portfólio" 
          subtitle="Análise estratégica de rentabilidade, alocação de ativos e rendimento passivo"
        >
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setEditingAsset(null);
                setIsFormOpen(true);
              }}
              className="h-11 px-5 rounded-2xl items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novo Investimento
            </Button>
          </div>
        </PageHeader>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-40 bg-card/40 animate-pulse rounded-[2rem]" />
          <div className="h-40 bg-card/40 animate-pulse rounded-[2rem]" />
          <div className="h-40 bg-card/40 animate-pulse rounded-[2rem]" />
          <div className="h-40 bg-card/40 animate-pulse rounded-[2rem]" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Main Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 rounded-[2rem] overflow-hidden group">
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 p-5 opacity-15 group-hover:scale-110 transition-transform">
                    <LineChartIcon className="w-16 h-16 text-white" />
                  </div>
                  <div className="relative z-10 space-y-1">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Valor do Portfólio</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter tabular-nums">
                      {maskValue(totalValue, formatter.format)}
                    </h3>
                    <p className="text-[10px] font-bold text-white/60 pt-1">
                      {financialAssets.length} {financialAssets.length === 1 ? 'posição ativa' : 'posições ativas'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 p-5 opacity-10">
                    <Activity className="w-16 h-16 text-foreground" />
                  </div>
                  <div className="relative z-10 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Custo de Aquisição</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tighter tabular-nums">
                      {maskValue(totalCost, formatter.format)}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground/60 pt-1">
                      Capital total investido
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mais-Valias Latentes</p>
                    <h3 className={`text-3xl font-black tracking-tighter tabular-nums ${totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {maskValue(totalGain, (v) => `${v >= 0 ? '+' : ''}${formatter.format(v)}`)}
                    </h3>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        totalGain >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {totalGain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Retorno Global</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rendimento Passivo Anual</p>
                    <h3 className="text-3xl font-black text-emerald-500 tracking-tighter tabular-nums">
                      {maskValue(annualPassiveIncome, formatter.format)}
                    </h3>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-lg">
                        {averageYield.toFixed(2)}% Yield
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Juros & Dividendos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Allocation & Institutions Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] p-6 h-full flex flex-col">
                <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">
                      Alocação por Classe de Ativo
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Diversificação do património investido</p>
                  </div>
                  <PieChartIcon className="w-5 h-5 text-muted-foreground/40" />
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col md:flex-row items-center gap-6">
                  {allocationData.length > 0 ? (
                    <>
                      <div className="w-full md:w-1/2 h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={allocationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                            >
                              {allocationData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => maskValue(Number(value), formatter.format)}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                borderRadius: '16px', 
                                border: 'none',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 w-full space-y-3">
                        {allocationData.slice(0, 5).map((entry, index) => {
                          const pct = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
                          return (
                            <div key={entry.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  <span className="font-bold text-foreground">{entry.name}</span>
                                </div>
                                <span className="font-mono font-black text-muted-foreground">{pct.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${pct}%`, backgroundColor: COLORS[index % COLORS.length] }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="w-full py-12 flex flex-col items-center justify-center text-center text-muted-foreground/60">
                      <PieChartIcon className="w-12 h-12 stroke-[1] mb-2" />
                      <p className="text-xs font-bold">Sem dados de alocação</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[2rem] p-6 h-full flex flex-col">
                <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">
                      Custodiantes & Corretoras
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Distribuição por instituição financeira</p>
                  </div>
                  <Building className="w-5 h-5 text-muted-foreground/40" />
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  {institutionData.length > 0 ? (
                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={institutionData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11, fontWeight: 700 }}
                            width={110}
                          />
                          <Tooltip 
                            formatter={(value: any) => maskValue(Number(value), formatter.format)}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              borderRadius: '16px', 
                              border: 'none',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="w-full py-12 flex flex-col items-center justify-center text-center text-muted-foreground/60">
                      <Building className="w-12 h-12 stroke-[1] mb-2" />
                      <p className="text-xs font-bold">Sem dados de custodiantes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Asset List & Controls */}
          <section className="space-y-5 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Carteira de Posições ({financialAssets.length})
                </h2>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* View Switcher */}
                <div className="flex bg-card/60 backdrop-blur-md p-1 rounded-2xl border border-border/40">
                  <button 
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-xl text-xs transition-all ${
                      viewMode === 'cards' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Vista em Cartões"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-xl text-xs transition-all ${
                      viewMode === 'table' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Vista em Tabela"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content View */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredAssets.map((asset: any, idx) => {
                    const currentVal = Number(asset.currentValue ?? asset.value) || 0;
                    const purchaseVal = Number(asset.purchaseValue) || (Number(asset.averagePrice || 0) * Number(asset.quantity || 0)) || currentVal;
                    const gain = currentVal - purchaseVal;
                    const gainPct = purchaseVal > 0 ? (gain / purchaseVal) * 100 : 0;
                    const rate = Number(asset.interestRate) || 0;

                    return (
                      <motion.div
                        key={asset.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card className="group border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/70 transition-all duration-300 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-5">
                              <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform duration-300">
                                {getTypeIcon(asset.subType, asset.category)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingAsset(asset);
                                    setIsFormOpen(true);
                                  }}
                                  className="h-8 w-8 rounded-xl hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setAssetToDelete(asset)}
                                  className="h-8 w-8 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                  {asset.subType || asset.category || 'Ativo Financeiro'}
                                </span>
                                <h4 className="text-lg font-black text-foreground tracking-tight truncate leading-tight group-hover:text-blue-500 transition-colors">
                                  {asset.name || asset.title}
                                </h4>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                                  {asset.institution || 'Custodiante Direto'}
                                </p>
                              </div>

                              {/* Numbers */}
                              <div className="pt-3 border-t border-border/20 grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Posição Atual</p>
                                  <p className="text-xl font-black text-foreground tracking-tight tabular-nums">
                                    {maskValue(currentVal, formatter.format)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Retorno</p>
                                  <div className={`text-sm font-black tabular-nums flex items-center justify-end gap-1 ${
                                    gain >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                  }`}>
                                    {gain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                                    {maskValue(gain, (v) => `${v >= 0 ? '+' : ''}${formatter.format(v)}`)}
                                  </p>
                                </div>
                              </div>

                              {/* Yield / Quantities if present */}
                              {(rate > 0 || (asset.quantity && asset.averagePrice)) && (
                                <div className="pt-2 border-t border-border/10 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                  {rate > 0 && (
                                    <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                      Taxa: {rate}% a.a.
                                    </span>
                                  )}
                                  {asset.quantity && asset.averagePrice && (
                                    <span className="tabular-nums">
                                      {asset.quantity} un. @ {formatter.format(asset.averagePrice)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              /* Table View */
              <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/30 border-b border-border/30 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-4 px-6">Ativo / Posição</th>
                        <th className="py-4 px-4">Classe</th>
                        <th className="py-4 px-4">Custodiante</th>
                        <th className="py-4 px-4 text-right">Custo Aquisição</th>
                        <th className="py-4 px-4 text-right">Valor Atual</th>
                        <th className="py-4 px-4 text-right">P&L (€)</th>
                        <th className="py-4 px-4 text-right">Rentabilidade</th>
                        <th className="py-4 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredAssets.map((asset: any) => {
                        const currentVal = Number(asset.currentValue ?? asset.value) || 0;
                        const purchaseVal = Number(asset.purchaseValue) || (Number(asset.averagePrice || 0) * Number(asset.quantity || 0)) || currentVal;
                        const gain = currentVal - purchaseVal;
                        const gainPct = purchaseVal > 0 ? (gain / purchaseVal) * 100 : 0;

                        return (
                          <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-4 px-6 font-bold text-foreground flex items-center gap-2">
                              {getTypeIcon(asset.subType, asset.category)}
                              <span className="truncate max-w-[200px]">{asset.name || asset.title}</span>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground font-medium">
                              {asset.subType || asset.category || 'Ativo'}
                            </td>
                            <td className="py-4 px-4 text-muted-foreground font-medium">
                              {asset.institution || '—'}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-medium text-muted-foreground">
                              {maskValue(purchaseVal, formatter.format)}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-black text-foreground">
                              {maskValue(currentVal, formatter.format)}
                            </td>
                            <td className={`py-4 px-4 text-right font-mono font-black ${
                              gain >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                              {maskValue(gain, (v) => `${v >= 0 ? '+' : ''}${formatter.format(v)}`)}
                            </td>
                            <td className={`py-4 px-4 text-right font-mono font-black ${
                              gain >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                              {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingAsset(asset);
                                    setIsFormOpen(true);
                                  }}
                                  className="h-8 w-8 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setAssetToDelete(asset)}
                                  className="h-8 w-8 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {financialAssets.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="py-16 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-[2.5rem] bg-muted/20 flex items-center justify-center border border-dashed border-border/40">
                  <PieChartIcon className="w-9 h-9 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Nenhum ativo financeiro registado</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Adicione ações, ETFs, criptomoedas, fundos ou certificados de aforro para começar a acompanhar o seu portfólio.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingAsset(null);
                    setIsFormOpen(true);
                  }}
                  className="rounded-xl px-5 h-10 font-black text-[10px] uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Investimento
                </Button>
              </motion.div>
            )}
          </section>
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <AssetFinanceiroForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAsset(null);
        }}
        onSave={handleSaveAsset}
        initialData={editingAsset}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!assetToDelete}
        entityLabel="Investimento"
        entityName={assetToDelete?.name || ''}
        entityId={assetToDelete?.id || ''}
        entityData={assetToDelete}
        onConfirmPermanent={handleDeleteConfirm}
        onMoveToTrashSuccess={() => setAssetToDelete(null)}
        onClose={() => setAssetToDelete(null)}
      />
    </div>
  );
}

export default InvestmentsView;
