import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { 
  CreditCard, 
  Repeat, 
  Car, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Square,
  Utensils,
  Home,
  Bus,
  Activity,
  Clapperboard,
  ShoppingBag,
  Zap,
  Smartphone,
  School,
  ShieldCheck,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
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

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'Alimentação':
      case 'Supermercado':
      case 'Restauração':
        return { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Utensils };
      case 'Habitação':
      case 'Renda':
      case 'Condomínio':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Home };
      case 'Transportes':
      case 'Passe':
        return { color: 'bg-primary/10 text-primary border-primary/20', icon: Bus };
      case 'Combustível':
      case 'Viatura':
      case 'Manutenção':
        return { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Car };
      case 'Saúde':
      case 'Farmácia':
      case 'Médico':
        return { color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: Activity };
      case 'Lazer':
      case 'Entretenimento':
      case 'Viagens':
        return { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Clapperboard };
      case 'Compras':
      case 'Vestuário':
        return { color: 'bg-pink-500/10 text-pink-600 border-pink-500/20', icon: ShoppingBag };
      case 'Serviços':
      case 'Luz':
      case 'Água':
      case 'Gás':
        return { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Zap };
      case 'Telecomunicações':
      case 'Internet':
      case 'Telemóvel':
        return { color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: Smartphone };
      case 'Educação':
        return { color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: School };
      case 'Seguros':
      case 'Impostos':
        return { color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: ShieldCheck };
      default:
        return { color: 'bg-secondary text-secondary-foreground border-border', icon: MoreHorizontal };
    }
  };

  return (
    <div className="space-y-3">
      {expenses.map(expense => {
        const isSelected = selectedIds.includes(expense.id);
        const { color, icon: Icon } = getCategoryConfig(expense.category);
        const isExpanded = expandedId === expense.id;

        return (
          <Card 
            key={expense.id} 
            className={`group overflow-hidden transition-all duration-200 border-border/50 hover:border-primary/30 hover:shadow-md ${
              isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]' : 'bg-card'
            }`}
          >
            <CardContent className="p-0">
              <div 
                className="flex items-stretch cursor-pointer min-h-[72px]"
                onClick={() => setExpandedId(isExpanded ? null : expense.id)}
              >
                {/* Selection Checkbox */}
                {onToggleSelect && (
                  <div 
                    className="flex items-center justify-center px-4 border-r border-border/10 bg-muted/5 group-hover:bg-muted/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(expense.id);
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
                    )}
                  </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex items-center gap-3 sm:gap-4 p-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color} border transition-transform duration-200 group-hover:scale-110 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm sm:text-base text-foreground truncate tracking-tight">{expense.entity}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {expense.recurring && (
                          <div className="p-0.5 rounded-md bg-primary/10 text-primary" title="Despesa Recorrente">
                            <Repeat className="w-3 h-3" />
                          </div>
                        )}
                        {expense.vehicle && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20" title="Viatura Associada">
                            <Car className="w-3 h-3" />
                            <span className="hidden xs:inline uppercase tracking-tighter">Viatura</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(expense.date).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <span>&bull;</span>
                      <span className="truncate">{expense.category}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col justify-center items-end px-4 sm:px-6 bg-muted/5 group-hover:bg-muted/10 transition-colors border-l border-border/10 min-w-[120px] sm:min-w-[150px]">
                  <span className="font-black text-destructive text-base sm:text-lg whitespace-nowrap tabular-nums">
                    -{maskValue(expense.amount, formatter.format)}
                  </span>
                  
                  <div className="flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background rounded-md"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onEdit(expense); 
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
                          onDelete(expense.id); 
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
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 pb-5 pt-2 border-t border-border/50 bg-secondary/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Método de Pagamento</span>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-primary/60" />
                        <span>{expense.method || 'Não especificado'}</span>
                      </div>
                    </div>
                    <div className="sm:col-span-1 md:col-span-2 space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Notas e Observações</span>
                      <p className="text-sm text-foreground/80 italic leading-relaxed">
                        {expense.notes || 'Sem observações adicionais para este movimento.'}
                      </p>
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
