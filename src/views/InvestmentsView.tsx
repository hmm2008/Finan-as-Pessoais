import React, { useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { useAssets } from '../hooks/queries';
import { Card, CardContent } from '../components/ui/card';
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
  LineChart as LineChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrivacy } from '../contexts';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export function InvestmentsView() {
  const { maskValue } = usePrivacy();
  const { assets, isLoading } = useAssets();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Filter only financial assets (excluding real estate if handled separately, or including all)
  const financialAssets = useMemo(() => {
    return assets.filter((a: any) => 
      a.assetType === 'financeiro' || 
      a.category === 'Ações' || 
      a.category === 'Cripto' || 
      a.category === 'Fundos' || 
      a.category === 'ETFs'
    );
  }, [assets]);

  const totalValue = useMemo(() => 
    financialAssets.reduce((sum: number, inv: any) => sum + (inv.value || 0), 0)
  , [financialAssets]);

  const allocationData = useMemo(() => {
    const categories: Record<string, number> = {};
    financialAssets.forEach((inv: any) => {
      const cat = inv.category || 'Outros';
      categories[cat] = (categories[cat] || 0) + (inv.value || 0);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [financialAssets]);

  const getTypeIcon = (category: string) => {
    const cat = category?.toLowerCase();
    if (cat?.includes('ações') || cat?.includes('stock')) return <Globe className="w-5 h-5" />;
    if (cat?.includes('cripto') || cat?.includes('crypto') || cat?.includes('bitcoin')) return <Bitcoin className="w-5 h-5" />;
    if (cat?.includes('imob') || cat?.includes('real estate')) return <Building2 className="w-5 h-5" />;
    if (cat?.includes('etf') || cat?.includes('fundo')) return <BarChart3 className="w-5 h-5" />;
    return <Wallet className="w-5 h-5" />;
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-0 -z-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PageHeader 
          title="Investimentos" 
          subtitle="Análise estratégica e performance da sua carteira de ativos"
        />
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-40 bg-card/40 animate-pulse rounded-[2.5rem]" />
           <div className="h-40 bg-card/40 animate-pulse rounded-[2.5rem]" />
           <div className="h-40 bg-card/40 animate-pulse rounded-[2.5rem]" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-blue-600 shadow-2xl shadow-blue-500/20 rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <CardContent className="p-8 relative">
                  <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                     <LineChartIcon className="w-20 h-20 text-white" />
                  </div>
                  <div className="relative z-10 space-y-2">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Valor do Portfólio</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-tight">
                      {maskValue(totalValue, formatter.format)}
                    </h3>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="flex items-center gap-1 bg-white/20 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                        <TrendingUp className="w-3 h-3" />
                        +12.4% Est.
                      </span>
                      <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Este Ano</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-2">
               <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/5 rounded-[2.5rem] overflow-hidden h-full">
                  <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 h-full">
                    <div className="w-full md:w-1/3 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
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
                    <div className="flex-1 grid grid-cols-2 gap-6 w-full">
                       {allocationData.slice(0, 4).map((entry, index) => (
                         <div key={entry.name} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{entry.name}</span>
                            </div>
                            <p className="text-base font-black text-foreground tracking-tight">
                               {maskValue(entry.value, formatter.format)}
                               <span className="text-[10px] text-muted-foreground/60 ml-2">
                                 ({((entry.value / totalValue) * 100).toFixed(1)}%)
                               </span>
                            </p>
                         </div>
                       ))}
                    </div>
                  </CardContent>
               </Card>
            </motion.div>
          </div>

          {/* Assets Section */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Composição da Carteira</h2>
               </div>
               <div className="flex bg-card/60 backdrop-blur-md p-1 rounded-2xl border border-border/40">
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-foreground text-background shadow-lg">Lista</button>
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Mapa</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence mode="popLayout">
                  {financialAssets.map((asset: any, idx) => (
                    <motion.div
                      key={asset.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card className="group border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5">
                         <CardContent className="p-8">
                            <div className="flex items-start justify-between mb-8">
                               <div className="w-14 h-14 rounded-3xl bg-foreground/5 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform duration-500">
                                  {getTypeIcon(asset.category || asset.type)}
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">
                                    {asset.category || 'Ativo'}
                                  </span>
                                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg">
                                    <TrendingUp className="w-3 h-3" />
                                    +4.2%
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <div>
                                 <h4 className="text-xl font-black text-foreground tracking-tighter truncate leading-tight group-hover:text-blue-600 transition-colors">
                                   {asset.name || asset.title}
                                 </h4>
                                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-50">
                                   {asset.institution || 'Custodiante Direto'}
                                 </p>
                               </div>

                               <div className="flex items-end justify-between pt-4 border-t border-border/10">
                                  <div className="space-y-1">
                                     <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Posição Atual</p>
                                     <p className="text-2xl font-black text-foreground tracking-tighter tabular-nums">
                                       {maskValue(asset.value || 0, formatter.format)}
                                     </p>
                                  </div>
                                  <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40 group-hover:bg-foreground group-hover:text-background transition-all duration-500 cursor-pointer">
                                     <ArrowUpRight className="w-5 h-5" />
                                  </div>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                    </motion.div>
                  ))}
               </AnimatePresence>

               {financialAssets.length === 0 && (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6"
                 >
                    <div className="w-24 h-24 rounded-[3rem] bg-muted/20 flex items-center justify-center border border-dashed border-border/40">
                       <PieChartIcon className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">Nenhum ativo financeiro</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-sm">Registe os seus investimentos no separador Património para ver a sua análise aqui.</p>
                    </div>
                 </motion.div>
               )}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
