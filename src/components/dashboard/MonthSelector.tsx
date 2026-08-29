import React from 'react';
import { useDashboard } from '../../contexts';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    <div className="flex items-center gap-1 bg-background/50 backdrop-blur-md border border-border/40 rounded-2xl p-1">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={prevMonth}
        className="h-9 w-9 rounded-xl hover:bg-foreground/5 transition-all active:scale-90"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center overflow-hidden">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
        <AnimatePresence mode="wait">
          <motion.span
            key={currentMonth}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] font-black uppercase tracking-widest text-foreground truncate"
          >
            {capitalizedLabel}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={nextMonth}
        className="h-9 w-9 rounded-xl hover:bg-foreground/5 transition-all active:scale-90"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
