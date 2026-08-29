import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { CheckCircle2, Calendar, Edit2, Trash2, Power } from 'lucide-react';
import { useFixedExpenses, useExpenses } from '../../hooks/queries';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { RegisterSingleFixedModal } from '../financas/RegisterSingleFixedModal';

interface FixedExpenseItem {
  id: string;
  name?: string;
  description?: string;
  amount: number;
  frequency?: string;
  active?: boolean;
  dueDateDay?: number;
  dueDay?: number;
  entity?: string;
  category?: string;
  exactDate?: string;
  method?: string;
  notes?: string;
}

interface FixedExpenseListProps {
  expenses?: FixedExpenseItem[];
  onEdit?: (expense: FixedExpenseItem) => void;
  onDelete?: (expense: FixedExpenseItem) => void;
  onToggleActive?: (expense: FixedExpenseItem) => void;
}

export function FixedExpenseList({ 
  expenses: propExpenses, 
  onEdit, 
  onDelete,
  onToggleActive
}: FixedExpenseListProps) {
  const { fixedExpenses: hookExpenses, updateFixedExpense } = useFixedExpenses();
  const { expenses: allExpenses } = useExpenses();
  const { maskValue } = usePrivacy();
  const [registerItem, setRegisterItem] = React.useState<FixedExpenseItem | null>(null);
  const [viewRegisteredMonths, setViewRegisteredMonths] = React.useState<{ name: string, months: string[] } | null>(null);
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const expenses: FixedExpenseItem[] = propExpenses || hookExpenses || [];

  const handleToggle = async (expense: FixedExpenseItem) => {
    if (onToggleActive) {
      onToggleActive(expense);
    } else {
      await updateFixedExpense({
        ...expense,
        active: !(expense.active !== false)
      });
    }
  };

  const renderGroup = (title: string, items: FixedExpenseItem[]) => {
    if (items.length === 0) return null;

    const total = items.reduce((acc, item) => acc + (item.active !== false ? (Number(item.amount) || 0) : 0), 0);
    const suffix = title.includes('Mensais') ? '/mês' : '/ano';

    return (
      <div className="space-y-3 mb-8">
        <div className="flex items-end justify-between px-1">
          <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
            {title}
          </h3>
          <p className="text-base font-semibold">
            <span className="text-foreground">{maskValue(total, formatter.format)}</span>
            <span className="text-muted-foreground text-sm font-normal">{suffix}</span>
          </p>
        </div>

        <Card className="rounded-2xl border-border bg-card shadow-sm overflow-visible">
          <div className="divide-y divide-border">
            {items.map((expense, index) => {
              const isActive = expense.active !== false;
              const itemName = expense.name || expense.description || 'Despesa Fixa';
              const firstLetter = itemName.charAt(0).toUpperCase();
              
              // Color matching logic based on character
              const colors = [
                'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', 
                'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', 
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', 
                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              ];
              const charCode = itemName.charCodeAt(0);
              const colorClass = colors[charCode % colors.length];

              const dueDay = expense.dueDateDay || expense.dueDay;

              const subtitles = [
                expense.category,
                expense.entity,
                dueDay ? `Dia ${dueDay}` : null,
                expense.method
              ].filter(Boolean).join(' · ');

              const registeredMonths = allExpenses
                .filter(e => e.fixedExpenseId === expense.id)
                .map(e => {
                  const date = new Date(e.date);
                  const monthName = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                  ][date.getMonth()];
                  return `${monthName} ${date.getFullYear()}`;
                });
              const uniqueRegisteredMonths = Array.from(new Set(registeredMonths));

              const isNearBottom = items.length > 1 && index >= items.length - 2;
              const popoverPosClass = isNearBottom 
                ? "bottom-full mb-2 right-0" 
                : "top-full mt-2 right-0";

              return (
                <div 
                  key={expense.id} 
                  className={`p-5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors hover:bg-secondary/20 first:rounded-t-2xl last:rounded-b-2xl border-b last:border-b-0 border-border/50 ${!isActive ? 'opacity-50 grayscale-[0.4]' : ''}`}
                >
                  {/* Top Row in Mobile / Desktop Right Side (Desktop uses sm:order-2) */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:order-2 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex sm:hidden items-center justify-center font-bold text-base shrink-0 ${colorClass}`}>
                        {firstLetter}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-lg sm:text-base text-foreground">
                          {maskValue(expense.amount || 0, formatter.format)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          /{expense.frequency === 'Anual' ? 'ano' : 'mês'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="group relative">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setRegisterItem(expense)}
                          className="h-8 px-3 sm:px-4 gap-1.5 rounded-full border-indigo-200 text-primary hover:bg-indigo-50 dark:border-indigo-900 dark:text-primary/80 dark:hover:bg-indigo-950/50 text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Registar</span>
                          <span className="sm:hidden">OK</span>
                          {uniqueRegisteredMonths.length > 0 && (
                            <span 
                              className="flex items-center justify-center min-w-[16px] h-4 ml-0.5 px-1 rounded-full bg-primary text-white text-[10px] font-bold cursor-help sm:cursor-default"
                              onClick={(e) => {
                                if (window.innerWidth < 640) {
                                  e.stopPropagation();
                                  setViewRegisteredMonths({
                                    name: itemName,
                                    months: uniqueRegisteredMonths
                                  });
                                }
                              }}
                            >
                              {uniqueRegisteredMonths.length}
                            </span>
                          )}
                        </Button>
                        
                        {uniqueRegisteredMonths.length > 0 && (
                          <div className={`pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute ${popoverPosClass} z-[100] bg-white dark:bg-slate-900 shadow-2xl rounded-xl border border-border p-3 w-52 text-left`}>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase mb-2">
                              <Calendar className="w-3.5 h-3.5 text-primary" /> MESES REGISTADOS ({uniqueRegisteredMonths.length})
                            </div>
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                              {uniqueRegisteredMonths.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                  {m}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Editar */}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                          title="Editar Despesa Fixa"
                          onClick={() => onEdit(expense)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Ativa / Inativa */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-full transition-colors ${
                          isActive 
                            ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10' 
                            : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted'
                        }`}
                        title={isActive ? "Ativa (clique para desativar)" : "Inativa (clique para ativar)"}
                        onClick={() => handleToggle(expense)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>

                      {/* Eliminar */}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                          title="Eliminar Despesa Fixa"
                          onClick={() => onDelete(expense)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row in Mobile / Desktop Left Side (Desktop uses sm:order-1) */}
                  <div className="flex items-center gap-4 min-w-0 sm:order-1">
                    <div className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center font-bold text-lg shrink-0 ${colorClass}`}>
                      {firstLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Desktop Layout */}
                      <div className="hidden sm:block">
                        <p 
                          className="font-bold text-base text-foreground truncate cursor-pointer hover:underline leading-tight" 
                          onClick={() => onEdit && onEdit(expense)}
                        >
                          {itemName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {subtitles}
                        </p>
                      </div>

                      {/* Mobile Layout: Name - Category */}
                      <div className="sm:hidden">
                        <p 
                          className="text-sm font-semibold text-foreground leading-snug cursor-pointer"
                          onClick={() => onEdit && onEdit(expense)}
                        >
                          <span className="text-primary font-bold">{itemName}</span>
                          <span className="mx-2 text-muted-foreground/40 font-normal">—</span>
                          <span className="text-muted-foreground text-xs font-medium uppercase tracking-tight">{expense.category || 'Geral'}</span>
                        </p>
                        {expense.entity && (
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">
                            {expense.entity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  const monthlyExpenses = expenses.filter(e => (e.frequency || 'Mensal') === 'Mensal');
  const otherExpenses = expenses.filter(e => (e.frequency || 'Mensal') !== 'Mensal');

  if (expenses.length === 0) {
    return (
      <Card className="shadow-sm border-border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-base font-medium">Nenhuma despesa fixa registada</p>
        <p className="text-sm mt-1">Adicione as suas despesas recorrentes como renda, empréstimos ou seguros.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup('Despesas Mensais', monthlyExpenses)}
      {renderGroup('Despesas Anuais / Outras', otherExpenses)}
      
      {registerItem && (
        <RegisterSingleFixedModal
          isOpen={!!registerItem}
          onClose={() => setRegisterItem(null)}
          item={registerItem}
          type="expense"
        />
      )}

      {viewRegisteredMonths && (
        <Modal
          open={!!viewRegisteredMonths}
          onClose={() => setViewRegisteredMonths(null)}
          title="Meses Registados"
          maxWidth="sm"
          mobileBehavior="bottom-sheet"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {viewRegisteredMonths.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{viewRegisteredMonths.name}</p>
                <p className="text-xs text-muted-foreground">{viewRegisteredMonths.months.length} registos encontrados</p>
              </div>
            </div>

            <div className="space-y-2">
              {viewRegisteredMonths.months.map((month, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{month}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
