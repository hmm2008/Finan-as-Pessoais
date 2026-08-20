export type GoalPriority = 'Baixa' | 'Média' | 'Alta';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  category: string; // e.g., 'Fundo de Emergência', 'Viagem', 'Imóvel / Habitação', 'Veículo', 'Investimentos', 'Outros'
  priority: GoalPriority;
  monthlySavings: number; // recurring_monthly target
  notes?: string;
  completed: boolean;
  completedAt?: string;
}
