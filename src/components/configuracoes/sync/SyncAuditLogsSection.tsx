import React from 'react';
import { Button } from '../../ui/button';
import { 
  History, Trash2, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, ArrowRight,
  Database, RefreshCw
} from 'lucide-react';
import { SyncAuditLogEntry } from '../../../lib/googleSheetsDataService';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface SyncAuditLogsSectionProps {
  logs: SyncAuditLogEntry[];
  showLogs: boolean;
  onToggleLogs: () => void;
  onClearLogs: () => void;
}

export function SyncAuditLogsSection({
  logs,
  showLogs,
  onToggleLogs,
  onClearLogs
}: SyncAuditLogsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-black uppercase tracking-wider">Histórico de Atividade</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleLogs}
            className="h-8 text-xs font-bold gap-1.5"
          >
            {showLogs ? 'Ocultar' : 'Ver Detalhes'}
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showLogs ? 'rotate-90' : ''}`} />
          </Button>
          {logs.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearLogs}
              className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-full"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showLogs && (
        <div className="bg-muted/20 border border-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="max-h-[350px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <RefreshCw className="w-8 h-8 mx-auto opacity-20" />
                <p className="text-xs font-medium italic">Nenhuma atividade registada recentemente.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                          log.status === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : log.status === 'queued'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : log.status === 'queued' ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-black uppercase tracking-wider text-foreground">
                              {log.action === 'export' ? 'Exportação Manual' : 
                               log.action === 'import' ? 'Importação Manual' : 
                               log.action === 'auto_sync' ? 'Sincronização Automática' :
                               log.action === 'offline_flushed' ? 'Fila Offline Processada' :
                               log.action === 'format' ? 'Formatação Estrutural' :
                               log.action === 'reorganize' ? 'Reorganização' : log.action}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-medium opacity-60">
                              {format(new Date(log.timestamp), "HH:mm:ss 'em' d 'de' MMM", { locale: pt })}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {log.details}
                          </p>
                          {log.recordsCount !== undefined && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <Database className="w-3 h-3 text-primary" />
                              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                                {log.recordsCount} registos processados
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
