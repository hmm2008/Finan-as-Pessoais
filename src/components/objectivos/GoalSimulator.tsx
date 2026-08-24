import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Goal } from './types';
import { usePrivacy } from '../../contexts';
import { Sliders, Sparkles, Calendar, ArrowRight, TrendingUp } from 'lucide-react';

interface GoalSimulatorProps {
  goals: Goal[];
}

export function GoalSimulator({ goals }: GoalSimulatorProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const activeGoals = goals.filter(g => !g.completed && g.targetAmount > g.currentAmount);

  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    activeGoals.length > 0 ? activeGoals[0].id : ''
  );
  
  const selectedGoal = goals.find(g => g.id === selectedGoalId) || activeGoals[0];

  const defaultMonthly = selectedGoal ? (selectedGoal.monthlySavings || 200) : 200;
  const [monthlyContribution, setMonthlyContribution] = useState<number>(defaultMonthly);

  // Remaining needed amount
  const remaining = selectedGoal ? Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount) : 0;

  // Calculated months needed
  const monthsNeeded = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : 0;

  // Estimated completion date
  const getEstimatedDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  };

  if (!selectedGoal) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Sem objetivos ativos para simulação de poupança.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary" />
          Simulador de Poupança & Prazos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Select Goal */}
        {activeGoals.length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Selecione o Objetivo para Simular</Label>
            <div className="flex flex-wrap gap-2">
              {activeGoals.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGoalId(g.id);
                    setMonthlyContribution(g.monthlySavings || 200);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${
                    g.id === selectedGoal.id 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Goal Summary Banner */}
        <div className="p-4 rounded-xl bg-secondary/60 border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-muted-foreground">Objetivo Selecionado</span>
            <h4 className="font-bold text-lg text-foreground">{selectedGoal.name}</h4>
            <p className="text-xs text-muted-foreground">
              Faltam acumular: <strong className="text-foreground">{maskValue(remaining, formatter.format)}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Meta Alvo</span>
            <span className="text-xl font-bold text-primary">
              {maskValue(selectedGoal.targetAmount, formatter.format)}
            </span>
          </div>
        </div>

        {/* Interactive Sliders */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold">Aporte Mensal Recorrente</Label>
              <span className="text-base font-bold text-primary">
                {maskValue(monthlyContribution, formatter.format)}/mês
              </span>
            </div>
            <input 
              type="range"
              min={25}
              max={2000}
              step={25}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>25€</span>
              <span>500€</span>
              <span>1000€</span>
              <span>2000€</span>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase text-primary flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Estimativa de Conclusão
              </span>
              <p className="text-2xl font-black text-foreground">
                {monthsNeeded > 0 ? `${monthsNeeded} meses` : 'Concluído!'}
              </p>
              {monthsNeeded > 0 && (
                <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Alcançável em: <strong className="text-foreground capitalize">{getEstimatedDate(monthsNeeded)}</strong>
                </p>
              )}
            </div>

            <div className="p-3 bg-background/80 rounded-lg border border-border text-xs text-left space-y-1 max-w-xs">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Dica de Poupança:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Se aumentar o seu aporte para {maskValue(monthlyContribution + 50, formatter.format)}/mês, reduzirá o prazo em{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {monthsNeeded - Math.ceil(remaining / (monthlyContribution + 50))} meses
                </strong>!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
