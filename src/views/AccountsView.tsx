import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { base44Client, Account } from '@/api/base44Client';
import { Wallet, Landmark, PiggyBank } from 'lucide-react';

export function AccountsView() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    base44Client.getAccounts().then(setAccounts);
  }, []);

  const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Wallet className="h-5 w-5 text-primary" />;
      case 'savings': return <PiggyBank className="h-5 w-5 text-emerald-500" />;
      case 'investment': return <Landmark className="h-5 w-5 text-indigo-500" />;
      default: return <Wallet className="h-5 w-5" />;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contas e Depósitos</h2>
          <p className="text-muted-foreground text-sm">Faça a gestão da liquidez do seu portfólio.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-tight text-primary-foreground/80">Liquidez Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(total)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(acc => (
          <Card key={acc.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex flex-col">
                <CardTitle className="text-sm font-bold text-slate-200">{acc.name}</CardTitle>
                <CardDescription className="text-[10px] uppercase">{acc.institution}</CardDescription>
              </div>
              <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                {getTypeIcon(acc.type)}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(acc.balance)}
              </div>
              <div className="mt-2 flex items-center">
                <span className="bg-secondary px-2 py-0.5 rounded-sm mr-2 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">{getTypeLabel(acc.type)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
