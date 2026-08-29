import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Sparkles, Brain } from 'lucide-react';
import { useDashboard } from '../../contexts';

export const AIInsightsWidget: React.FC = () => {
  const { expenses } = useDashboard();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/suggest-savings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expenses })
        });
        const data = await response.json();
        setInsights(data.suggestions);
      } catch (error) {
        console.error('Error fetching AI insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (expenses && expenses.length > 0) {
      fetchInsights();
    }
  }, [expenses]);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-2xl sm:rounded-3xl h-full flex flex-col hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
        <CardTitle className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Insights Inteligentes (IA)
        </CardTitle>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Brain className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 sm:p-6 pt-0 sm:pt-0">
        {isLoading ? (
          <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">A analisar os teus dados...</div>
        ) : insights ? (
            <div className="text-sm text-foreground prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br />') }} />
        ) : (
          <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Sem dados suficientes para análise.</div>
        )}
      </CardContent>
    </Card>
  );
};
