import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { TrendingUp, Edit2, Trash2, ChevronDown, ChevronUp, Repeat, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/button';

export interface Income {
  id: string;
  date: string;
  amount: number;
  category: string;
  entity: string;
  method: string;
  recurring: boolean;
  notes: string;
}

interface IncomeRowProps {
  incomes: Income[];
  onEdit?: (income: Income) => void;
  onDelete?: (id: string) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

export function IncomeRow({ incomes, onEdit, onDelete, selectedIds = [], onToggleSelect }: IncomeRowProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Salário': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-3">
      {incomes.map(income => {
        const isSelected = selectedIds.includes(income.id);
        return (
          <Card 
            key={income.id} 
            className={`overflow-hidden transition-all hover:shadow-md ${
              isSelected ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-0">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === income.id ? null : income.id)}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {onToggleSelect && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(income.id);
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

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(income.category)} border`}>
                    <span className="font-bold text-lg uppercase">{income.category.charAt(0)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{income.entity}</p>
                      {income.recurring && <Repeat className="w-3 h-3 text-primary shrink-0" title="Receita Recorrente" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{new Date(income.date).toLocaleDateString('pt-PT')}</span>
                      <span>&bull;</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryColor(income.category)}`}>
                        {income.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="font-bold text-emerald-500 text-lg">
                    +{maskValue(income.amount, formatter.format)}
                  </span>

                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                        title="Editar Receita"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onEdit(income); 
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Eliminar Receita"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDelete(income.id); 
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {expandedId === income.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

            {expandedId === income.id && (
              <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium block mb-1">Método de Pagamento</span>
                    <span>{income.method || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block mb-1">Notas</span>
                    <span className="italic">{income.notes || 'Sem notas'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        );
      })}
      
      {incomes.length === 0 && (
        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-xl">
          Nenhuma receita encontrada.
        </div>
      )}
    </div>
  );
}
