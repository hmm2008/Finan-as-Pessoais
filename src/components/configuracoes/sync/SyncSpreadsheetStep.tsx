import React from 'react';
import { Button } from '../../ui/button';
import { 
  FileSpreadsheet, Table, ExternalLink, RefreshCw, 
  Loader2, Calculator, Sparkles, Layers, CheckCircle2,
  AlertTriangle, Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { DriveSpreadsheetInfo } from '../../../lib/googleDriveService';

interface SyncSpreadsheetStepProps {
  spreadsheetInfo: DriveSpreadsheetInfo | null;
  isLoading: boolean;
  isTesting: boolean;
  isFormatting: boolean;
  onFindOrCreate: () => void;
  onTest: () => void;
  onFormat: () => void;
}

export function SyncSpreadsheetStep({
  spreadsheetInfo,
  isLoading,
  isTesting,
  isFormatting,
  onFindOrCreate,
  onTest,
  onFormat
}: SyncSpreadsheetStepProps) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card/40 space-y-4 relative overflow-hidden group">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            spreadsheetInfo 
              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm' 
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              2. Ficheiro de Dados
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              Google Sheets "Finanças Pessoais"
            </p>
          </div>
        </div>

        {spreadsheetInfo && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Table className="w-3.5 h-3.5" />
            ESTRUTURADO
          </div>
        )}
      </div>

      {!spreadsheetInfo ? (
        <div className="space-y-4 pt-1 relative z-10">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Localize a sua folha de cálculo existente ou crie uma nova estrutura organizada com todas as abas necessárias para a gestão financeira completa.
          </p>
          <Button 
            onClick={onFindOrCreate} 
            disabled={isLoading}
            variant="outline"
            className="w-full sm:w-auto border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 gap-2 text-xs font-bold h-10 px-6 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Localizar / Criar Estrutura na Drive
          </Button>
        </div>
      ) : (
        <div className="space-y-4 pt-1 relative z-10">
          {/* File Info Box */}
          <div className="bg-muted/40 rounded-2xl p-4 border border-border/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-border/40 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground tracking-tight">{spreadsheetInfo.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono opacity-60 truncate max-w-[180px] sm:max-w-xs">ID: {spreadsheetInfo.id}</p>
                </div>
              </div>
              <a 
                href={spreadsheetInfo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir no Google Sheets
              </a>
            </div>

            {/* Sheets list */}
            <div className="pt-3 border-t border-border/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Abas Ativas ({spreadsheetInfo.sheets.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {spreadsheetInfo.sheets.map((s) => (
                  <span 
                    key={s} 
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                      s === 'Dashboard_Calculos' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-card text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {s === 'Dashboard_Calculos' && <Sparkles className="w-3 h-3 inline mr-1 text-emerald-600" />}
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Area */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onTest}
              disabled={isTesting}
              className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-lg gap-1.5"
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Testar Saúde do Ficheiro
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onFormat}
              disabled={isFormatting}
              className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-lg gap-1.5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              {isFormatting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calculator className="w-3 h-3" />}
              Otimizar Formatação & Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Decorative Background */}
      <div className="absolute -bottom-12 -right-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity duration-700">
        <FileSpreadsheet className="w-48 h-48" />
      </div>
    </div>
  );
}
