import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { X, Download, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../../contexts';

interface ExportCSVDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportCSVDialog({ isOpen, onClose }: ExportCSVDialogProps) {
  const { currentMonth } = useDashboard();
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);


  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const monthLabel = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

  const handleExport = () => {
    setIsExporting(true);
    // Simulate generation
    setTimeout(() => {
      setIsExporting(false);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 2000);
    }, 1500);
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
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exportar para CSV
          </CardTitle>
          <CardDescription>
            Exportar dados puros para <span className="font-semibold text-foreground capitalize">{monthLabel}</span>
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
                Gera um ficheiro CSV contendo todas as transações, formatado para importação noutros sistemas ou análise em Excel.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancelar</Button>
                <Button onClick={handleExport} disabled={isExporting}>
                  {isExporting ? 'A gerar CSV...' : 'Gerar e Transferir'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
