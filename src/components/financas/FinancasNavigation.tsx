import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Search 
} from 'lucide-react';

interface FinancasNavigationProps {
  period: 'Mensal' | 'Anual';
  setPeriod: (period: 'Mensal' | 'Anual') => void;
  prevMonth: () => void;
  nextMonth: () => void;
  capitalizedMonthYear: string;
  year: number;
  current: string;
  setMonth: (month: string) => void;
  datePickerOpen: boolean;
  setDatePickerOpen: (open: boolean) => void;
  dynamicMonths: Array<{ label: string; value: string }>;
  search: string;
  setSearch: (search: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  availableCategories: string[];
  monthNameYear: string;
}

export function FinancasNavigation({
  period,
  setPeriod,
  prevMonth,
  nextMonth,
  capitalizedMonthYear,
  year,
  current,
  setMonth,
  datePickerOpen,
  setDatePickerOpen,
  dynamicMonths,
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  availableCategories,
  monthNameYear
}: FinancasNavigationProps) {
  return (
    <Card className="shadow-xs mb-4 border-border bg-card">
      <CardContent className="p-2.5 sm:p-3 space-y-2.5">
        {/* Top Row: Period Selector + Month/Year Navigation + Quick Months */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-secondary/70 p-0.5 rounded-lg border border-border/40 shrink-0">
              <button 
                type="button"
                onClick={() => setPeriod('Mensal')}
                className={`px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-colors ${period === 'Mensal' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mensal
              </button>
              <button 
                type="button"
                onClick={() => setPeriod('Anual')}
                className={`px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-colors ${period === 'Anual' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Anual
              </button>
            </div>

            <div className="flex items-center gap-1 bg-secondary/40 px-1.5 py-0.5 rounded-lg border border-border/50 shrink-0">
              <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" onClick={prevMonth}>
                <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
              <span className="text-[10px] sm:text-sm font-semibold min-w-[80px] sm:min-w-[105px] text-center">
                {period === 'Anual' ? year : capitalizedMonthYear}
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" onClick={nextMonth}>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </div>

            {/* Datepicker Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setDatePickerOpen(!datePickerOpen)}
                className="flex items-center gap-1.5 h-6 sm:h-7 px-2 text-[10px] sm:text-xs bg-secondary/30 rounded-lg hover:bg-secondary/60 transition-colors border border-border"
              >
                <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                <span className="font-medium">{period === 'Anual' ? year.toString() : monthNameYear.toLowerCase()}</span>
              </button>

              {datePickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDatePickerOpen(false)} />
                  <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-64 rounded-xl border border-border bg-card shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between mb-2">
                      <Button 
                        variant="ghost" size="icon" className="h-7 w-7" 
                        onClick={() => {
                          const newDate = new Date(year - 1, 1, 1);
                          setMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-bold text-sm">{year}</span>
                      <Button 
                        variant="ghost" size="icon" className="h-7 w-7" 
                        onClick={() => {
                          const newDate = new Date(year + 1, 1, 1);
                          setMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {period !== 'Anual' && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {Array.from({ length: 12 }).map((_, i) => {
                          const d = new Date(year, i, 1);
                          const mStr = d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '');
                          const mLabel = mStr.charAt(0).toUpperCase() + mStr.slice(1);
                          const fullVal = `${year}-${String(i + 1).padStart(2, '0')}`;
                          const isCurrent = current === fullVal;

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setMonth(fullVal);
                                setDatePickerOpen(false);
                              }}
                              className={`py-1 text-xs font-medium rounded-md transition-colors ${
                                isCurrent ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'
                              }`}
                            >
                              {mLabel}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {period === 'Anual' && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        Ano: {year}. Use as setas para mudar.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Month Pills */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 scrollbar-none sm:scrollbar-thin justify-start sm:justify-end w-full sm:w-auto px-1 sm:px-0">
            {dynamicMonths.map(m => {
              const isActive = period === 'Anual' 
                ? m.value.startsWith(year.toString()) 
                : current === m.value;
              return (
                <button 
                  key={m.value} 
                  type="button"
                  onClick={() => setMonth(m.value)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-xs rounded-md whitespace-nowrap transition-colors font-medium ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-xs' 
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: Search and Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-border/40">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por descrição, entidade, categoria ou método de pagamento..." 
              className="pl-8 h-8 text-xs bg-background shadow-none rounded-lg border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="w-full sm:w-56 h-8 px-2.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/30"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="Todas as categorias">Todas as categorias</option>
            {availableCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
