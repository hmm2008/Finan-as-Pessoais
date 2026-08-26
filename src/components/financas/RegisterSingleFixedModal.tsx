import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Calendar } from 'lucide-react';
import { useExpenses, useIncomes } from '../../hooks/queries';

interface RegisterSingleFixedModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: 'income' | 'expense';
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function RegisterSingleFixedModal({ isOpen, onClose, item, type }: RegisterSingleFixedModalProps) {
  const { addExpense } = useExpenses();
  const { addIncome } = useIncomes();
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(now.getMonth());
  
  const handleRegister = async () => {
    const yStr = String(selectedYear);
    const mStr = String(selectedMonthIndex + 1).padStart(2, '0');
    
    // Determine max days in selected month
    const maxDays = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    const targetDay = Math.min(maxDays, Math.max(1, Number(item.dueDay || item.dueDateDay || 1)));
    const dateStr = `${yStr}-${mStr}-${String(targetDay).padStart(2, '0')}`;
    
    const amount = Number(item.amount) || 0;
    const entityName = item.entity || item.name || (type === 'income' ? 'Receita Fixa' : 'Despesa Fixa');
    
    if (type === 'expense') {
      await addExpense({
        id: `exp_fixed_${yStr}-${mStr}_${item.id || Math.random().toString(36).substring(2, 8)}`,
        amount,
        category: item.category || 'Outros',
        date: dateStr,
        entity: entityName,
        method: item.method || 'Débito Direto',
        notes: item.notes || 'Lançamento automático de despesa fixa',
        recurring: true,
        vehicle: !!item.vehicle,
        fixedExpenseId: item.id
      });
    } else {
      await addIncome({
        id: `inc_fixed_${yStr}-${mStr}_${item.id || Math.random().toString(36).substring(2, 8)}`,
        amount,
        category: item.category || 'Outros',
        date: dateStr,
        entity: entityName,
        method: item.method || 'Transferência Bancária',
        notes: item.notes || 'Lançamento automático de receita fixa',
        recurring: true,
        fixedIncomeId: item.id
      });
    }
    
    onClose();
  };
  
  if (!item) return null;
  
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const title = type === 'expense' ? 'Registar Despesa' : 'Registar Receita';
  
  // Generate last month, this month, next month for the dropdown, or just all 12 months for the current year + next year
  const monthOptions = [];
  for (let m = 0; m < 12; m++) {
    monthOptions.push({ label: `${MONTH_NAMES[m]} ${selectedYear}`, monthIndex: m, year: selectedYear });
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <div className="pt-2">
        <p className="text-sm text-muted-foreground mb-4 -mt-2 truncate">
          {item.name || item.entity || 'Registo'}
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Selecionar mês</label>
            <div className="flex gap-2">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
              <select 
                className="flex h-10 w-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                <option value={now.getFullYear() - 1}>{now.getFullYear() - 1}</option>
                <option value={now.getFullYear()}>{now.getFullYear()}</option>
                <option value={now.getFullYear() + 1}>{now.getFullYear() + 1}</option>
              </select>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 text-sm text-muted-foreground mt-4">
            Será criado um registo de <strong className="text-foreground">{formatter.format(item.amount || 0)}</strong> referente a <strong className="text-foreground">{MONTH_NAMES[selectedMonthIndex]} {selectedYear}</strong>.
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-11 px-5">
            Cancelar
          </Button>
          <Button 
            onClick={handleRegister} 
            className="rounded-xl h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirmar Registo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
