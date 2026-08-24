import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Download, Upload, Search, FileText, FileSpreadsheet, Printer, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { ExpenseForm, IncomeForm, CSVImportModal, ExportPDFModal, ExportExcelModal, ExportCSVDialog } from './';
import { useNavigate } from 'react-router-dom';

interface FinancasToolbarProps {
  onSearch: (value: string) => void;
}

export function FinancasToolbar({ onSearch }: FinancasToolbarProps) {
  const navigate = useNavigate();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportPDFOpen, setExportPDFOpen] = useState(false);
  const [exportExcelOpen, setExportExcelOpen] = useState(false);
  const [exportCSVOpen, setExportCSVOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar transações..." 
          className="pl-9"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" className="hidden sm:flex" onClick={() => setImportModalOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Importar Ficheiro
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setExportPDFOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar para PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExportExcelOpen(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar para Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExportCSVOpen(true)}>
              <Download className="w-4 h-4 mr-2" />
              Exportar para CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/relatorio-imprimivel')}>
              <Printer className="w-4 h-4 mr-2" />
              Relatório Imprimível (A4)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1 sm:flex-none" onClick={() => setExpenseModalOpen(true)}>
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Despesa</span>
        </Button>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 sm:flex-none" onClick={() => setIncomeModalOpen(true)}>
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Receita</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="sm:hidden" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Importar Ficheiro
            </DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onClick={() => setExportPDFOpen(true)}>
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onClick={() => setExportExcelOpen(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
            </DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onClick={() => navigate('/relatorio-imprimivel')}>
              <Printer className="w-4 h-4 mr-2" /> Relatório Imprimível
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ExpenseForm isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
      <IncomeForm isOpen={incomeModalOpen} onClose={() => setIncomeModalOpen(false)} />
      <CSVImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
      <ExportPDFModal isOpen={exportPDFOpen} onClose={() => setExportPDFOpen(false)} />
      <ExportExcelModal isOpen={exportExcelOpen} onClose={() => setExportExcelOpen(false)} />
      <ExportCSVDialog isOpen={exportCSVOpen} onClose={() => setExportCSVOpen(false)} />
    </div>
  );
}
