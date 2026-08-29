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
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-2xl sm:rounded-[2.5rem] h-full flex flex-col hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-8">
        <CardTitle className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Objetivos (Top 3)
        </CardTitle>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.25rem] bg-foreground/5 text-foreground flex items-center justify-center">
            <Flag className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-8 pt-0 sm:pt-0">
        <div className="space-y-4 sm:space-y-8 flex-1 max-h-[250px] overflow-y-auto">
          {activeGoals.length > 0 ? (
            activeGoals.map((goal: any, i: number) => {
              const target = Number(goal.target || goal.targetAmount) || 1;
              const current = Number(goal.current || goal.currentAmount) || 0;
              const ratio = (current / target) * 100;
 
              return (
                <div key={goal.id || i} className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center text-[11px] sm:text-sm">
                    <div className="font-black text-foreground uppercase tracking-widest text-[8px] sm:text-[10px] truncate max-w-[120px] sm:max-w-[150px]">{goal.name || goal.title}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-black text-foreground text-[10px] sm:text-xs">
                        {maskValue(current, formatter.format)}
                      </span>
                      <span className="text-muted-foreground/60 font-black text-[8px] sm:text-[10px] uppercase tracking-widest">/ {maskValue(target, formatter.format)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-full h-2 sm:h-3 bg-foreground/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all rounded-full" 
                        style={{ width: `${Math.min(ratio, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest w-6 sm:w-8 text-right shrink-0">
                      {ratio.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground/60 text-center py-4">
              Sem objetivos definidos.
            </p>
          )}
        </div>
        <div 
          className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-border/40 flex items-center justify-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate('/objectivos')}
        >
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Gerir Objetivos
        </div>
      </CardContent>
    </Card>
  );
}
