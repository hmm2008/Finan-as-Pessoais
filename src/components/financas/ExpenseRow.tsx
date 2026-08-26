import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { CreditCard, Repeat, Car, Edit2, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { Expense } from '../../types';

interface ExpenseRowProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

export function ExpenseRow({ expenses, onEdit, onDelete, selectedIds = [], onToggleSelect }: ExpenseRowProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Combustível': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Alimentação':
      case 'Supermercado': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Habitação': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <div className="space-y-3">
      {expenses.map(expense => {
        const isSelected = selectedIds.includes(expense.id);
        return (
          <Card 
            key={expense.id} 
            className={`overflow-hidden transition-all hover:shadow-md ${
              isSelected ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-0">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 py-4 pl-4 pr-2">
                  {onToggleSelect && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(expense.id);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors shrink-0"
                      title={isSelected ? "Desseleccionar" : "Seleccionar"}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground/60 hover:text-muted-foreground" />
                      )}
                    </button>
                  )}

                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(expense.category)} border text-sm sm:text-lg font-bold`}>
                    {expense.category.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <p className="font-semibold text-sm sm:text-base text-foreground truncate">{expense.entity}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {expense.recurring && <Repeat className="w-3 h-3 text-primary" title="Despesa Recorrente" />}
                        {expense.vehicle && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title="Viatura Associada">
                            <Car className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden xs:inline">Viatura</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      <span className="whitespace-nowrap">{new Date(expense.date).toLocaleDateString('pt-PT')}</span>
                      <span className="hidden xs:inline">&bull;</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium border whitespace-nowrap ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0 py-4 pr-4 pl-2 border-l border-border/10 bg-muted/5">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-destructive text-base sm:text-lg whitespace-nowrap">
                      -{maskValue(expense.amount, formatter.format)}
                    </span>
                    
                    <div className="flex items-center gap-0.5 sm:gap-1 mt-1">
                      {onEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onEdit(expense); 
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onDelete(expense.id); 
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                      <div className="ml-1">
                        {expandedId === expense.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {expandedId === expense.id && (
              <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium block mb-1">Método de Pagamento</span>
                    <span>{expense.method || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block mb-1">Notas</span>
                    <span className="italic">{expense.notes || 'Sem notas'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        );
      })}
      
      {expenses.length === 0 && (
        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-xl">
          Nenhuma despesa encontrada.
        </div>
      )}
    </div>
  );
}
