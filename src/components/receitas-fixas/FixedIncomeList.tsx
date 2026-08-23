import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle2, Calendar, Edit2, Trash2, Power } from 'lucide-react';
import { useFixedIncomes, useIncomes } from '../../hooks/queries';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { RegisterSingleFixedModal } from '../financas/RegisterSingleFixedModal';

interface FixedIncomeItem {
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

interface FixedIncomeListProps {
  incomes?: FixedIncomeItem[];
  onEdit?: (income: FixedIncomeItem) => void;
  onDelete?: (income: FixedIncomeItem) => void;
  onToggleActive?: (income: FixedIncomeItem) => void;
}

export function FixedIncomeList({ 
  incomes: propIncomes, 
  onEdit, 
  onDelete,
  onToggleActive
}: FixedIncomeListProps) {
  const { fixedIncomes: hookIncomes, updateFixedIncome } = useFixedIncomes();
  const { incomes: allIncomes } = useIncomes();
  const { maskValue } = usePrivacy();
  const [registerItem, setRegisterItem] = React.useState<FixedIncomeItem | null>(null);
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const incomes: FixedIncomeItem[] = propIncomes || hookIncomes || [];

  const handleToggle = async (income: FixedIncomeItem) => {
    if (onToggleActive) {
      onToggleActive(income);
    } else {
      await updateFixedIncome({
        ...income,
        active: !(income.active !== false)
      });
    }
  };

  const renderGroup = (title: string, items: FixedIncomeItem[]) => {
    if (items.length === 0) return (
      <div className="space-y-3 mb-8">
        <div className="flex items-end justify-between px-1">
          <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
            {title}
          </h3>
          <p className="text-base font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">€0,00</span>
            <span className="text-muted-foreground text-sm font-normal">
              {title.includes('Mensais') ? '/mês' : '/ano'}
            </span>
          </p>
        </div>
        <Card className="rounded-2xl border-border bg-card shadow-sm p-6 text-center text-muted-foreground">
          Sem {title.toLowerCase()}
        </Card>
      </div>
    );

    const total = items.reduce((acc, item) => acc + (item.active !== false ? (Number(item.amount) || 0) : 0), 0);
    const suffix = title.includes('Mensais') ? '/mês' : '/ano';

    return (
      <div className="space-y-3 mb-8">
        <div className="flex items-end justify-between px-1">
          <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
            {title}
          </h3>
          <p className="text-base font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">{maskValue(total, formatter.format)}</span>
            <span className="text-muted-foreground text-sm font-normal">{suffix}</span>
          </p>
        </div>

        <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {items.map(income => {
              const isActive = income.active !== false;
              const itemName = income.name || income.description || 'Receita Fixa';
              const firstLetter = itemName.charAt(0).toUpperCase();
              
              // Color matching logic based on character
              const colors = [
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', 
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
                'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', 
                'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
              ];
              const charCode = itemName.charCodeAt(0);
              const colorClass = colors[charCode % colors.length];

              const dueDay = income.dueDateDay || income.dueDay;

              const subtitles = [
                income.category,
                income.entity,
                dueDay ? `Dia ${dueDay}` : null,
                income.method
              ].filter(Boolean).join(' · ');

                  const registeredMonths = allIncomes
                .filter(i => i.fixedIncomeId === income.id)
                .map(i => {
                  const date = new Date(i.date);
                  const monthName = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                  ][date.getMonth()];
                  return `${monthName} ${date.getFullYear()}`;
                });
              const uniqueRegisteredMonths = Array.from(new Set(registeredMonths));

              return (
                <div key={income.id} className={`p-4 flex items-center justify-between gap-4 transition-colors hover:bg-secondary/20 ${!isActive ? 'opacity-50 grayscale-[0.4]' : ''}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${colorClass}`}>
                      {firstLetter}
                    </div>
                    <div className="min-w-0">
                      <p 
                        className="font-bold text-base text-foreground truncate cursor-pointer hover:underline" 
                        onClick={() => onEdit && onEdit(income)}
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
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                        +{maskValue(income.amount || 0, formatter.format)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        /{income.frequency === 'Anual' ? 'ano' : 'mês'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="group relative">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setRegisterItem(income)}
                          className="h-8 gap-1.5 rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Registar</span>
                          {uniqueRegisteredMonths.length > 0 && (
                            <span className="flex items-center justify-center w-4 h-4 ml-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
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

                      {/* Editar */}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                          title="Editar Receita Fixa"
                          onClick={() => onEdit(income)}
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
                        onClick={() => handleToggle(income)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>

                      {/* Eliminar */}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                          title="Eliminar Receita Fixa"
                          onClick={() => onDelete(income)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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

  const monthlyIncomes = incomes.filter(i => (i.frequency || 'Mensal') === 'Mensal');
  const otherIncomes = incomes.filter(i => (i.frequency || 'Mensal') !== 'Mensal');

  if (incomes.length === 0) {
    return (
      <Card className="shadow-sm border-border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-base font-medium">Nenhuma receita fixa registada</p>
        <p className="text-sm mt-1">Adicione os seus rendimentos regulares como ordenados, rendas ou dividendos.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup('Receitas Mensais', monthlyIncomes)}
      {renderGroup('Receitas Anuais', otherIncomes)}
      
      {registerItem && (
        <RegisterSingleFixedModal
          isOpen={!!registerItem}
          onClose={() => setRegisterItem(null)}
          item={registerItem}
          type="income"
        />
      )}
    </div>
  );
}
