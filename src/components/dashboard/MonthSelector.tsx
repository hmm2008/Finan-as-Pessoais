import React from 'react';
import { useDashboard } from '../../contexts';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function MonthSelector() {
  const { currentMonth, setMonth } = useDashboard(); // currentMonth is YYYY-MM
  
  if (!currentMonth) return null;

  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  const prevMonth = () => {
    const prev = new Date(year, month - 2, 1);
    setMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const next = new Date(year, month, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={prevMonth}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md text-sm font-semibold min-w-[150px] justify-center">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span>{capitalizedLabel}</span>
      </div>
      <Button variant="outline" size="icon" onClick={nextMonth}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
