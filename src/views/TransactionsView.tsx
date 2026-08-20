import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { base44Client, Transaction } from '@/api/base44Client';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';

export function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    base44Client.getTransactions().then(setTransactions);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transações</h2>
          <p className="text-muted-foreground text-sm">Histórico e controlo de movimentos financeiros.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Pesquisar..."
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring sm:w-[250px]"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h4 className="font-bold text-slate-200">Histórico de Movimentos</h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-card hover:bg-secondary/50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                    {t.type === 'income' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm sm:text-base">{t.description}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{t.category}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1">
                  <div className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-destructive'}`}>
                    {t.type === 'income' ? '+' : '-'}
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(t.amount)}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
