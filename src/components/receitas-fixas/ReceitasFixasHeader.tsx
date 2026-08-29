import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Bell, BellRing } from 'lucide-react';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { Modal } from '../ui/Modal';

interface ReceitasFixasHeaderProps {
  onAdd: () => void;
  incomes: any[];
}

export function ReceitasFixasHeader({ onAdd, incomes = [] }: ReceitasFixasHeaderProps) {
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const { maskValue } = usePrivacy();
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Calculations
  const activeIncomes = incomes.filter(e => e.active !== false);
  const inactiveIncomes = incomes.filter(e => e.active === false);

  const monthlyActive = activeIncomes.filter(e => (e.frequency || 'Mensal') === 'Mensal');
  const yearlyActive = activeIncomes.filter(e => (e.frequency || 'Mensal') === 'Anual');

  const monthlyTotal = monthlyActive.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const yearlyTotal = yearlyActive.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  
  const totalAnualReal = (monthlyTotal * 12) + yearlyTotal;

  const inactiveTotal = inactiveIncomes.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Calculate upcoming due dates in next 7 days
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const upcomingIncomes = incomes
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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAlertsModalOpen(true)}
          className="h-9 gap-1.5 rounded-xl text-muted-foreground bg-white dark:bg-black hover:text-foreground relative"
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>Alertas</span>
          {upcomingIncomes.length > 0 && (
            <span className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold ml-1">
              {upcomingIncomes.length}
            </span>
          )}
        </Button>
        <Button size="sm" onClick={onAdd} className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Nova Receita Fixa</span>
        </Button>
      </div>

      {/* Grid of 5 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Receitas Mensais */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Receitas Mensais</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {maskValue(monthlyTotal, formatter.format)}
            </p>
            <p className="text-sm text-muted-foreground">
              {monthlyActive.length} ativas · /mês
            </p>
          </CardContent>
        </Card>

        {/* Receitas Anuais */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Receitas Anuais</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {maskValue(yearlyTotal, formatter.format)}
            </p>
            <p className="text-sm text-muted-foreground">
              {yearlyActive.length} ativas · /ano
            </p>
          </CardContent>
        </Card>

        {/* Total Anual */}
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-900/50">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Anual</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
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
              {inactiveIncomes.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {maskValue(inactiveTotal, formatter.format)}
            </p>
          </CardContent>
        </Card>

        {/* Próximos Vencimentos / Alertas */}
        <Card 
          onClick={() => setIsAlertsModalOpen(true)}
          className="rounded-2xl border-amber-200 bg-amber-50/40 shadow-sm dark:bg-amber-950/20 dark:border-amber-900/40 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
            <div className="flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Alertas</p>
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-500">
              {upcomingIncomes.length}
            </p>
            <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
              {upcomingIncomes.length === 1 ? 'recebimento nos próximos 7 dias' : 'recebimentos nos próximos 7 dias'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Alertas */}
      <Modal
        open={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        title="Alertas de Receitas Fixas"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-sm flex items-center gap-2">
            <BellRing className="w-5 h-5 shrink-0 text-amber-500" />
            <p>
              Próximos recebimentos previstos para os próximos 7 dias.
            </p>
          </div>

          {upcomingIncomes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm space-y-1">
              <Bell className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="font-medium">Sem alertas pendentes</p>
              <p className="text-xs">Nenhuma receita fixa com vencimento nos próximos 7 dias.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {upcomingIncomes.map((inc: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-foreground">
                      {inc.name || inc.description || 'Receita Fixa'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence no dia {inc.dueDateDay || inc.dueDay} ({inc.frequency || 'Mensal'})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      +{maskValue(inc.amount || 0, formatter.format)}
                    </p>
                    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                      inc.daysUntil === 0 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {inc.daysUntil === 0 ? 'Hoje' : `Em ${inc.daysUntil} dia(s)`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setIsAlertsModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

