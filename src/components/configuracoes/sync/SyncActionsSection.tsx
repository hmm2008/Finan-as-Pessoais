import React from 'react';
import { Button } from '../../ui/button';
import { 
  UploadCloud, DownloadCloud, RotateCcw, GitFork, 
  Trash2, FileJson, Loader2, Info, AlertTriangle,
  History, Search, Check
} from 'lucide-react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface SyncActionsSectionProps {
  isSyncing: boolean;
  isAnalyzing: boolean;
  isRecovering: boolean;
  isReorganizing: boolean;
  recoveryUrl: string;
  detectedSheets: string[];
  selectedSheets: string[];
  onSetRecoveryUrl: (url: string) => void;
  onSetSelectedSheets: (sheets: string[]) => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  onDownloadBackup: () => void;
  onAnalyze: () => void;
  onRecover: () => void;
  onReorganize: () => void;
  onShowHistory: () => void;
}

export function SyncActionsSection({
  isSyncing,
  isAnalyzing,
  isRecovering,
  isReorganizing,
  recoveryUrl,
  detectedSheets,
  selectedSheets,
  onSetRecoveryUrl,
  onSetSelectedSheets,
  onExport,
  onImport,
  onClear,
  onDownloadBackup,
  onAnalyze,
  onRecover,
  onReorganize,
  onShowHistory
}: SyncActionsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button 
          onClick={onExport} 
          disabled={isSyncing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs font-bold h-10 rounded-xl"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          Exportar para Sheets
        </Button>
        <Button 
          variant="outline" 
          onClick={onImport} 
          disabled={isSyncing}
          className="gap-2 text-xs font-bold h-10 rounded-xl border-indigo-200 text-indigo-700"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
          Importar da Sheets
        </Button>
        <Button 
          variant="outline" 
          onClick={onShowHistory}
          className="gap-2 text-xs font-bold h-10 rounded-xl"
        >
          <History className="w-4 h-4" />
          Ver Histórico Versões
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recovery Section */}
        <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-black uppercase tracking-wider">Recuperação de Dados Externa</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Recupere dados de uma folha de cálculo antiga ou exportada manualmente inserindo o link ou ID.
          </p>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL ou ID da Folha de Cálculo</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Link do Google Sheets..." 
                  value={recoveryUrl}
                  onChange={(e) => onSetRecoveryUrl(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={onAnalyze}
                  disabled={isAnalyzing || !recoveryUrl.trim()}
                  className="h-9 px-4 text-xs font-bold rounded-lg"
                >
                  {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Analisar
                </Button>
              </div>
            </div>

            {detectedSheets.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Abas Detetadas ({detectedSheets.length})</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSetSelectedSheets(detectedSheets)}
                    className="h-6 px-2 text-[9px] font-bold uppercase tracking-tighter"
                  >
                    Selecionar Todas
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                  {detectedSheets.map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        onSetSelectedSheets(
                          selectedSheets.includes(s) 
                            ? selectedSheets.filter(x => x !== s) 
                            : [...selectedSheets, s]
                        );
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                        selectedSheets.includes(s)
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                          : 'bg-white dark:bg-slate-900 text-muted-foreground border-border hover:border-emerald-500/30'
                      }`}
                    >
                      {selectedSheets.includes(s) && <Check className="w-3 h-3 inline mr-1" />}
                      {s}
                    </button>
                  ))}
                </div>
                <Button 
                  onClick={onRecover}
                  disabled={isRecovering || selectedSheets.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-lg gap-2"
                >
                  {isRecovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Recuperar {selectedSheets.length} Abas Selecionadas
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <GitFork className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-black uppercase tracking-wider">Manutenção & Estrutura</h4>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-2">
              <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Reorganização de Estrutura
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Migre de abas fixas/pontuais para a nova estrutura unificada de Receitas com categorias automáticas.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReorganize}
                disabled={isReorganizing}
                className="w-full h-8 text-[10px] font-bold uppercase tracking-wider rounded-lg border-indigo-200 text-indigo-700 bg-white dark:bg-slate-900 hover:bg-indigo-50"
              >
                {isReorganizing ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <GitFork className="w-3 h-3 mr-1.5" />}
                Reorganizar Estrutura de Receitas
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDownloadBackup}
                className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg gap-1.5"
              >
                <FileJson className="w-3.5 h-3.5 text-blue-600" />
                Backup JSON
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClear}
                className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Tudo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
