import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { 
  TrendingUp, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Repeat, 
  CheckSquare, 
  Square,
  Banknote,
  Briefcase,
  Building2,
  Gift,
  Coins,
  ArrowUpRight,
  MoreHorizontal,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Button } from '../ui/button';
import { Income } from '../../types';

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

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'Salário':
      case 'Remuneração':
        return { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Briefcase };
      case 'Pensões':
      case 'Apoios':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Banknote };
      case 'Rendimentos Prediais':
      case 'Rendas':
        return { color: 'bg-primary/10 text-primary border-primary/20', icon: Building2 };
      case 'Reembolso':
      case 'Devolução':
        return { color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: ArrowUpRight };
      case 'Prémio/Bónus':
      case 'Extra':
        return { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Gift };
      case 'Investimentos':
      case 'Dividendos':
      case 'Juros':
        return { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Coins };
      default:
        return { color: 'bg-secondary text-secondary-foreground border-border', icon: MoreHorizontal };
    }
  };

  return (
    <div className="space-y-3">
      {incomes.map(income => {
        const isSelected = selectedIds.includes(income.id);
        const { color, icon: Icon } = getCategoryConfig(income.category);
        const isExpanded = expandedId === income.id;

        return (
          <Card 
            key={income.id} 
            className={`group overflow-hidden transition-all duration-200 border-border/50 hover:border-emerald-500/30 hover:shadow-md ${
              isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]' : 'bg-card'
            }`}
          >
            <CardContent className="p-0">
              <div 
                className="flex flex-col sm:flex-row sm:items-stretch cursor-pointer min-h-[72px]"
                onClick={() => setExpandedId(isExpanded ? null : income.id)}
              >
                {/* Desktop Selection Checkbox */}
                {onToggleSelect && (
                  <div 
                    className="hidden sm:flex items-center justify-center px-4 border-r border-border/10 bg-muted/5 group-hover:bg-muted/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(income.id);
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
                    )}
                  </div>
                )}

                {/* Mobile Header: Checkbox + Amount + Actions */}
                <div className="sm:hidden flex items-center justify-between p-4 border-b border-border/5 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    {onToggleSelect && (
                      <div 
                        className="p-1 -ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(income.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground/40" />
                        )}
                      </div>
                    )}
                    <span className="font-black text-emerald-500 text-lg tabular-nums">
                      +{maskValue(income.amount, formatter.format)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background rounded-md"
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
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDelete(income.id); 
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Main Content (Desktop Layout) */}
                <div className="hidden sm:flex flex-1 items-center gap-4 p-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color} border transition-transform duration-200 group-hover:scale-110 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-base text-foreground truncate tracking-tight">{income.entity}</p>
                      {income.recurring && (
                        <div className="p-0.5 rounded-md bg-emerald-500/10 text-emerald-600" title="Receita Recorrente">
                          <Repeat className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(income.date).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <span>&bull;</span>
                      <span className="truncate">{income.category}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Sub-header: Entity - Category */}
                <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color} border`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      <span className="font-bold">{income.entity}</span>
                      <span className="mx-2 text-muted-foreground/30">—</span>
                      <span className="text-muted-foreground text-xs font-medium uppercase tracking-tight">{income.category}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{new Date(income.date).toLocaleDateString('pt-PT')}</span>
                      {income.recurring && (
                        <div className="flex items-center gap-1 px-1 rounded bg-emerald-500/10 text-emerald-600">
                          <Repeat className="w-2.5 h-2.5" />
                          <span>Recorrente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Amount & Actions */}
                <div className="hidden sm:flex flex-col justify-center items-end px-6 bg-muted/5 group-hover:bg-muted/10 transition-colors border-l border-border/10 min-w-[150px]">
                  <span className="font-black text-emerald-500 text-lg whitespace-nowrap tabular-nums">
                    +{maskValue(income.amount, formatter.format)}
                  </span>
                  
                  <div className="flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background rounded-md"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onEdit(income); 
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDelete(income.id); 
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <div className="ml-1 text-muted-foreground/40">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Mobile Expand Indicator */}
                <div className="sm:hidden flex items-center justify-center py-1 text-muted-foreground/20">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 pb-5 pt-2 border-t border-border/50 bg-secondary/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Método de Recebimento</span>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-emerald-500/60" />
                        <span>{income.method || 'Não especificado'}</span>
                      </div>
                    </div>
                    <div className="sm:col-span-1 md:col-span-2 space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Notas e Observações</span>
                      <p className="text-sm text-foreground/80 italic leading-relaxed">
                        {income.notes || 'Sem observações adicionais para este rendimento.'}
                      </p>
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
