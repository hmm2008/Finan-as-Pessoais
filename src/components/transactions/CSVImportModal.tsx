import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Table as TableIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { useExpenses, useIncomes, useCategorizationRules } from '../../hooks/queries';
import { cn } from '../../lib/utils';
import { getSuggestedCategory, getAISuggestedCategory } from '../financas/AutoCategorization';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface Mapping {
  date: string;
  description: string;
  amount: string;
  type: string; // optional if we can detect from amount
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Mapping>({
    date: '',
    description: '',
    amount: '',
    type: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState({ expenses: 0, incomes: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addExpense } = useExpenses();
  const { addIncome } = useIncomes();
  const { categorizationRules } = useCategorizationRules();

  const reset = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({ date: '', description: '', amount: '', type: '' });
    setImportStats({ expenses: 0, incomes: 0 });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setRows(results.data as ParsedRow[]);
          
          // Auto-mapping logic for common banks
          const lowerHeaders = results.meta.fields.map(h => h.toLowerCase());
          const newMapping = { ...mapping };
          
          // Date
          const dateIdx = lowerHeaders.findIndex(h => h.includes('data') || h.includes('date'));
          if (dateIdx !== -1) newMapping.date = results.meta.fields[dateIdx];
          
          // Description
          const descIdx = lowerHeaders.findIndex(h => h.includes('desc') || h.includes('movimento') || h.includes('detalhe'));
          if (descIdx !== -1) newMapping.description = results.meta.fields[descIdx];
          
          // Amount
          const amountIdx = lowerHeaders.findIndex(h => h.includes('valor') || h.includes('montante') || h.includes('amount') || h.includes('quantia'));
          if (amountIdx !== -1) newMapping.amount = results.meta.fields[amountIdx];

          setMapping(newMapping);
          setStep('mapping');
        }
      }
    });
  };

  const handleImport = async () => {
    setIsProcessing(true);
    let expensesCount = 0;
    let incomesCount = 0;

    try {
      const allCategories = ['Alimentação', 'Habitação', 'Transportes', 'Combustível', 'Saúde', 'Lazer', 'Luz', 'Água', 'Internet', 'Seguros', 'Educação', 'Investimentos', 'Outros'];

      for (const row of rows) {
        const rawAmount = row[mapping.amount]?.replace(',', '.').replace(/[^\d.-]/g, '');
        const amount = parseFloat(rawAmount || '0');
        const date = new Date(row[mapping.date]).toISOString().split('T')[0];
        const description = row[mapping.description] || 'Importado via CSV';

        if (isNaN(amount) || !row[mapping.date]) continue;

        // Auto-categorization logic
        let suggestedCategory = getSuggestedCategory(description, categorizationRules);
        
        // If local rules fail, use AI
        if (!suggestedCategory || suggestedCategory === 'Outros (Importado)') {
          const aiResult = await getAISuggestedCategory(description, Math.abs(amount), allCategories);
          if (aiResult) suggestedCategory = aiResult;
        }
        
        suggestedCategory = suggestedCategory || 'Outros (Importado)';

        if (amount < 0) {
          await addExpense({
            date,
            amount: Math.abs(amount),
            description,
            category: suggestedCategory,
            entity: 'Banco',
            method: 'Transferência',
            recurring: false,
            notes: `Importado de ${file?.name}`
          });
          expensesCount++;
        } else if (amount > 0) {
          await addIncome({
            date,
            amount,
            description,
            category: suggestedCategory,
            entity: 'Banco',
            method: 'Transferência',
            recurring: false,
            isFixed: false,
            notes: `Importado de ${file?.name}`
          });
          incomesCount++;
        }
      }
      setImportStats({ expenses: expensesCount, incomes: incomesCount });
      setStep('success');
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose}
      title="Importação Bancária"
      maxWidth="lg"
    >
      <div className="relative">
        <div className="space-y-6">
          <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const droppedFile = e.dataTransfer.files?.[0];
                      if (droppedFile) processFile(droppedFile);
                    }}
                    className="border-2 border-dashed border-border/60 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-black text-foreground">Clique ou arraste o ficheiro CSV</p>
                      <p className="text-xs font-bold text-muted-foreground mt-1">Formatos suportados: CGD, Santander, ActivoBank, etc.</p>
                    </div>
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Seguro e Privado</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Sem Intermédios</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'mapping' && (
                <motion.div
                  key="mapping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <TableIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">{file?.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{rows.length} linhas detectadas</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Mapeamento de Colunas</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {(['date', 'description', 'amount'] as const).map((field) => (
                        <div key={field} className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border border-border/40 group hover:border-primary/40 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">
                              {field === 'date' ? 'Data' : field === 'description' ? 'Desc' : 'Valor'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <select 
                              value={mapping[field]}
                              onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                              className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-foreground cursor-pointer appearance-none"
                            >
                              <option value="">Selecionar coluna...</option>
                              {headers.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed font-medium text-primary/80">
                      <strong className="text-primary">Dica:</strong> O sistema tentará categorizar automaticamente os seus movimentos com base nas suas regras personalizadas.
                    </p>
                  </div>

                  <Button 
                    className="w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[11px]"
                    disabled={!mapping.date || !mapping.description || !mapping.amount}
                    onClick={() => setStep('preview')}
                  >
                    Visualizar Importação
                  </Button>
                </motion.div>
              )}

              {step === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-border/40 bg-background/30 p-2 space-y-2">
                    {rows.slice(0, 5).map((row, i) => {
                      const amount = parseFloat(row[mapping.amount]?.replace(',', '.') || '0');
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card/60 border border-border/20">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-foreground truncate">{row[mapping.description]}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">{row[mapping.date]}</p>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                                {getSuggestedCategory(row[mapping.description] || '', categorizationRules) || 'Outros'}
                              </span>
                            </div>
                          </div>
                          <p className={cn(
                            "text-xs font-black tabular-nums",
                            amount < 0 ? "text-rose-600" : "text-emerald-600"
                          )}>
                            {amount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                      );
                    })}
                    {rows.length > 5 && (
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center py-2">
                        + {rows.length - 5} movimentos adicionais
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                      onClick={() => setStep('mapping')}
                      disabled={isProcessing}
                    >
                      Voltar
                    </Button>
                    <Button 
                      className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-[10px]"
                      onClick={handleImport}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processando...
                        </>
                      ) : (
                        'Confirmar Importação'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">Importação Concluída!</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Processámos {rows.length} linhas do seu extrato bancário com sucesso.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-2xl font-black text-emerald-600">{importStats.incomes}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700/60 mt-1">Receitas</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                      <p className="text-2xl font-black text-rose-600">{importStats.expenses}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-700/60 mt-1">Despesas</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[11px]"
                    onClick={onClose}
                  >
                    Fechar e Ver Transações
                  </Button>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
