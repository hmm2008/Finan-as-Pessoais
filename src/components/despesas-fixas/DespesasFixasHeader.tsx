import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Archive, Download, Calendar, Plus, Info, Bell, FileSpreadsheet, BellRing } from 'lucide-react';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface DespesasFixasHeaderProps {
  onAdd: () => void;
  expenses: any[];
}

export function DespesasFixasHeader({ onAdd, expenses }: DespesasFixasHeaderProps) {
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const { maskValue } = usePrivacy();

  // Calculations
  const activeExpenses = expenses.filter(e => e.active !== false);
  const inactiveExpenses = expenses.filter(e => e.active === false);

  const monthlyActive = activeExpenses.filter(e => (e.frequency || 'Mensal') === 'Mensal');
  const yearlyActive = activeExpenses.filter(e => (e.frequency || 'Mensal') === 'Anual');

  const monthlyTotal = monthlyActive.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const yearlyTotal = yearlyActive.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  
  const totalAnualReal = (monthlyTotal * 12) + yearlyTotal;

  const inactiveTotal = inactiveExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Calculate upcoming due dates in next 7 days
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const upcomingExpenses = expenses
    .filter((e: any) => e.active !== false)
    .map((e: any) => {
      const dueDay = e.dueDateDay || e.dueDay;
      if (!dueDay) return null;
      let diff = dueDay - currentDay;
      if (diff < 0) {
        diff = diff + daysInMonth;
      }
      return { ...e, daysUntil: diff };
    })
    .filter((e: any): e is any => e !== null && e.daysUntil >= 0 && e.daysUntil <= 7);

  return (
    <div className="space-y-6">
      {/* Top Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-muted-foreground bg-white dark:bg-black">
          <Archive className="w-4 h-4" />
          <span>Arquivar</span>
          <Info className="w-3.5 h-3.5 ml-1 opacity-50" />
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-muted-foreground bg-white dark:bg-black">
          <Download className="w-4 h-4" />
          <span>Backup</span>
          <Info className="w-3.5 h-3.5 ml-1 opacity-50" />
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-muted-foreground bg-white dark:bg-black">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Registar</span>
          <Info className="w-3.5 h-3.5 ml-1 opacity-50" />
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-muted-foreground bg-white dark:bg-black">
          <Download className="w-4 h-4" />
          <span>CSV</span>
          <Info className="w-3.5 h-3.5 ml-1 opacity-50" />
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-muted-foreground bg-white dark:bg-black">
          <Bell className="w-4 h-4" />
          <span>Alertas</span>
          <Info className="w-3.5 h-3.5 ml-1 opacity-50" />
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
          <Calendar className="w-4 h-4" />
          <span>Google Calendar</span>
          <Info className="w-3.5 h-3.5 ml-1 opacity-50" />
        </Button>
        <Button size="sm" onClick={onAdd} className="h-9 gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          <span>Nova Despesa Fixa</span>
          <Info className="w-3.5 h-3.5 ml-1 opacity-50 text-indigo-200" />
        </Button>
      </div>

      {/* Grid of 5 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Despesas Mensais */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Despesas Mensais</p>
            <p className="text-2xl font-bold text-foreground">
              {maskValue(monthlyTotal, formatter.format)}
            </p>
            <p className="text-sm text-muted-foreground">
              {monthlyActive.length} ativas · /mês
            </p>
          </CardContent>
        </Card>

        {/* Despesas Anuais */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Despesas Anuais</p>
            <p className="text-2xl font-bold text-foreground">
              {maskValue(yearlyTotal, formatter.format)}
            </p>
            <p className="text-sm text-muted-foreground">
              {yearlyActive.length} ativas · /ano
            </p>
          </CardContent>
        </Card>

        {/* Total Anual */}
        <Card className="rounded-2xl border-indigo-200 bg-indigo-50/50 shadow-sm dark:bg-indigo-950/20 dark:border-indigo-900/50">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Anual</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
              {maskValue(totalAnualReal, formatter.format)}
            </p>
            <p className="text-sm text-muted-foreground">
              mensais × 12 + anuais
            </p>
          </CardContent>
        </Card>

        {/* Inativas */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Inativas</p>
            <p className="text-2xl font-bold text-foreground">
              {inactiveExpenses.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {maskValue(inactiveTotal, formatter.format)}
            </p>
          </CardContent>
        </Card>

        {/* Próximos Vencimentos */}
        <Card className="rounded-2xl border-amber-200 bg-amber-50/40 shadow-sm dark:bg-amber-950/20 dark:border-amber-900/40">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <div className="flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Vencimentos</p>
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-500">
              {upcomingExpenses.length}
            </p>
            <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
              {upcomingExpenses.length === 1 ? 'ativa nos próximos 7 dias' : 'ativas nos próximos 7 dias'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
