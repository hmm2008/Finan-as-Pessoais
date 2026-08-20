import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { Flag, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../../hooks/queries';

export function DashboardGoals() {
  const { maskValue } = usePrivacy();
  const navigate = useNavigate();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { goals } = useGoals();

  const activeGoals = goals.slice(0, 3);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Objetivos (Top 3)</CardTitle>
        <Flag className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-5 flex-1 max-h-[220px] overflow-y-auto">
          {activeGoals.length > 0 ? (
            activeGoals.map((goal: any, i: number) => {
              const target = Number(goal.target || goal.targetAmount) || 1;
              const current = Number(goal.current || goal.currentAmount) || 0;
              const ratio = (current / target) * 100;

              return (
                <div key={goal.id || i}>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <div className="font-medium truncate max-w-[150px]">{goal.name || goal.title}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-bold text-foreground">
                        {maskValue(current, formatter.format)}
                      </span>
                      <span className="text-muted-foreground text-xs">/ {maskValue(target, formatter.format)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all" 
                        style={{ width: `${Math.min(ratio, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground w-8 text-right shrink-0">
                      {ratio.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sem objetivos definidos.
            </p>
          )}
        </div>
        <div 
          className="mt-4 pt-3 border-t border-border flex items-center justify-center text-xs text-primary font-medium cursor-pointer hover:underline"
          onClick={() => navigate('/objectivos')}
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Gerir Objetivos
        </div>
      </CardContent>
    </Card>
  );
}
