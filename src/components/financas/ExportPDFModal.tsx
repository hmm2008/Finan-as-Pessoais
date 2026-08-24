import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CircleDollarSign, 
  Award, 
  CheckCircle2, 
  Loader2, 
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useExpenses, useFixedExpenses, useIncomes, useFixedIncomes } from '../../hooks/queries';
import { useDashboard, usePrivacy } from '../../contexts';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMonth?: string;
}

export function ExportPDFModal({ isOpen, onClose, defaultMonth }: ExportPDFModalProps) {
  const { currentMonth } = useDashboard();
  const { expenses } = useExpenses();
  const { fixedExpenses } = useFixedExpenses();
  const { incomes } = useIncomes();
  const { fixedIncomes } = useFixedIncomes();
  const { maskValue } = usePrivacy();

  const printSheetRef = useRef<HTMLDivElement>(null);

  // Month options derived from data
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    if (defaultMonth) monthsSet.add(defaultMonth);
    if (currentMonth) monthsSet.add(currentMonth);

    expenses.forEach((e: any) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 7) {
        monthsSet.add(e.date.substring(0, 7));
      }
    });

    incomes.forEach((i: any) => {
      if (i.date && typeof i.date === 'string' && i.date.length >= 7) {
        monthsSet.add(i.date.substring(0, 7));
      }
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes, defaultMonth, currentMonth]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return defaultMonth || currentMonth || availableMonths[0] || '2026-08';
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // Compute detailed financial data for the selected month
  const reportData = useMemo(() => {
    const filteredRegisteredExpenses = expenses.filter((e: any) => e.date && e.date.startsWith(selectedMonth));
    const filteredFixedExpenses = fixedExpenses.filter((fe: any) => {
      if (fe.active === false) return false;
      if (fe.date && fe.date.startsWith(selectedMonth)) return true;
      if (!fe.date) return true; // Monthly fixed active
      return false;
    });

    const filteredIncomes = incomes.filter((i: any) => i.date && i.date.startsWith(selectedMonth));
    const filteredFixedIncomes = (fixedIncomes || []).filter((fi: any) => {
      if (fi.active === false) return false;
      if (fi.date && fi.date.startsWith(selectedMonth)) return true;
      if (!fi.date) return true; // Monthly fixed active
      return false;
    });

    const totalRegisteredExpenses = filteredRegisteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalFixedExpenses = filteredFixedExpenses.reduce((sum, item) => {
      const amt = Number(item.amount) || 0;
      const freq = (item.frequency || '').toLowerCase();
      if (freq.includes('anual')) return sum + (amt / 12);
      if (freq.includes('trimestr')) return sum + (amt / 3);
      if (freq.includes('semestr')) return sum + (amt / 6);
      return sum + amt;
    }, 0);
    const totalExpenses = totalRegisteredExpenses + totalFixedExpenses;

    const baseFixedIncomesSum = filteredFixedIncomes.reduce((sum, item) => {
      const amt = Number(item.amount) || 0;
      const freq = (item.frequency || '').toLowerCase();
      if (freq.includes('anual')) return sum + (amt / 12);
      if (freq.includes('trimestr')) return sum + (amt / 3);
      if (freq.includes('semestr')) return sum + (amt / 6);
      return sum + amt;
    }, 0);

    const recurringIncomesFromPeriod = filteredIncomes
      .filter((i: any) => (i.recurring === true || i.recurring === 'true' || i.recurring === 'Sim' || i.isFixed === true) && !(fixedIncomes || []).some((fi: any) => fi.id === i.id || fi.id === i.fixedIncomeId))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const totalFixedIncomes = baseFixedIncomesSum + recurringIncomesFromPeriod;

    const totalPunctualIncomes = filteredIncomes
      .filter((i: any) => (!i.recurring || i.recurring === 'false' || i.recurring === 'Não') && !i.isFixed && !i.fixedIncomeId)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const totalIncomes = totalFixedIncomes + totalPunctualIncomes;

    const balance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? (balance / totalIncomes) * 100 : 0;

    // Group Expenses by Category
    const expGroupMap: Record<string, number> = {};
    filteredRegisteredExpenses.forEach((e: any) => {
      const cat = e.category || 'Outros';
      const amt = Number(e.amount) || 0;
      expGroupMap[cat] = (expGroupMap[cat] || 0) + amt;
    });
    filteredFixedExpenses.forEach((e: any) => {
      const cat = e.category || 'Despesas Fixas';
      const amt = Number(e.amount) || 0;
      expGroupMap[cat] = (expGroupMap[cat] || 0) + amt;
    });

    const expensesByCategory = Object.entries(expGroupMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Group Incomes by Category
    const incGroupMap: Record<string, number> = {};
    filteredIncomes.forEach((i: any) => {
      const cat = i.category || 'Outros';
      const amt = Number(i.amount) || 0;
      incGroupMap[cat] = (incGroupMap[cat] || 0) + amt;
    });
    filteredFixedIncomes.forEach((fi: any) => {
      const cat = fi.category || 'Salário';
      const amt = Number(fi.amount) || 0;
      incGroupMap[cat] = (incGroupMap[cat] || 0) + amt;
    });

    const incomesByCategory = Object.entries(incGroupMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalIncomes > 0 ? (amount / totalIncomes) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Combined movements
    const allTransactions = [
      ...filteredRegisteredExpenses.map(e => ({ ...e, type: 'expense', subType: 'Registada' })),
      ...filteredFixedExpenses.map(fe => ({ ...fe, type: 'expense', subType: 'Fixa' })),
      ...filteredFixedIncomes.map(fi => ({ ...fi, type: 'income', subType: 'Fixa' })),
      ...filteredIncomes.map(i => ({ ...i, type: 'income', subType: (i.recurring || i.isFixed || i.fixedIncomeId) ? 'Fixa' : 'Pontual' }))
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const [year, month] = selectedMonth.split('-');
    const monthDate = new Date(Number(year), Number(month) - 1, 15);
    const monthName = monthDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    return {
      monthKey: selectedMonth,
      monthName,
      totalRegisteredExpenses,
      totalFixedExpenses,
      totalExpenses,
      totalFixedIncomes,
      totalPunctualIncomes,
      totalIncomes,
      balance,
      savingsRate,
      expensesByCategory,
      incomesByCategory,
      allTransactions
    };
  }, [expenses, fixedExpenses, incomes, selectedMonth]);

  // Handler: Imprimir
  const handlePrint = () => {
    window.print();
  };

  // Handler: Transferir PDF
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      const element = printSheetRef.current || document.getElementById('pdf-preview-sheet');
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`Relatorio_Financeiro_${selectedMonth}.pdf`);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3500);
      }
    } catch (error) {
      console.error('Falha ao gerar o PDF diretamente com canvas, a abrir diálogo de impressão nativa:', error);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Cancelar
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      
      <Card className="w-full max-w-5xl shadow-2xl border-border bg-card max-h-[94vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Top Control Bar (no-print) */}
        <CardHeader className="no-print p-4 sm:p-5 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  Pré-visualização do Relatório em PDF
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Consulte o layout do relatório financeiro antes de imprimir ou transferir.
              </CardDescription>
            </div>

            {/* Actions Bar: Imprimir, Transferir, Cancelar */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Month Selector inside Modal */}
              <div className="flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-background text-foreground text-xs rounded-lg border border-border px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-9 font-medium"
                >
                  {availableMonths.map(m => {
                    const [y, mn] = m.split('-');
                    const d = new Date(Number(y), Number(mn) - 1, 15);
                    const label = d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
                    return (
                      <option key={m} value={m}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Botão: Imprimir */}
              <Button 
                onClick={handlePrint}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 text-xs sm:text-sm font-semibold shadow-xs"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </Button>

              {/* Botão: Transferir */}
              <Button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs sm:text-sm font-semibold shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> A Gerar...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Transferir
                  </>
                )}
              </Button>

              {/* Botão: Cancelar */}
              <Button 
                variant="outline"
                onClick={handleCancel}
                className="gap-1.5 h-9 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>

          </div>

          {/* Feedback banner if downloaded */}
          {downloadSuccess && (
            <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>O relatório PDF de <strong>{reportData.monthName}</strong> foi gerado e transferido com sucesso!</span>
            </div>
          )}
        </CardHeader>

        {/* Modal Body: Document Preview (Scrollable Canvas) */}
        <CardContent className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-900/60">
          
          <div className="no-print flex items-center justify-between mb-3 text-xs text-muted-foreground px-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-primary" /> Formato A4 Padronizado (210mm × 297mm)
            </span>
            <span>{reportData.allTransactions.length} movimentos listados</span>
          </div>

          {/* Centered A4 Page Sheet */}
          <div 
            id="pdf-preview-sheet"
            ref={printSheetRef}
            className="print-page max-w-[210mm] mx-auto p-8 sm:p-10 bg-white text-slate-900 min-h-[297mm] shadow-xl print:shadow-none print:p-0 rounded-xl print:rounded-none border border-slate-200 print:border-0 transition-all font-sans text-xs leading-normal"
          >
            {/* 1. Header do Documento */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-indigo-600 print:text-black" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 print:text-black">
                    Relatório Financeiro
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-slate-900">
                  Finanças Pessoais
                </h1>
                <p className="text-slate-600 mt-1 text-xs font-medium">
                  Período: <span className="capitalize text-slate-900 font-bold">{reportData.monthName}</span>
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                <p className="font-semibold text-slate-800">Utilizador: Manuel Francisco</p>
                <p>Data de Emissão: {new Date().toLocaleDateString('pt-PT')}</p>
                <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300 font-normal">
                  Exercício {reportData.monthKey}
                </Badge>
              </div>
            </div>

            {/* 2. Resumo Executivo / KPIs */}
            <div className="mb-7">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <CircleDollarSign className="w-4 h-4 text-indigo-600 print:text-black" />
                1. Resumo Executivo do Mês
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Receitas</p>
                  <p className="text-base sm:text-lg font-bold mt-1 text-emerald-700 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {maskValue(reportData.totalIncomes, formatCurrency)}
                  </p>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>Fixas: {maskValue(reportData.totalFixedIncomes, formatCurrency)}</span>
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Despesas</p>
                  <p className="text-base sm:text-lg font-bold mt-1 text-rose-700 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {maskValue(reportData.totalExpenses, formatCurrency)}
                  </p>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>Fixas: {maskValue(reportData.totalFixedExpenses, formatCurrency)}</span>
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Saldo do Mês</p>
                  <p className={`text-base sm:text-lg font-bold mt-1 ${reportData.balance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                    {maskValue(reportData.balance, formatCurrency)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {reportData.balance >= 0 ? 'Superávit positivo' : 'Défice no período'}
                  </p>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Taxa de Poupança</p>
                  <p className="text-base sm:text-lg font-bold mt-1 text-slate-800 flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-600 print:text-black" />
                    {reportData.savingsRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {reportData.savingsRate >= 20 ? 'Excelente poupança' : 'Acompanhar metas'}
                  </p>
                </div>
              </div>

              {/* Sub-breakdown: Receitas Pontuais vs Despesas Registadas */}
              <div className="grid grid-cols-2 gap-3 text-[11px] p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-slate-500">Receitas Pontuais: </span>
                  <span className="font-semibold text-slate-800">{maskValue(reportData.totalPunctualIncomes, formatCurrency)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Despesas Registadas (Correntes): </span>
                  <span className="font-semibold text-slate-800">{maskValue(reportData.totalRegisteredExpenses, formatCurrency)}</span>
                </div>
              </div>
            </div>

            {/* 3. Distribuição por Categorias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-7">
              {/* Despesas por Categoria */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                  2. Despesas por Categoria
                </h2>
                {reportData.expensesByCategory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Sem despesas registadas neste mês.</p>
                ) : (
                  <div className="space-y-2">
                    {reportData.expensesByCategory.slice(0, 6).map(item => (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700">{item.category}</span>
                          <span className="text-slate-900 font-bold">{maskValue(item.amount, formatCurrency)} ({item.percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 print:bg-slate-700 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Receitas por Categoria */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                  3. Receitas por Categoria
                </h2>
                {reportData.incomesByCategory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Sem receitas registadas neste mês.</p>
                ) : (
                  <div className="space-y-2">
                    {reportData.incomesByCategory.slice(0, 6).map(item => (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700">{item.category}</span>
                          <span className="text-slate-900 font-bold">{maskValue(item.amount, formatCurrency)} ({item.percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 print:bg-slate-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Lista Completa de Transações do Mês */}
            <div className="mb-7">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 print:text-black" />
                4. Registo Completo de Transações ({reportData.allTransactions.length})
              </h2>
              
              {reportData.allTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
                  Sem movimentos financeiros efetuados neste período.
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-700 font-bold">
                      <th className="py-2 px-1">Data</th>
                      <th className="py-2 px-1">Tipo</th>
                      <th className="py-2 px-1">Entidade / Descrição</th>
                      <th className="py-2 px-1">Categoria</th>
                      <th className="py-2 px-1">Método</th>
                      <th className="py-2 px-1 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.allTransactions.map((t: any, idx: number) => (
                      <tr key={t.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-1.5 px-1 whitespace-nowrap text-slate-600">
                          {t.date ? new Date(t.date).toLocaleDateString('pt-PT') : '-'}
                        </td>
                        <td className="py-1.5 px-1 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            t.type === 'expense' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {t.type === 'expense' ? `Despesa (${t.subType})` : `Receita (${t.subType})`}
                          </span>
                        </td>
                        <td className="py-1.5 px-1">
                          <p className="font-semibold text-slate-800">{t.entity || t.description || 'Geral'}</p>
                          {t.notes && <p className="text-[10px] text-slate-500 italic">{t.notes}</p>}
                        </td>
                        <td className="py-1.5 px-1 text-slate-600">{t.category || '-'}</td>
                        <td className="py-1.5 px-1 text-slate-500">{t.method || '-'}</td>
                        <td className={`py-1.5 px-1 text-right font-bold ${t.type === 'expense' ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {t.type === 'expense' ? '-' : '+'}{maskValue(t.amount, formatCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé Oficial */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Gestão Financeira Pessoal — Documento Oficial de Consulta e Arquivo</p>
              <p>Gerado automaticamente pelo sistema de Gestão Financeira. Documento emitido para Manuel Francisco.</p>
            </div>

          </div>

        </CardContent>

        {/* Modal Bottom Action Footer (no-print) */}
        <div className="no-print p-3 sm:p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-muted-foreground">
            Período: <strong className="text-foreground capitalize">{reportData.monthName}</strong> • {reportData.allTransactions.length} movimentos
          </p>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </Button>
            <Button 
              size="sm"
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold h-8"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
            <Button 
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold h-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> A Gerar...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Transferir
                </>
              )}
            </Button>
          </div>
        </div>

      </Card>
    </div>
  );
}
