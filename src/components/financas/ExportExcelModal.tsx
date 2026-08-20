import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { X, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../../contexts';
import { useExpenses, useIncomes } from '../../hooks/queries';
import { exportExcel } from '../../utils/exportExcel';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportExcelModal({ isOpen, onClose }: ExportExcelModalProps) {
  const { currentMonth } = useDashboard();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const monthLabel = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));
        const currentMonthIncomes = incomes.filter(i => i.date && i.date.startsWith(currentMonth));

        const punctualIncomes = currentMonthIncomes.filter(i => !i.isFixed && !i.fixedIncomeId);
        const fixedIncomes = currentMonthIncomes.filter(i => i.isFixed || i.fixedIncomeId);

        const expData = currentMonthExpenses.map((e, idx) => ({
          'Nº': idx + 1,
          'Data': e.date,
          'Descrição': e.description || e.entity || '',
          'Categoria': e.category || 'Geral',
          'Tipo': e.isFixed ? 'Despesa Fixa' : 'Despesa Variável',
          'Método': e.paymentMethod || e.method || e.account || '',
          'Valor (€)': Number(e.amount) || 0,
          'Notas': e.notes || ''
        }));

        const incPunctualData = punctualIncomes.map((i, idx) => ({
          'Nº': idx + 1,
          'Data': i.date,
          'Entidade': i.entity || '',
          'Categoria': i.category || 'Geral',
          'Método': i.method || '',
          'Valor (€)': Number(i.amount) || 0,
          'Notas': i.notes || ''
        }));

        const incFixedData = fixedIncomes.map((i, idx) => ({
          'Nº': idx + 1,
          'Data': i.date,
          'Entidade': i.entity || '',
          'Categoria': i.category || 'Geral',
          'Método': i.method || '',
          'Valor (€)': Number(i.amount) || 0,
          'Notas': i.notes || ''
        }));

        const totalExp = currentMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const totalIncPunc = punctualIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const totalIncFix = fixedIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const totalInc = totalIncPunc + totalIncFix;
        const balance = totalInc - totalExp;

        const summaryData = [
          { 'Métrica': 'Período', 'Valor': monthLabel },
          { 'Métrica': 'Total Receitas Pontuais', 'Valor': `${totalIncPunc.toFixed(2)} €` },
          { 'Métrica': 'Total Receitas Fixas', 'Valor': `${totalIncFix.toFixed(2)} €` },
          { 'Métrica': 'Total Receitas', 'Valor': `${totalInc.toFixed(2)} €` },
          { 'Métrica': 'Total Despesas', 'Valor': `${totalExp.toFixed(2)} €` },
          { 'Métrica': 'Saldo Mensal', 'Valor': `${balance.toFixed(2)} €` },
          { 'Métrica': 'Data de Emissão', 'Valor': new Date().toLocaleString('pt-PT') }
        ];

        const exportData = {
          'Despesas': expData.length > 0 ? expData : [{ Info: 'Sem despesas neste mês' }],
          'Receitas Pontuais': incPunctualData.length > 0 ? incPunctualData : [{ Info: 'Sem receitas pontuais neste mês' }],
          'Receitas Fixas Reg': incFixedData.length > 0 ? incFixedData : [{ Info: 'Sem receitas fixas neste mês' }],
          'Resumo': summaryData
        };

        exportExcel(exportData, `Relatorio_Mensal_${currentMonth}.xlsx`);
        
        setIsDone(true);
      } catch (err) {
        console.error('Export failed', err);
      } finally {
        setIsExporting(false);
        setTimeout(() => {
          setIsDone(false);
          onClose();
        }, 2000);
      }
    }, 500);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm shadow-lg border-border">
        <CardHeader className="relative pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            disabled={isExporting}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-emerald-600">
            <FileSpreadsheet className="w-5 h-5" />
            Exportar para Excel
          </CardTitle>
          <CardDescription>
            Gerar folha de cálculo para <span className="font-semibold text-foreground capitalize">{monthLabel}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {isDone ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="font-medium">Download Concluído!</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-left">
                Será gerado um ficheiro .xlsx com tabelas organizadas em diferentes abas (Despesas, Receitas Pontuais, Receitas Fixas Reg e Resumo).
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancelar</Button>
                <Button onClick={handleExport} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isExporting ? 'A gerar Excel...' : 'Gerar e Transferir'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
