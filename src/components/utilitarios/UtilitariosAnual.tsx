import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  CalendarDays, 
  FileText, 
  Download, 
  Printer, 
  X, 
  Eye, 
  Code2, 
  FileSpreadsheet, 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  Award,
  Check,
  Copy,
  Table as TableIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface UtilitariosAnualProps {
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  availableYears: string[];
  annualFormat: 'pdf' | 'json' | 'excel';
  setAnnualFormat: (val: 'pdf' | 'json' | 'excel') => void;
  annualData: any;
  handleDownloadAnnual: () => void;
  handlePrint: () => void;
  handleResetSelections: () => void;
  maskValue: (val: number, formatter: (v: number) => string) => string;
  formatCurrency: (val: number) => string;
  jsonAnnualPreviewString: string;
  copiedCode: boolean;
  setCopiedCode: (val: boolean) => void;
}

export function UtilitariosAnual({
  selectedYear,
  setSelectedYear,
  availableYears,
  annualFormat,
  setAnnualFormat,
  annualData,
  handleDownloadAnnual,
  handlePrint,
  handleResetSelections,
  maskValue,
  formatCurrency,
  jsonAnnualPreviewString,
  copiedCode,
  setCopiedCode
}: UtilitariosAnualProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Controls Bar (no-print) */}
      <Card className="no-print border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <CalendarDays className="w-5 h-5 text-primary" />
                Relatório Anual
              </CardTitle>
              <CardDescription className="text-xs">
                Consolidação de 12 meses de atividade financeira com taxas de poupança e evolução.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={handlePrint}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 text-sm font-semibold transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </Button>

              <Button 
                onClick={handleDownloadAnnual}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-sm font-semibold transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" /> Transferir
              </Button>

              <Button 
                variant="outline"
                onClick={handleResetSelections}
                className="gap-1.5 h-9 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Year Picker */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                Ano do Exercício
              </Label>
              <div className="space-y-3">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-background text-foreground text-sm rounded-xl border border-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary w-full shadow-sm transition-all"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2">
                  {availableYears.map(y => {
                    const isSel = selectedYear === y;
                    return (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all uppercase tracking-wider ${
                          isSel
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Format Selector */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Formato de Exportação
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'pdf', icon: FileText, color: 'rose', label: 'PDF' },
                  { id: 'json', icon: Code2, color: 'amber', label: 'JSON' },
                  { id: 'excel', icon: FileSpreadsheet, color: 'emerald', label: 'Excel' }
                ].map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => setAnnualFormat(format.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${
                      annualFormat === format.id
                        ? `bg-${format.color}-500/10 border-${format.color}-500 text-${format.color}-700 dark:text-${format.color}-400 font-bold ring-2 ring-${format.color}-500/20`
                        : 'bg-card border-border hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <format.icon className={`w-5 h-5 transition-transform group-hover:scale-110 text-${format.color}-600`} />
                    <span className="text-[10px] font-black tracking-tight">{format.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PREVIEW CONTAINER */}
      <div className="space-y-4">
        <div className="no-print flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Pré-visualização Anual — <span className="text-foreground">Ano {annualData.year}</span>
            </h2>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-primary/20 text-primary">
            {annualData.allTransactions.length} MOVIMENTOS NO ANO
          </Badge>
        </div>

        {/* FORMAT 1: PDF / PRINT LAYOUT */}
        {annualFormat === 'pdf' && (
          <div className="print-page max-w-[210mm] mx-auto p-12 bg-white text-slate-900 min-h-[297mm] shadow-2xl print:shadow-none print:p-0 my-4 print:my-0 rounded-2xl print:rounded-none border border-slate-200 print:border-0 transition-all">
            
            {/* Header */}
            <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-end">
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-lg">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Relatório de Exercício</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Relatório Anual</h1>
                <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  Ano de Exercício: <span className="text-slate-900 font-bold px-2 py-0.5 bg-slate-100 rounded">{annualData.year}</span>
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Manuel Francisco</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Emissão: {new Date().toLocaleDateString('pt-PT')}</p>
              </div>
            </div>

            {/* 1. Consolidação Anual */}
            <div className="mb-12">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px]">01</span>
                </div>
                Consolidação Anual de Resultados
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Receitas Anuais', value: annualData.totalIncomes, icon: TrendingUp, color: 'emerald' },
                  { label: 'Despesas Anuais', value: annualData.totalExpenses, icon: TrendingDown, color: 'rose' },
                  { label: 'Saldo Acumulado', value: annualData.balance, icon: CircleDollarSign, color: annualData.balance >= 0 ? 'slate' : 'rose' },
                  { label: 'Taxa de Poupança Média', value: `${annualData.savingsRate.toFixed(1)}%`, icon: Award, color: 'amber' }
                ].map((item) => (
                  <div key={item.label} className="p-4 border-2 border-slate-100 rounded-2xl bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">{item.label}</p>
                    <p className={`text-xl font-black tracking-tight text-slate-900 flex items-center gap-2`}>
                      {typeof item.value === 'number' ? maskValue(item.value, formatCurrency) : item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Evolução Mensal */}
            <div className="mb-12">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px]">02</span>
                </div>
                Evolução Mensal do Exercício
              </h2>
              <div className="overflow-hidden border-2 border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black uppercase tracking-widest">
                      <th className="py-3 px-4">Mês</th>
                      <th className="py-3 px-4 text-right">Receitas</th>
                      <th className="py-3 px-4 text-right">Despesas</th>
                      <th className="py-3 px-4 text-right">Saldo</th>
                      <th className="py-3 px-4 text-right">Poupança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualData.monthsBreakdown.map((m: any, idx: number) => (
                      <tr key={m.monthCode} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="py-2.5 px-4 font-black text-slate-800">{m.name}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{maskValue(m.incomes, formatCurrency)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-600">{maskValue(m.expenses, formatCurrency)}</td>
                        <td className={`py-2.5 px-4 text-right font-black ${m.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                          {maskValue(m.balance, formatCurrency)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-500">{m.savingsRate.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Distribuição Anual */}
            <div className="mb-12">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px]">03</span>
                </div>
                Distribuição de Custos por Categoria (Anual)
              </h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {annualData.expensesByCategory.slice(0, 10).map((item: any) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                      <span className="text-slate-600">{item.category}</span>
                      <span className="text-slate-900">{maskValue(item.amount, formatCurrency)} ({item.percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-900 h-full rounded-full"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 pt-8 border-t-2 border-slate-100 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Gestão de Finanças Pessoais © 2026 — Manuel Francisco</span>
              <span>Documento Oficial de Arquivo</span>
            </div>
          </div>
        )}

        {/* FORMAT 2: JSON LIVE PREVIEW */}
        {annualFormat === 'json' && (
          <Card className="border-border shadow-md overflow-hidden bg-slate-950">
            <CardHeader className="pb-3 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Annual JSON Dataset
                </CardTitle>
                <p className="text-[10px] text-white/40 font-medium tracking-tight">Dados consolidados do ano de {annualData.year}</p>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => {
                  navigator.clipboard.writeText(jsonAnnualPreviewString);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copiado' : 'Copiar JSON'}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 overflow-x-auto max-h-[500px] font-mono text-[11px] leading-relaxed text-amber-200/80 scrollbar-thin scrollbar-thumb-white/10">
                <pre>{jsonAnnualPreviewString}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FORMAT 3: EXCEL PREVIEW */}
        {annualFormat === 'excel' && (
          <Card className="border-border shadow-md overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <div className="space-y-1">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Dataset de Exercício Anual (.xlsx)
                </CardTitle>
                <p className="text-[10px] text-muted-foreground font-medium tracking-tight">Contém a evolução mensal e todos os movimentos do ano de {annualData.year}.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-muted/5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { name: 'Resumo Anual', icon: TableIcon, desc: 'Consolidação de totais e taxas' },
                  { name: 'Evolução Mensal', icon: TrendingUp, desc: 'Balanço mês a mês detalhado' },
                  { name: 'Dataset Completo', icon: FileSpreadsheet, desc: 'Milhares de transações anuais' }
                ].map((sheet) => (
                  <div key={sheet.name} className="p-5 bg-card border border-border rounded-2xl shadow-sm space-y-3 group hover:border-emerald-500/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <sheet.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">{sheet.name}</p>
                      <p className="text-[10px] text-muted-foreground">{sheet.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
