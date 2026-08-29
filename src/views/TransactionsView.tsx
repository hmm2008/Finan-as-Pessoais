import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { useExpenses, useIncomes } from '../hooks/queries';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Filter, 
  ArrowUpDown,
  Calendar,
  Tag,
  Euro,
  Hash,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrivacy } from '../contexts';
import { CSVImportModal } from '../components/transactions/CSVImportModal';

export function TransactionsView() {
  const { maskValue } = usePrivacy();
  const { expenses, isLoading: loadingExpenses } = useExpenses();
  const { incomes, isLoading: loadingIncomes } = useIncomes();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const allTransactions = useMemo(() => {
    const combined = [
      ...expenses.map((e: any) => ({ ...e, type: 'expense' })),
      ...incomes.map((i: any) => ({ ...i, type: 'income' }))
    ];
    
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allTransactions, searchTerm, filterType]);

  const isLoading = loadingExpenses || loadingIncomes;

  return (
    <div className="relative min-h-screen pb-20">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 -z-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-0 -z-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PageHeader 
          title="Transações" 
          subtitle="Histórico detalhado de todos os movimentos financeiros"
        >
          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               className="h-11 px-6 rounded-2xl bg-card/60 border-border/40 hover:bg-primary/5 hover:border-primary/40 transition-all font-black uppercase tracking-widest text-[10px] hidden sm:flex items-center gap-2"
               onClick={() => setIsImportModalOpen(true)}
             >
               <Upload className="w-4 h-4" />
               Importar CSV
             </Button>
             <div className="relative group hidden lg:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Pesquisar transações..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 w-64 rounded-2xl bg-card/60 border-border/40 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm"
                />
             </div>
             <div className="flex bg-card/60 backdrop-blur-md p-1 rounded-2xl border border-border/40">
                {(['all', 'income', 'expense'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterType === type 
                        ? 'bg-foreground text-background shadow-lg' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {type === 'all' ? 'Tudo' : type === 'income' ? 'Receitas' : 'Despesas'}
                  </button>
                ))}
             </div>
          </div>
        </PageHeader>
        
        {/* Mobile Search & Actions */}
        <div className="flex flex-col gap-3 sm:hidden mt-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-2xl bg-card/60 border-border/40"
            />
          </div>
          <Button 
            variant="outline" 
            className="h-12 rounded-2xl bg-card/60 border-border/40 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 justify-center"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Importar CSV Bancário
          </Button>
        </div>
      </motion.div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 w-full bg-card/40 animate-pulse rounded-3xl border border-border/20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((t, idx) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.5), duration: 0.3 }}
                >
                  <Card className="group overflow-hidden border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 rounded-[2rem] hover:shadow-xl shadow-black/5">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-5 sm:p-6">
                        {/* Type Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                          t.type === 'income' 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {t.type === 'income' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="md:col-span-2">
                            <h4 className="font-black text-foreground text-base tracking-tight truncate leading-tight">
                              {t.description || 'Sem descrição'}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                                <Tag className="w-3 h-3 text-blue-500/60" />
                                {t.category || 'Outros'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                                <Calendar className="w-3 h-3 text-blue-500/60" />
                                {new Date(t.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>

                          <div className="hidden md:flex flex-col items-start gap-1">
                             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Método / Conta</span>
                             <span className="text-[10px] font-bold text-foreground/80">{t.accountName || t.paymentMethod || 'Principal'}</span>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 text-right">
                             <div className="md:hidden">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Valor</span>
                             </div>
                             <span className={`text-xl font-black tracking-tighter tabular-nums ${
                               t.type === 'income' ? 'text-emerald-600' : 'text-foreground'
                             }`}>
                               {t.type === 'income' ? '+' : '-'}{maskValue(t.amount, formatter.format)}
                             </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredTransactions.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-[2.5rem] bg-muted/30 flex items-center justify-center border border-border/20">
                   <Search className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">Nenhuma transação encontrada</h3>
                  <p className="text-sm text-muted-foreground mt-1">Tente ajustar os seus filtros ou termos de pesquisa.</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <CSVImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </div>
  );
}
