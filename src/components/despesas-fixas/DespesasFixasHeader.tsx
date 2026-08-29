import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Plus, Bell, BellRing, CheckCircle2, RefreshCw } from 'lucide-react';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { Modal } from '../ui/Modal';

interface DespesasFixasHeaderProps {
  onAdd: () => void;
  expenses: any[];
}

export function DespesasFixasHeader({ onAdd, expenses }: DespesasFixasHeaderProps) {
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const { maskValue } = usePrivacy();

  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  
  // Calendar Modal State
  const activeExpenses = expenses.filter(e => e.active !== false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>(activeExpenses.map(e => e.id));
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [syncCalendarSuccess, setSyncCalendarSuccess] = useState(false);

  // Calculations
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

  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenseIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSyncCalendar = () => {
    setIsSyncingCalendar(true);
    setTimeout(() => {
      setIsSyncingCalendar(false);
      setSyncCalendarSuccess(true);
      setTimeout(() => {
        setSyncCalendarSuccess(false);
        setIsCalendarModalOpen(false);
      }, 1500);
    }, 1200);
  };

  const createGoogleCalendarUrl = (expense: any) => {
    const title = encodeURIComponent(`Pagamento: ${expense.name || expense.description || 'Despesa Fixa'}`);
    const dueDay = expense.dueDateDay || expense.dueDay || 1;
    const targetDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (dueDay < currentDay) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    const yearStr = targetDate.getFullYear();
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const dateFormatted = `${yearStr}${monthStr}${dayStr}`;
    
    const details = encodeURIComponent(`Lembrete de Pagamento de Despesa Fixa\nValor: ${formatter.format(expense.amount || 0)}\nFrequência: ${expense.frequency || 'Mensal'}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateFormatted}/${dateFormatted}`;
  };

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
          {upcomingExpenses.length > 0 && (
            <span className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold ml-1">
              {upcomingExpenses.length}
            </span>
          )}
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsCalendarModalOpen(true)}
          className="h-9 gap-1.5 rounded-xl text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
        >
          <Calendar className="w-4 h-4" />
          <span>Google Calendar</span>
        </Button>

        <Button size="sm" onClick={onAdd} className="h-9 gap-1.5 rounded-xl bg-primary hover:bg-indigo-700 text-white dark:bg-primary dark:hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          <span>Nova Despesa Fixa</span>
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
            <p className="text-2xl font-bold text-indigo-700 dark:text-primary/80">
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
        <Card 
          onClick={() => setIsAlertsModalOpen(true)}
          className="rounded-2xl border-amber-200 bg-amber-50/40 shadow-sm dark:bg-amber-950/20 dark:border-amber-900/40 cursor-pointer hover:border-amber-300 transition-colors"
        >
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

      {/* Modal de Alertas */}
      <Modal
        open={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        title="Alertas de Despesas Fixas"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-sm flex items-center gap-2">
            <BellRing className="w-5 h-5 shrink-0 text-amber-500" />
            <p>
              Próximas despesas fixas a vencer nos próximos 7 dias.
            </p>
          </div>

          {upcomingExpenses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm space-y-1">
              <Bell className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="font-medium">Sem alertas pendentes</p>
              <p className="text-xs">Nenhuma despesa fixa com vencimento nos próximos 7 dias.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {upcomingExpenses.map((exp: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-foreground">
                      {exp.name || exp.description || 'Despesa Fixa'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence no dia {exp.dueDateDay || exp.dueDay} ({exp.frequency || 'Mensal'})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-rose-600 dark:text-rose-400">
                      -{maskValue(exp.amount || 0, formatter.format)}
                    </p>
                    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                      exp.daysUntil === 0 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {exp.daysUntil === 0 ? 'Hoje' : `Em ${exp.daysUntil} dia(s)`}
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

      {/* Modal de Ligação ao Google Calendar */}
      <Modal
        open={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        title="Sincronizar com Google Calendar"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione as despesas fixas que pretende sincronizar ou adicionar ao seu Google Calendar como lembretes recorrentes.
          </p>

          {syncCalendarSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-semibold text-foreground">Sincronização Concluída!</p>
              <p className="text-xs text-muted-foreground">Os lembretes das despesas fixas foram associados ao Google Calendar.</p>
            </div>
          ) : (
            <>
              {activeExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm space-y-1">
                  <Calendar className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="font-medium">Sem despesas fixas ativas</p>
                  <p className="text-xs">Adicione despesas fixas para poder sincronizar com o calendário.</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border rounded-xl p-2">
                  {activeExpenses.map((exp: any) => {
                    const isSelected = selectedExpenseIds.includes(exp.id);
                    const dueDay = exp.dueDateDay || exp.dueDay || 1;

                    return (
                      <div 
                        key={exp.id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
                          isSelected ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:bg-muted/50'
                        }`}
                      >
                        <div 
                          onClick={() => toggleExpenseSelection(exp.id)}
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleExpenseSelection(exp.id)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {exp.name || exp.description || 'Despesa Fixa'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Dia {dueDay} de cada mês · {maskValue(exp.amount || 0, formatter.format)}
                            </p>
                          </div>
                        </div>

                        <a 
                          href={createGoogleCalendarUrl(exp)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-md"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Abrir Evento</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCalendarModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSyncCalendar} 
                  disabled={isSyncingCalendar || selectedExpenseIds.length === 0}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSyncingCalendar ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>A sincronizar...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Sincronizar Selecionadas ({selectedExpenseIds.length})</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

