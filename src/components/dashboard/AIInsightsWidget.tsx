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
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] h-full flex flex-col hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-8">
        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Insights Inteligentes (IA)
        </CardTitle>
        <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 text-primary flex items-center justify-center">
            <Brain className="w-6 h-6" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-8 pt-0">
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
