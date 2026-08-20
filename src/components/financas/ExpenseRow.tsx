import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { CreditCard, Repeat, Car, Edit2, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  entity: string;
  method: string;
  recurring: boolean;
  vehicle: boolean;
  notes: string;
}

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
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
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

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(expense.category)} border`}>
                    <span className="font-bold text-lg uppercase">{expense.category.charAt(0)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{expense.entity}</p>
                      {expense.recurring && <Repeat className="w-3 h-3 text-primary shrink-0" title="Despesa Recorrente" />}
                      {expense.vehicle && <Car className="w-3 h-3 text-amber-500 shrink-0" title="Viatura" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{new Date(expense.date).toLocaleDateString('pt-PT')}</span>
                      <span>&bull;</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-bold text-destructive text-lg">
                    -{maskValue(expense.amount, formatter.format)}
                  </span>
                  {expandedId === expense.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); onEdit?.(expense); }}>
                    <Edit2 className="w-3 h-3 mr-2" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); onDelete?.(expense.id); }}>
                    <Trash2 className="w-3 h-3 mr-2" /> Eliminar
                  </Button>
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
