import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Switch } from '../ui/switch';
import { useFixedExpenses, useExpenses } from '../../hooks/queries';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { RegisterSingleFixedModal } from '../financas/RegisterSingleFixedModal';
import { Calendar } from 'lucide-react';

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

        <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {items.map(expense => {
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

              return (
                <div key={expense.id} className={`p-4 flex items-center justify-between gap-4 transition-colors hover:bg-secondary/20 ${!isActive ? 'opacity-50 grayscale-[0.4]' : ''}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${colorClass}`}>
                      {firstLetter}
                    </div>
                    <div className="min-w-0">
                      <p 
                        className="font-bold text-base text-foreground truncate cursor-pointer hover:underline" 
                        onClick={() => onEdit && onEdit(expense)}
                      >
                        {itemName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {subtitles}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-base">
                        {maskValue(expense.amount || 0, formatter.format)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        /{expense.frequency === 'Anual' ? 'ano' : 'mês'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="group relative hidden sm:flex">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setRegisterItem(expense)}
                          className="h-8 gap-1.5 rounded-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Registar</span>
                          {uniqueRegisteredMonths.length > 0 && (
                            <span className="flex items-center justify-center w-4 h-4 ml-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                              {uniqueRegisteredMonths.length}
                            </span>
                          )}
                        </Button>
                        
                        {uniqueRegisteredMonths.length > 0 && (
                          <div className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-border p-3 w-48 text-left">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase mb-2">
                              <Calendar className="w-3.5 h-3.5" /> MESES REGISTADOS
                            </div>
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                              {uniqueRegisteredMonths.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-sm text-foreground">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  {m}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <div className="p-2 flex items-center justify-between border-b border-border mb-1">
                            <span className="text-sm font-medium">Estado</span>
                            <Switch checked={isActive} onCheckedChange={() => handleToggle(expense)} />
                          </div>
                          {onEdit && <DropdownMenuItem onClick={() => onEdit(expense)}>Editar Despesa</DropdownMenuItem>}
                          {onDelete && <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Eliminar</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
    </div>
  );
}
