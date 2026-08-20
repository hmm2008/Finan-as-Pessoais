import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { base44Client, Vehicle, Goal, Budget } from '@/api/base44Client';
import { Car, Target, TrendingUp, AlertCircle } from 'lucide-react';

export function VehiclesView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    base44Client.getVehicles().then(setVehicles);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Viaturas</h2>
        <p className="text-muted-foreground text-sm">Gestão do património automóvel.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map(v => (
          <Card key={v.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex flex-col">
                <CardTitle className="text-base font-bold text-slate-200">{v.make} {v.model}</CardTitle>
                <CardDescription className="text-[10px] uppercase">Ano {v.year}</CardDescription>
              </div>
              <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                <Car className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v.value)}
              </div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mt-2 tracking-wider">Valor comercial estimado</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    base44Client.getGoals().then(setGoals);
    base44Client.getBudgets().then(setBudgets);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Objetivos e Orçamentos</h2>
        <p className="text-muted-foreground text-sm">Controle as suas metas de poupança e limites de gastos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h4 className="font-bold text-slate-200 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Metas de Poupança</h4>
          </CardHeader>
          <CardContent className="space-y-6">
            {goals.map(goal => {
              const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{goal.name}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(goal.current)} / 
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(goal.target)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    <span>{percentage}% concluído</span>
                    <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-PT')}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h4 className="font-bold text-slate-200 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Orçamentos Mensais</h4>
          </CardHeader>
          <CardContent className="space-y-6">
            {budgets.map(budget => {
              const percentage = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
              const isOver = budget.spent > budget.limit;
              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm flex items-center gap-2">
                      {budget.category}
                      {isOver && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </span>
                    <span className="text-[10px] uppercase font-bold">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget.spent)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isOver ? 'bg-destructive' : 'bg-primary'}`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-right">
                    Limite: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget.limit)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
