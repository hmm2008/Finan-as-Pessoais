import React from 'react';
import { Card } from '../ui/card';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FinancasBulkActions } from './FinancasBulkActions';

interface FinancasTabContentProps {
  type: 'expense' | 'fixed_expense' | 'income';
  filteredItems: any[];
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onDeleteBulk: () => void;
  children: React.ReactNode;
}

export function FinancasTabContent({
  type,
  filteredItems,
  selectedIds,
  onToggleSelectAll,
  onDeleteBulk,
  children
}: FinancasTabContentProps) {
  const isIncome = type === 'income';
  const emptyMessage = isIncome 
    ? 'Sem receitas encontradas' 
    : type === 'fixed_expense' 
      ? 'Sem despesas fixas encontradas' 
      : 'Sem despesas registadas encontradas';

  return (
    <div className="mt-0 outline-none space-y-3">
      <FinancasBulkActions 
        allSelected={filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item.id))}
        onToggleSelectAll={onToggleSelectAll}
        selectedCount={selectedIds.length}
        filteredCount={filteredItems.length}
        onDeleteBulk={onDeleteBulk}
      />

      <div className="max-h-[500px] overflow-y-auto pr-1.5 space-y-3 scrollbar-thin">
        {filteredItems.length > 0 ? (
          children
        ) : (
          <Card className="shadow-sm border-border border-dashed h-40 flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
            {isIncome ? (
              <ArrowUpRight className="w-8 h-8 mb-2 opacity-20 text-emerald-500" />
            ) : (
              <ArrowDownRight className={`w-8 h-8 mb-2 opacity-20 ${type === 'fixed_expense' ? 'text-rose-500' : 'text-primary'}`} />
            )}
            <p className="text-sm font-medium">{emptyMessage}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
