import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { base44Client, Account } from '../api/base44Client';
import { Wallet, Landmark, PiggyBank } from 'lucide-react';
import { motion } from 'motion/react';
import { usePrivacy } from '../contexts';

export default function AccountsView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  useEffect(() => {
    base44Client.getAccounts().then(setAccounts);
  }, []);

  const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Wallet className="h-6 w-6 text-primary" />;
      case 'savings': return <PiggyBank className="h-6 w-6 text-emerald-500" />;
      case 'investment': return <Landmark className="h-6 w-6 text-amber-500" />;
      default: return <Wallet className="h-6 w-6" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'checking': return 'À Ordem';
      case 'savings': return 'Poupança';
      case 'investment': return 'Investimento';
      default: return type;
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-0 -z-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader 
          title="Contas e Depósitos" 
          subtitle="Gestão inteligente da liquidez do seu portfólio"
        />

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
          <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] overflow-hidden group">
            <CardContent className="p-10 flex flex-col justify-between h-40">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Liquidez Total</p>
                <div className="text-5xl font-black text-foreground tracking-tighter">
                  {maskValue(total, formatter.format)}
                </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc, idx) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
            >
              <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] hover:bg-card/80 transition-all duration-300 h-full">
                <CardContent className="p-8 flex flex-col justify-between h-full space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-3xl bg-foreground/5 flex items-center justify-center">
                        {getTypeIcon(acc.type)}
                    </div>
                    <span className="bg-foreground/5 px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest text-muted-foreground/60">{getTypeLabel(acc.type)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight">{acc.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{acc.institution}</p>
                  </div>
                  <div className="text-3xl font-black text-foreground tracking-tighter">
                    {maskValue(acc.balance, formatter.format)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
