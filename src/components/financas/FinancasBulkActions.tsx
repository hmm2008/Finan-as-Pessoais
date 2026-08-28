import React from 'react';
import { Button } from '../ui/button';
import { CheckSquare, Square, Trash2 } from 'lucide-react';

interface FinancasBulkActionsProps {
  allSelected: boolean;
  onToggleSelectAll: () => void;
  selectedCount: number;
  onDeleteBulk: () => void;
  filteredCount: number;
}

export function FinancasBulkActions({
  allSelected,
  onToggleSelectAll,
  selectedCount,
  onDeleteBulk,
  filteredCount
}: FinancasBulkActionsProps) {
  if (filteredCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-card p-2.5 px-3 rounded-lg border border-border shadow-xs text-xs mb-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSelectAll}
        className="h-8 gap-2 font-medium"
      >
        {allSelected ? (
          <>
            <CheckSquare className="w-4 h-4 text-primary" />
            <span>Desseleccionar Todas</span>
          </>
        ) : (
          <>
            <Square className="w-4 h-4 text-muted-foreground" />
            <span>Seleccionar Todas ({filteredCount})</span>
          </>
        )}
      </Button>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 animate-in fade-in duration-150">
          <span className="text-muted-foreground font-medium">
            {selectedCount} {selectedCount === 1 ? 'seleccionada' : 'seleccionadas'}
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onDeleteBulk}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Selección</span>
          </Button>
        </div>
      )}
    </div>
  );
}
