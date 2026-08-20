import React, { useState } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react';

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM format
  onChangeMonth: (month: string) => void;
  registeredMonths?: string[]; // optional array of months that have data (e.g. ['2026-08', '2026-07'])
}

export function MonthSelector({
  currentMonth,
  onChangeMonth,
  registeredMonths = ['2026-08', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03']
}: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [year, month] = currentMonth.split('-').map(Number);

  // Format month to pt-PT
  const formatMonthPT = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    const monthName = date.toLocaleString('pt-PT', { month: 'long' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ` de ${y}`;
  };

  const handlePrev = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth === 0) {
      newMonth = 12;
      newYear -= 1;
    }
    const monthStr = String(newMonth).padStart(2, '0');
    onChangeMonth(`${newYear}-${monthStr}`);
  };

  const handleNext = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth === 13) {
      newMonth = 1;
      newYear += 1;
    }
    const monthStr = String(newMonth).padStart(2, '0');
    onChangeMonth(`${newYear}-${monthStr}`);
  };

  return (
    <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handlePrev}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Popover trigger */}
      <div className="relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-foreground px-3 py-1 h-8 flex items-center gap-2 hover:bg-secondary/40"
        >
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>{formatMonthPT(currentMonth)}</span>
        </Button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-52 rounded-xl border border-border bg-card shadow-lg p-2 z-50 text-xs animate-in fade-in duration-100">
              <p className="font-bold text-[10px] uppercase text-muted-foreground px-2 py-1.5 tracking-wider border-b border-border mb-1">
                Meses com Registos
              </p>
              <div className="max-h-[180px] overflow-y-auto space-y-0.5">
                {registeredMonths.map(m => {
                  const isSelected = m === currentMonth;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        onChangeMonth(m);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <span>{formatMonthPT(m)}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleNext}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
