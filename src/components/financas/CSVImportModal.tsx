import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { 
  X, 
  UploadCloud, 
  AlertCircle, 
  FileSpreadsheet, 
  CheckCircle2, 
  Calendar, 
  Columns, 
  FileText, 
  RefreshCw,
  TrendingDown,
  TrendingUp,
  CheckSquare,
  Square,
  MinusSquare,
  CheckCheck,
  Ban,
  CreditCard,
  Repeat,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';
import { useExpenses, useIncomes } from '../../hooks/queries';
import { getSuggestedCategory } from './AutoCategorization';
import { usePaymentMethods, normalizePaymentMethod } from '../../hooks/usePaymentMethods';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultYear?: number;
  defaultMonth?: number;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Helper: Parse recurring value (sim ou não)
export function parseRecurring(val: any): boolean {
  if (val === true || val === 1) return true;
  if (val === false || val === 0 || val === undefined || val === null || val === '') return false;
  const str = String(val).trim().toLowerCase();
  return ['sim', 's', 'true', 'yes', 'y', '1', 'fixa', 'fixo', 'mensal', 'recorrente'].includes(str);
}

// Helper: Parse row type (Receita vs Despesa)
export function parseRowType(val: any): 'expense' | 'income' | null {
  if (val === undefined || val === null || val === '') return null;
  const str = String(val).trim().toLowerCase();
  if (['receita', 'receitas', 'rendimento', 'rendimentos', 'salário', 'salario', 'crédito', 'credito', 'entrada', 'income', 'inflow', 'gain'].some(k => str.includes(k))) {
    return 'income';
  }
  if (['despesa', 'despesas', 'gasto', 'gastos', 'débito', 'debito', 'saída', 'saida', 'expense', 'outflow', 'custo'].some(k => str.includes(k))) {
    return 'expense';
  }
  return null;
}

export function CSVImportModal({ isOpen, onClose, defaultYear, defaultMonth }: CSVImportModalProps) {
  const queryClient = useQueryClient();
  const { addExpense } = useExpenses();
  const { addIncome } = useIncomes();
  const { paymentMethods } = usePaymentMethods();

  const currentYearNow = new Date().getFullYear();
  const currentMonthNow = new Date().getMonth() + 1;

  // Selected Year & Month for the import
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear || currentYearNow);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth || currentMonthNow);
  const [forceSelectedPeriod, setForceSelectedPeriod] = useState<boolean>(true);
  const [defaultCategory, setDefaultCategory] = useState<string>('Outros');

  // File parsing states
  const [fileName, setFileName] = useState<string>('');
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<{ expenses: number; incomes: number } | null>(null);

  // Column mappings for all 8 standard titles
  const [entityField, setEntityField] = useState<string>('');
  const [amountField, setAmountField] = useState<string>('');
  const [dateField, setDateField] = useState<string>('');
  const [categoryField, setCategoryField] = useState<string>('');
  const [descriptionField, setDescriptionField] = useState<string>('');
  const [methodField, setMethodField] = useState<string>('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<string>('Débito Direto');
  const [recurringField, setRecurringField] = useState<string>('');
  const [typeField, setTypeField] = useState<string>('');
  const [typeMode, setTypeMode] = useState<'expense' | 'income' | 'auto'>('auto');
  const [rowTypeOverrides, setRowTypeOverrides] = useState<Record<number, 'expense' | 'income'>>({});

  // Excluded rows selector (items that user chooses NOT to import)
  const [excludedRowIds, setExcludedRowIds] = useState<Set<number>>(new Set());

  // Sync default values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultYear) setSelectedYear(defaultYear);
      if (defaultMonth) setSelectedMonth(defaultMonth);
      setImportResult(null);
      setImportProgress(0);
      setExcludedRowIds(new Set());
    }
  }, [isOpen, defaultYear, defaultMonth]);

  // Smart Column Detection for all titles: Tipo, Data, Valor, Categoria, Descrição, Origem/entidade, Método de pagamento, Recorrente
  const autoDetectColumns = (cols: string[]) => {
    let bestEntity = '';
    let bestAmount = '';
    let bestDate = '';
    let bestCat = '';
    let bestDesc = '';
    let bestMethod = '';
    let bestRecurring = '';
    let bestType = '';

    const lowerCols = cols.map(c => ({ original: c, lower: c.toLowerCase().trim() }));

    // 1. Detect Tipo (Despesa / Receita)
    for (const c of lowerCols) {
      if (['tipo', 'natureza', 'sentido', 'tipo de movimento', 'tipo de transação', 'tipo de transacao', 'tipo de registo', 'tipo movimento', 'd/c'].some(k => c.lower === k || c.lower.startsWith(k))) {
        bestType = c.original;
        break;
      }
    }

    // 2. Detect Origem / Entidade
    for (const c of lowerCols) {
      if (['origem/entidade', 'origem / entidade', 'origem', 'entidade', 'beneficiário', 'beneficiario', 'comerciante', 'destinatário', 'destinatario', 'fornecedor', 'empresa', 'nome'].some(k => c.lower.includes(k))) {
        bestEntity = c.original;
        break;
      }
    }
    // Fallback for entity if not found
    if (!bestEntity) {
      for (const c of lowerCols) {
        if (['descrição', 'descricao', 'descritivo', 'histórico', 'historico', 'memo'].some(k => c.lower.includes(k))) {
          bestEntity = c.original;
          break;
        }
      }
    }
    if (!bestEntity && cols.length > 0) bestEntity = cols[0];

    // 3. Detect Amount / Valor
    for (const c of lowerCols) {
      if (['valor', 'montante', 'quantia', 'importe', 'amount', 'debito', 'crédito', 'deb/cred', 'débito', 'valor movimento'].some(k => c.lower.includes(k))) {
        bestAmount = c.original;
        break;
      }
    }

    // 4. Detect Date / Data
    for (const c of lowerCols) {
      if (['data', 'data valor', 'data movimento', 'data operação', 'data operacao', 'date', 'data lancamento', 'lançamento'].some(k => c.lower.includes(k))) {
        bestDate = c.original;
        break;
      }
    }

    // 5. Detect Category / Categoria
    for (const c of lowerCols) {
      if (['categoria', 'category', 'tipo de despesa', 'classificação', 'classificacao', 'rubrica'].some(k => c.lower.includes(k))) {
        bestCat = c.original;
        break;
      }
    }

    // 6. Detect Description / Descrição (distinct from entity if possible)
    for (const c of lowerCols) {
      if (c.original !== bestEntity && ['descrição', 'descricao', 'descritivo', 'detalhe', 'observações', 'observacoes', 'obs', 'notas', 'memo', 'info'].some(k => c.lower.includes(k))) {
        bestDesc = c.original;
        break;
      }
    }

    // 7. Detect Payment Method / Método de Pagamento
    for (const c of lowerCols) {
      if (['método de pagamento', 'metodo de pagamento', 'método de pag', 'metodo de pag', 'método', 'metodo', 'forma de pagamento', 'meio de pagamento', 'payment method', 'modo de pagamento', 'pagamento', 'meio pag.'].some(k => c.lower.includes(k))) {
        bestMethod = c.original;
        break;
      }
    }

    // 8. Detect Recurring / Recorrente (sim ou não)
    for (const c of lowerCols) {
      if (['recorrente (sim ou não)', 'recorrente (sim/não)', 'recorrente', 'recorrência', 'recorrencia', 'fixa', 'fixo', 'despesa fixa', 'repetir', 'recurring', 'frequência', 'frequencia'].some(k => c.lower.includes(k))) {
        bestRecurring = c.original;
        break;
      }
    }

    setEntityField(bestEntity);
    setAmountField(bestAmount || (cols.length > 1 ? cols[1] : ''));
    setDateField(bestDate || '');
    setCategoryField(bestCat || '');
    setDescriptionField(bestDesc || '');
    setMethodField(bestMethod || '');
    setRecurringField(bestRecurring || '');
    setTypeField(bestType || '');
    if (bestType) {
      setTypeMode('auto');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

          if (jsonData.length > 0) {
            const cols = Object.keys(jsonData[0]);
            setAllColumns(cols);
            setRawData(jsonData);
            autoDetectColumns(cols);
          }
        } catch (err) {
          console.error('Erro ao ler ficheiro Excel:', err);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields && results.meta.fields.length > 0) {
            const cols = results.meta.fields;
            setAllColumns(cols);
            setRawData(results.data as Record<string, any>[]);
            autoDetectColumns(cols);
          }
        }
      });
    }
  };

  // Helper to parse amount value
  const parseAmount = (val: any): { num: number; isNegative: boolean } => {
    if (val === undefined || val === null) return { num: 0, isNegative: false };
    if (typeof val === 'number') return { num: Math.abs(val), isNegative: val < 0 };

    let str = String(val).trim();
    // Check if EUR, $, spaces
    str = str.replace(/[€$R\s]/g, '');
    
    // Check sign
    const isNegative = str.startsWith('-') || str.includes('( -') || (str.endsWith('-'));
    
    // Standardize decimal separators: 1.234,56 -> 1234.56 or 1234.56
    if (str.includes(',') && str.includes('.')) {
      if (str.indexOf('.') < str.indexOf(',')) {
        // format: 1.234,56
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // format: 1,234.56
        str = str.replace(/,/g, '');
      }
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }

    str = str.replace(/[^0-9.-]/g, '');
    const num = Math.abs(parseFloat(str) || 0);
    return { num, isNegative };
  };

  // Helper to parse date components from various string/number formats
  const parseDateComponents = (rawDateVal: any) => {
    let day = 1;
    let year = selectedYear;
    let month = selectedMonth;

    if (rawDateVal === undefined || rawDateVal === null || rawDateVal === '') {
      return { day, year, month };
    }

    // Handle Excel serial numbers (e.g., 45152)
    if (typeof rawDateVal === 'number' || (!isNaN(Number(rawDateVal)) && Number(rawDateVal) > 30000 && Number(rawDateVal) < 70000)) {
      const serial = Number(rawDateVal);
      const jsDate = new Date((serial - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(jsDate.getTime())) {
        day = jsDate.getDate();
        month = jsDate.getMonth() + 1;
        year = jsDate.getFullYear();
        return { day, year, month };
      }
    }

    const str = String(rawDateVal).trim();

    // 1. Try YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const ymdMatch = str.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
    if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10);
      month = parseInt(ymdMatch[2], 10);
      day = parseInt(ymdMatch[3], 10);
      return { day, year, month };
    }

    // 2. Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      month = parseInt(dmyMatch[2], 10);
      let y = parseInt(dmyMatch[3], 10);
      if (y < 100) y += 2000;
      year = y;
      return { day, year, month };
    }

    // 3. Fallback: JS Date
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      day = parsed.getDate();
      month = parsed.getMonth() + 1;
      year = parsed.getFullYear();
      return { day, year, month };
    }

    return { day, year, month };
  };

  // Helper to compute target date string (YYYY-MM-DD)
  const computeDate = (rawDateVal: any): string => {
    const parsed = parseDateComponents(rawDateVal);

    const finalYear = forceSelectedPeriod ? selectedYear : (parsed.year || selectedYear);
    const finalMonth = forceSelectedPeriod ? selectedMonth : (parsed.month || selectedMonth);
    const finalDay = Math.min(Math.max(parsed.day || 1, 1), 31);

    const yStr = String(finalYear);
    const mStr = String(finalMonth).padStart(2, '0');
    const dStr = String(finalDay).padStart(2, '0');

    return `${yStr}-${mStr}-${dStr}`;
  };

  // Processed preview rows incorporating all 8 columns
  const processedRows = useMemo(() => {
    if (!rawData.length) return [];

    return rawData.map((row, idx) => {
      const entity = (entityField && row[entityField]) ? String(row[entityField]).trim() : `Transação #${idx + 1}`;
      const rawAmt = amountField ? row[amountField] : 0;
      const { num, isNegative } = parseAmount(rawAmt);

      const customType = rowTypeOverrides[idx];
      let itemType: 'expense' | 'income' = 'expense';

      if (customType) {
        itemType = customType;
      } else if (typeField && row[typeField]) {
        // Row-level Type Column Detection (e.g. "Receita", "Despesa", "Despesa Fixa", etc.)
        const parsedType = parseRowType(row[typeField]);
        if (parsedType) {
          itemType = parsedType;
        } else if (typeMode === 'income') {
          itemType = 'income';
        } else {
          itemType = 'expense';
        }
      } else if (typeMode === 'expense') {
        itemType = 'expense';
      } else if (typeMode === 'income') {
        itemType = 'income';
      } else {
        // Smart Auto Detection
        const colLower = (amountField || '').toLowerCase();
        const isCreditCol = ['credito', 'crédito', 'receita', 'entrada', 'inflow', 'credit', 'recebido'].some(k => colLower.includes(k));
        const isDebitCol = ['debito', 'débito', 'despesa', 'saida', 'saída', 'debit', 'pago', 'pagamento'].some(k => colLower.includes(k));

        if (isCreditCol) {
          itemType = isNegative ? 'expense' : 'income';
        } else if (isDebitCol) {
          itemType = isNegative ? 'income' : 'expense';
        } else {
          // General column: negative values are expenses, positive values are expenses unless explicitly marked as income
          itemType = 'expense';
        }
      }

      const rawCat = (categoryField && row[categoryField]) ? String(row[categoryField]).trim() : '';
      const suggestedCat = rawCat || getSuggestedCategory(entity) || defaultCategory;
      const calculatedDate = computeDate(dateField ? row[dateField] : null);

      // Payment method normalization
      const rawMethod = (methodField && row[methodField]) ? row[methodField] : null;
      const normalizedMethod = normalizePaymentMethod(rawMethod, defaultPaymentMethod);

      // Recurring normalization (sim ou não)
      const rawRecurring = (recurringField && row[recurringField]) ? row[recurringField] : null;
      const isRecurring = parseRecurring(rawRecurring);

      // Description / Notes
      const rawDesc = (descriptionField && row[descriptionField]) ? String(row[descriptionField]).trim() : '';
      const notes = rawDesc ? rawDesc : `Importado de: ${fileName || 'Ficheiro'}`;

      return {
        _id: idx,
        entity,
        amount: num,
        type: itemType,
        category: suggestedCat,
        date: calculatedDate,
        method: normalizedMethod,
        recurring: isRecurring,
        notes,
        raw: row
      };
    });
  }, [
    rawData, 
    entityField, 
    amountField, 
    dateField, 
    categoryField, 
    descriptionField,
    methodField, 
    defaultPaymentMethod,
    recurringField, 
    typeField,
    typeMode, 
    rowTypeOverrides, 
    selectedYear, 
    selectedMonth, 
    forceSelectedPeriod, 
    defaultCategory,
    fileName
  ]);

  // Active rows to be imported (excluding unchecked items)
  const rowsToImport = useMemo(() => {
    return processedRows.filter(row => !excludedRowIds.has(row._id));
  }, [processedRows, excludedRowIds]);

  // Exclusion / selection handlers
  const toggleRowExcluded = (id: number) => {
    setExcludedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllRows = () => {
    setExcludedRowIds(new Set());
  };

  const deselectAllRows = () => {
    const all = new Set<number>();
    processedRows.forEach(r => all.add(r._id));
    setExcludedRowIds(all);
  };

  const invertSelection = () => {
    const next = new Set<number>();
    processedRows.forEach(r => {
      if (!excludedRowIds.has(r._id)) {
        next.add(r._id);
      }
    });
    setExcludedRowIds(next);
  };

  const handleImport = async () => {
    if (!rowsToImport.length) return;

    setIsImporting(true);
    setImportProgress(0);

    let countExpenses = 0;
    let countIncomes = 0;

    const total = rowsToImport.length;

    for (let i = 0; i < total; i++) {
      const row = rowsToImport[i];
      if (row.amount <= 0 && !row.entity) continue;

      try {
        if (row.type === 'income') {
          await addIncome({
            entity: row.entity,
            amount: row.amount,
            category: row.category || 'Outros',
            date: row.date,
            method: row.method,
            paymentMethod: row.method,
            recurring: row.recurring,
            isFixed: row.recurring,
            notes: row.notes || `Importado de: ${fileName || 'Ficheiro'}`
          });
          countIncomes++;
        } else {
          await addExpense({
            entity: row.entity,
            amount: row.amount,
            category: row.category || 'Outros',
            date: row.date,
            method: row.method,
            paymentMethod: row.method,
            isFixed: row.recurring,
            recurring: row.recurring,
            notes: row.notes || `Importado de: ${fileName || 'Ficheiro'}`
          });
          countExpenses++;
        }
      } catch (err) {
        console.error('Erro ao importar linha:', row, err);
      }

      setImportProgress(Math.round(((i + 1) / total) * 100));
    }

    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    await queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });
    await queryClient.invalidateQueries({ queryKey: ['fixedIncomes'] });

    setIsImporting(false);
    setImportResult({ expenses: countExpenses, incomes: countIncomes });
  };

  const handleReset = () => {
    setRawData([]);
    setAllColumns([]);
    setFileName('');
    setImportResult(null);
    setRowTypeOverrides({});
    setExcludedRowIds(new Set());
    setEntityField('');
    setAmountField('');
    setDateField('');
    setCategoryField('');
    setDescriptionField('');
    setMethodField('');
    setRecurringField('');
    setTypeField('');
  };

  if (!isOpen) return null;

  const yearOptions = [
    currentYearNow - 3,
    currentYearNow - 2,
    currentYearNow - 1,
    currentYearNow,
    currentYearNow + 1,
    currentYearNow + 2
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl shadow-xl border-border my-4 max-h-[94vh] flex flex-col bg-card">
        
        {/* Header */}
        <CardHeader className="relative pb-3 border-b border-border shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Ficheiro Excel ou CSV
          </CardTitle>
          <CardDescription>
            Mapeamento completo da sua folha (Tipo, Data, Valor, Categoria, Descrição, Origem/Entidade, Método de Pagamento e Recorrente) com a nossa estrutura.
          </CardDescription>
        </CardHeader>

        {/* Content Body */}
        <CardContent className="space-y-4 p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* Top Control Bar: Period Selection (Year & Month) */}
          <div className="bg-secondary/40 p-3 sm:p-4 rounded-xl border border-border/80 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Período da Importação (Mês e Ano)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Year Select */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Ano de Destino</Label>
                <Select 
                  value={String(selectedYear)} 
                  onValueChange={(val) => setSelectedYear(parseInt(val, 10))}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Select */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Mês de Destino</Label>
                <Select 
                  value={String(selectedMonth)} 
                  onValueChange={(val) => setSelectedMonth(parseInt(val, 10))}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, index) => (
                      <SelectItem key={index + 1} value={String(index + 1)}>
                        {index + 1} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Force Selected Period Toggle */}
              <div className="flex flex-col justify-center">
                <Label className="text-xs text-muted-foreground mb-1 block">Aplicação de Período</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch 
                    id="force-period" 
                    checked={forceSelectedPeriod} 
                    onCheckedChange={setForceSelectedPeriod} 
                  />
                  <Label htmlFor="force-period" className="text-xs font-medium cursor-pointer">
                    {forceSelectedPeriod ? `Atribuir a ${MONTH_NAMES[selectedMonth - 1]}/${selectedYear}` : 'Usar datas originais do ficheiro'}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Import Result Screen */}
          {importResult && (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-in zoom-in-75 duration-200" />
              <div>
                <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Importação Concluída com Sucesso!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Foram importadas {importResult.expenses + importResult.incomes} transações para o período de <strong>{MONTH_NAMES[selectedMonth - 1]} de {selectedYear}</strong>.
                </p>
              </div>

              <div className="flex justify-center gap-4 text-xs font-semibold">
                <Badge variant="outline" className="px-3 py-1.5 border-rose-500/30 text-rose-600 bg-rose-500/10 gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {importResult.expenses} Despesas Registadas
                </Badge>
                <Badge variant="outline" className="px-3 py-1.5 border-emerald-500/30 text-emerald-600 bg-emerald-500/10 gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {importResult.incomes} Receitas
                </Badge>
              </div>

              <div className="pt-2 flex justify-center gap-2">
                <Button variant="outline" onClick={handleReset} className="text-xs">
                  Importar Outro Ficheiro
                </Button>
                <Button onClick={onClose} className="text-xs">
                  Concluir e Ver Finanças
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: Upload File Area */}
          {!rawData.length && !importResult && (
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <FileSpreadsheet className="w-12 h-12 text-primary/70 mb-3" />
              <p className="text-sm font-semibold mb-1 text-foreground">Carregar Ficheiro de Transações (XLS, XLSX ou CSV)</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-md">
                Suporta títulos personalizados como Tipo, Data, Valor, Categoria, Descrição, Origem/Entidade, Método de Pagamento e Recorrente.
              </p>
              <Button size="sm" className="gap-2 pointer-events-none">
                <UploadCloud className="w-4 h-4" /> Selecionar Ficheiro
              </Button>
              <input 
                id="file-upload-input" 
                type="file" 
                accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </div>
          )}

          {/* Step 2: Display All Fields and Customization */}
          {rawData.length > 0 && !importResult && (
            <div className="space-y-4">
              
              {/* File Info & Detected Fields Summary */}
              <div className="bg-card border border-border p-3.5 rounded-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold truncate max-w-xs">{fileName}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {rawData.length} linhas detetadas
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    <RefreshCw className="w-3 h-3 mr-1" /> Trocar Ficheiro
                  </Button>
                </div>

                {/* All Detected Columns Chips */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Columns className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Colunas detetadas no seu ficheiro ({allColumns.length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
                    {allColumns.map(col => (
                      <span 
                        key={col} 
                        className="px-2 py-0.5 text-[11px] font-mono bg-secondary text-secondary-foreground rounded-md border border-border/60"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Complete 8-Column Structure Mapping Grid */}
              <div className="bg-secondary/30 p-4 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold text-foreground">
                      Mapeamento com a Estrutura da Aplicação
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Associação automática aos títulos do ficheiro
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* 1. Origem / Entidade */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground">
                        1. Origem / Entidade <span className="text-rose-500">*</span>
                      </Label>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">Obrigatório</Badge>
                    </div>
                    <Select value={entityField} onValueChange={setEntityField}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {allColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Montante / Valor */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground">
                        2. Montante / Valor <span className="text-rose-500">*</span>
                      </Label>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">Obrigatório</Badge>
                    </div>
                    <Select value={amountField} onValueChange={setAmountField}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {allColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Data */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground">
                        3. Data da Transação
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Auto-detetado</span>
                    </div>
                    <Select value={dateField || 'none'} onValueChange={(val) => setDateField(val === 'none' ? '' : val)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Automático / Sem campo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Usar Mês/Ano Selecionado --</SelectItem>
                        {allColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 4. Categoria */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground">
                        4. Categoria
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Auto-sugestão</span>
                    </div>
                    <Select value={categoryField || 'auto'} onValueChange={(val) => setCategoryField(val === 'auto' ? '' : val)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Sugestão Inteligente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">-- Sugestão Inteligente por Entidade --</SelectItem>
                        {allColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 5. Método de Pagamento */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-primary" />
                        5. Método de Pagamento
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Normalizado</span>
                    </div>
                    <div className="space-y-1.5">
                      <Select value={methodField || 'none'} onValueChange={(val) => setMethodField(val === 'none' ? '' : val)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Coluna do Ficheiro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Sem Coluna (Usar Predefinição) --</SelectItem>
                          {allColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-muted-foreground shrink-0">Se vazio:</span>
                        <div className="flex-1">
                          <PaymentMethodSelector 
                            value={defaultPaymentMethod} 
                            onChange={setDefaultPaymentMethod} 
                            id="default-method" 
                            className="h-6 text-[11px] py-0 px-2 bg-secondary/50" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Recorrente (Sim ou Não) */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-primary" />
                        6. Recorrente (Sim/Não)
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Fixa vs Pontual</span>
                    </div>
                    <Select value={recurringField || 'none'} onValueChange={(val) => setRecurringField(val === 'none' ? '' : val)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Coluna de Recorrência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Todas Pontuais (Não Recorrente) --</SelectItem>
                        {allColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 7. Tipo (Despesa / Receita) */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground">
                        7. Tipo (Despesa / Receita)
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Classificação</span>
                    </div>
                    <div className="space-y-1.5">
                      <Select value={typeField || 'none'} onValueChange={(val) => setTypeField(val === 'none' ? '' : val)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Coluna Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Sem Coluna (Usar Modo Global) --</SelectItem>
                          {allColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={typeMode} 
                        onValueChange={(v: any) => {
                          setTypeMode(v);
                          setRowTypeOverrides({});
                        }}
                      >
                        <SelectTrigger className="h-6 text-[11px] py-0 px-2 bg-secondary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Modo: Auto Inteligente</SelectItem>
                          <SelectItem value="expense">Modo: Todas Despesas</SelectItem>
                          <SelectItem value="income">Modo: Todas Receitas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 8. Descrição / Notas */}
                  <div className="space-y-1 bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-foreground">
                        8. Descrição / Notas
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Opcional</span>
                    </div>
                    <Select value={descriptionField || 'none'} onValueChange={(val) => setDescriptionField(val === 'none' ? '' : val)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Coluna de Descrição / Memo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Sem campo de descrição adicional --</SelectItem>
                        {allColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </div>

              {/* Comprehensive Preview Table with All Mapped Columns and Item Exclusion Selector */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-1 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Pré-visualização ({processedRows.length} linhas)
                    </span>
                    <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                      {rowsToImport.length} a importar
                    </Badge>
                    {excludedRowIds.size > 0 && (
                      <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground bg-secondary border-border">
                        {excludedRowIds.size} excluídos (não importar)
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Batch Selection Controls */}
                    <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/80 text-[11px]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-medium hover:bg-background"
                        onClick={selectAllRows}
                        title="Selecionar todas as linhas para importação"
                      >
                        <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Todos
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-medium hover:bg-background"
                        onClick={deselectAllRows}
                        title="Excluir todas as linhas (não importar nenhuma)"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1 text-rose-500" />
                        Nenhum
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-medium hover:bg-background"
                        onClick={invertSelection}
                        title="Inverter a seleção de linhas"
                      >
                        Inverter
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2 text-rose-600 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                      onClick={() => {
                        setTypeMode('expense');
                        setTypeField('');
                        setRowTypeOverrides({});
                      }}
                    >
                      Todas Despesas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                      onClick={() => {
                        setTypeMode('income');
                        setTypeField('');
                        setRowTypeOverrides({});
                      }}
                    >
                      Todas Receitas
                    </Button>
                    <span className="ml-2 hidden sm:inline">
                      Destino: <strong>{MONTH_NAMES[selectedMonth - 1]} de {selectedYear}</strong>
                    </span>
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
                  <div className="max-h-[420px] overflow-x-auto overflow-y-auto scrollbar-thin">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="text-[11px] font-semibold text-muted-foreground uppercase bg-secondary/90 sticky top-0 z-10 border-b border-border">
                        <tr>
                          {/* Selection Checkbox Header */}
                          <th className="px-3 py-2 text-center w-12 sticky top-0 z-20 bg-secondary/90">
                            <button
                              type="button"
                              onClick={() => {
                                if (excludedRowIds.size === 0) {
                                  deselectAllRows();
                                } else {
                                  selectAllRows();
                                }
                              }}
                              title={excludedRowIds.size === 0 ? "Desmarcar todas as linhas (não importar)" : "Selecionar todas as linhas para importar"}
                              className="p-0.5 rounded hover:bg-background/80 transition-colors inline-flex items-center justify-center cursor-pointer"
                            >
                              {excludedRowIds.size === 0 ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : excludedRowIds.size === processedRows.length ? (
                                <Square className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <MinusSquare className="w-4 h-4 text-amber-500" />
                              )}
                            </button>
                          </th>
                          <th className="px-2 py-2 text-center w-10">#</th>
                          <th className="px-3 py-2 text-center">Tipo</th>
                          <th className="px-3 py-2">Data Atribuída</th>
                          <th className="px-3 py-2">Origem / Entidade</th>
                          <th className="px-3 py-2 text-right">Valor (€)</th>
                          <th className="px-3 py-2">Categoria</th>
                          <th className="px-3 py-2">Método de Pagamento</th>
                          <th className="px-3 py-2 text-center">Recorrente</th>
                          <th className="px-3 py-2">Descrição / Notas</th>
                          {/* Display all original columns headers */}
                          {allColumns.map(col => (
                            <th 
                              key={col} 
                              className={`px-3 py-2 whitespace-nowrap ${
                                [entityField, amountField, dateField, categoryField, methodField, recurringField, typeField, descriptionField].includes(col) 
                                  ? 'text-primary font-bold bg-primary/5' 
                                  : ''
                              }`}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {processedRows.map((row, i) => {
                          const isExcluded = excludedRowIds.has(row._id);
                          return (
                            <tr 
                              key={i} 
                              className={`transition-colors ${
                                isExcluded 
                                  ? 'bg-muted/30 text-muted-foreground/60 opacity-60' 
                                  : 'hover:bg-secondary/30 text-foreground'
                              }`}
                            >
                              {/* Row Checkbox Selector */}
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    id={`import-row-${row._id}`}
                                    checked={!isExcluded}
                                    onChange={() => toggleRowExcluded(row._id)}
                                    title={isExcluded ? "Clique para incluir na importação" : "Clique para excluir / não importar"}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                                  />
                                </div>
                              </td>

                              {/* Index */}
                              <td className="px-2 py-2 text-center text-muted-foreground font-mono text-[11px]">{i + 1}</td>
                              
                              {/* Type badge - clickable to override or shows excluded */}
                              <td className="px-3 py-2 text-center">
                                {isExcluded ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
                                    <Ban className="w-2.5 h-2.5" /> Não importar
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRowTypeOverrides(prev => ({
                                        ...prev,
                                        [row._id]: row.type === 'expense' ? 'income' : 'expense'
                                      }));
                                    }}
                                    title="Clique para alternar entre Despesa e Receita"
                                    className="inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95"
                                  >
                                    {row.type === 'expense' ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20 shadow-2xs">
                                        Despesa ⚡
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-2xs">
                                        Receita ⚡
                                      </span>
                                    )}
                                  </button>
                                )}
                              </td>

                              {/* Date */}
                              <td className={`px-3 py-2 font-mono whitespace-nowrap ${isExcluded ? 'line-through' : ''}`}>
                                {row.date}
                              </td>

                              {/* Entity / Origin */}
                              <td className={`px-3 py-2 font-medium max-w-[180px] truncate ${isExcluded ? 'line-through text-muted-foreground' : ''}`} title={row.entity}>
                                {row.entity}
                              </td>

                              {/* Amount */}
                              <td className={`px-3 py-2 text-right font-mono font-bold whitespace-nowrap ${
                                isExcluded ? 'line-through text-muted-foreground' : (row.type === 'expense' ? 'text-rose-600' : 'text-emerald-600')
                              }`}>
                                {(row.amount ?? 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </td>

                              {/* Category */}
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] bg-secondary border border-border ${isExcluded ? 'opacity-60' : ''}`}>
                                  {row.category}
                                </span>
                              </td>

                              {/* Payment Method */}
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary/80 border border-border ${isExcluded ? 'opacity-60' : 'text-foreground'}`}>
                                  <CreditCard className="w-3 h-3 text-primary shrink-0" />
                                  {row.method}
                                </span>
                              </td>

                              {/* Recurring (Sim / Não) */}
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                {row.recurring ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/30 ${isExcluded ? 'opacity-60' : ''}`}>
                                    <Repeat className="w-2.5 h-2.5" /> Sim
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">Não</span>
                                )}
                              </td>

                              {/* Description / Notes */}
                              <td className={`px-3 py-2 max-w-[180px] truncate text-[11px] text-muted-foreground ${isExcluded ? 'line-through' : ''}`} title={row.notes}>
                                {row.notes}
                              </td>

                              {/* All raw fields values */}
                              {allColumns.map(col => (
                                <td 
                                  key={col} 
                                  className={`px-3 py-2 whitespace-nowrap max-w-[200px] truncate font-mono text-[11px] ${
                                    [entityField, amountField, dateField, categoryField, methodField, recurringField, typeField, descriptionField].includes(col) 
                                      ? (isExcluded ? 'text-muted-foreground' : 'bg-primary/5 font-semibold text-foreground') 
                                      : 'text-muted-foreground'
                                  } ${isExcluded ? 'line-through opacity-60' : ''}`}
                                  title={String(row.raw[col] ?? '')}
                                >
                                  {String(row.raw[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2 text-center text-[11px] text-muted-foreground bg-secondary/20 border-t border-border flex items-center justify-between px-4">
                    <span>
                      Total: <strong>{processedRows.length}</strong> linhas no ficheiro
                    </span>
                    <span className="font-semibold text-foreground">
                      {rowsToImport.length} selecionadas para importar {excludedRowIds.size > 0 && `(${excludedRowIds.size} ignoradas)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-border">
                <Button variant="outline" onClick={handleReset} disabled={isImporting}>
                  Cancelar / Novo Ficheiro
                </Button>

                <div className="flex items-center gap-3">
                  {isImporting && (
                    <span className="text-xs text-muted-foreground font-medium animate-pulse">
                      A importar: {importProgress}%
                    </span>
                  )}
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting || !rowsToImport.length || !entityField || !amountField}
                    className="bg-primary text-primary-foreground gap-2 min-w-[220px]"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {isImporting ? (
                      `A processar (${importProgress}%)...`
                    ) : rowsToImport.length === 0 ? (
                      'Nenhum registo selecionado'
                    ) : excludedRowIds.size > 0 ? (
                      `Importar ${rowsToImport.length} de ${processedRows.length} Transações`
                    ) : (
                      `Importar ${processedRows.length} Transações`
                    )}
                  </Button>
                </div>
              </div>

            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
