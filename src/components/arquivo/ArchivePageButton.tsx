import React, { useState } from 'react';
import { Button } from '../ui/button';
import { FileDown, CheckCircle2 } from 'lucide-react';
import { DocumentItem } from './types';
import { generateMonthArchivePDF, MonthArchiveSummary } from './utils/archivePDF';

interface ArchivePageButtonProps {
  currentMonth: string;
  onArchiveCreated: (doc: DocumentItem) => void;
}

export function ArchivePageButton({ currentMonth, onArchiveCreated }: ArchivePageButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleArchiveMonth = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Create mock or real data for month archive summary
      const summaryData: MonthArchiveSummary = {
        month: currentMonth,
        totalIncome: 3450.00,
        totalExpense: 2180.50,
        netSavings: 1269.50,
        transactionsCount: 42,
        topCategories: [
          { category: 'Alimentação / Supermercado', amount: 485.20 },
          { category: 'Habitação & Renda', amount: 850.00 },
          { category: 'Transportes & Combustível', amount: 210.00 },
          { category: 'Restaurantes & Lazer', amount: 320.50 }
        ]
      };

      const { url, fileName, blob } = generateMonthArchivePDF(summaryData);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();

      // Create DocumentItem entry
      const newDoc: DocumentItem = {
        id: `doc_archive_${Date.now()}`,
        name: fileName,
        type: 'pdf',
        source: 'archives',
        sourceLabel: `Relatório Mês ${currentMonth}`,
        url: url,
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        createdAt: new Date().toISOString().split('T')[0]
      };

      onArchiveCreated(newDoc);
      setIsGenerating(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }, 600);
  };

  return (
    <Button 
      variant="outline"
      onClick={handleArchiveMonth} 
      disabled={isGenerating}
      className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
    >
      {success ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mês Arquivado
        </>
      ) : (
        <>
          <FileDown className={`w-4 h-4 mr-1.5 ${isGenerating ? 'animate-bounce' : ''}`} />
          {isGenerating ? 'Arquivando Mês...' : `Arquivar Mês ${currentMonth} (PDF)`}
        </>
      )}
    </Button>
  );
}
