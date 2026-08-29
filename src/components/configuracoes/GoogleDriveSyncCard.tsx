import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  HardDrive, 
  Loader2,
  Trash2,
  CheckCheck,
  History,
  Info,
  AlertTriangle
} from 'lucide-react';
import { 
  connectGoogleDrive, 
  findOrCreateFinanceSpreadsheet, 
  testSpreadsheetHealth, 
  formatAndStyleFinanceSpreadsheet,
  getCachedDriveToken, 
  setCachedDriveToken, 
  DriveSpreadsheetInfo,
  listSpreadsheetRevisions
} from '../../lib/googleDriveService';
import { 
  exportAllDataToSheets, 
  importAllDataFromSheets, 
  getSpreadsheetSheetTitles,
  clearAllSpreadsheetData,
  reorganizeIncomeSheetsAndDatabase,
  ReorganizeResult,
  flushPendingSyncQueue,
  getSyncAuditLogs,
  clearSyncAuditLogs,
  addSyncAuditLog,
  getPendingSyncQueueCount,
  SyncStats,
  SyncAuditLogEntry,
  getStorageMode,
  setStorageMode,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  subscribeToSyncStatus,
  scheduleSheetsBackgroundSync,
  SyncStatusEvent,
  StorageMode,
  forceRecreateMissingSheets,
} from '../../lib/googleSheetsDataService';
import { auth } from '../../lib/firebase';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { motion } from 'motion/react';

// Sub-components
import { SyncStatusBanner } from './sync/SyncStatusBanner';
import { SyncConnectionStep } from './sync/SyncConnectionStep';
import { SyncSpreadsheetStep } from './sync/SyncSpreadsheetStep';
import { SyncConfigStep } from './sync/SyncConfigStep';
import { SyncActionsSection } from './sync/SyncActionsSection';
import { SyncAuditLogsSection } from './sync/SyncAuditLogsSection';

export function GoogleDriveSyncCard() {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(getCachedDriveToken());
  const [userEmail, setUserEmail] = useState<string | null>(auth.currentUser?.email || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recoveryUrl, setRecoveryUrl] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [isReorganizing, setIsReorganizing] = useState(false);
  const [reorganizeResult, setReorganizeResult] = useState<ReorganizeResult | null>(null);
  const [isFlushingQueue, setIsFlushingQueue] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ status: string; percent: number } | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isFetchingRevisions, setIsFetchingRevisions] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Storage Mode, AutoSync, Audit Logs, Queue
  const [storageMode, setStorageModeState] = useState<StorageMode>(getStorageMode());
  const [autoSync, setAutoSyncState] = useState<boolean>(isAutoSyncEnabled());
  const [pendingCount, setPendingCount] = useState<number>(getPendingSyncQueueCount());
  const [auditLogs, setAuditLogs] = useState<SyncAuditLogEntry[]>(getSyncAuditLogs());
  const [showLogs, setShowLogs] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const [liveSyncStatus, setLiveSyncStatus] = useState<SyncStatusEvent>({
    state: 'idle',
    timestamp: new Date().toISOString(),
    pendingCount: getPendingSyncQueueCount()
  });

  const [spreadsheetInfo, setSpreadsheetInfo] = useState<DriveSpreadsheetInfo | null>(() => {
    try {
      const stored = localStorage.getItem('google_drive_spreadsheet_info');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [syncStats, setSyncStats] = useState<SyncStats | null>(() => {
    try {
      const stored = localStorage.getItem('google_drive_sync_stats');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const refreshAuditLogs = () => {
    setAuditLogs(getSyncAuditLogs());
    setPendingCount(getPendingSyncQueueCount());
  };

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user?.email) setUserEmail(user.email);
    });

    const handleOnline = () => {
      setIsOnline(true);
      refreshAuditLogs();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshAuditLogs();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubSyncStatus = subscribeToSyncStatus((event) => {
      setLiveSyncStatus(event);
      setPendingCount(event.pendingCount || getPendingSyncQueueCount());
      refreshAuditLogs();
      if (!getCachedDriveToken()) {
        setAccessToken(null);
      }
      if (event.state === 'synced') {
        try {
          const stored = localStorage.getItem('google_drive_sync_stats');
          if (stored) setSyncStats(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      unsubAuth();
      unsubSyncStatus();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await connectGoogleDrive();
      if (!res) {
        return;
      }
      setAccessToken(res.accessToken);
      if (res.userEmail) setUserEmail(res.userEmail);
      setSuccessMsg('Conta Google autorizada com sucesso!');
      
      // Auto find or create spreadsheet
      await handleFindOrCreateSpreadsheet(res.accessToken);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error(err);
      setErrorMsg(err.message || 'Falha ao conectar à conta Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindOrCreateSpreadsheet = async (tokenParam?: string) => {
    const activeToken = tokenParam || accessToken;
    if (!activeToken) {
      setErrorMsg('Por favor, conecte primeiro a sua conta Google.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const info = await findOrCreateFinanceSpreadsheet(activeToken);
      setSpreadsheetInfo(info);
      localStorage.setItem('google_drive_spreadsheet_info', JSON.stringify(info));
      
      // Auto-enable Hybrid Mode for real-time sync
      setStorageMode('hybrid');
      setStorageModeState('hybrid');
      
      if (info.createdNow) {
        setSuccessMsg('Nova folha de cálculo "Finanças Pessoais" criada com sucesso na sua Google Drive!');
      } else {
        setSuccessMsg('Folha de cálculo "Finanças Pessoais" localizada e associada! A descarregar dados...');
        
        // Auto-pull existing data
        try {
          const stats = await importAllDataFromSheets(activeToken, info.id, (status, percent) => {
            setSyncProgress({ status, percent });
          });
          setSyncStats(stats);
          refreshAuditLogs();
          queryClient.invalidateQueries();
          setSuccessMsg(`Folha localizada e dados importados com sucesso! (${stats.expensesCount} despesas, ${stats.incomesCount} receitas)`);
        } catch (pullErr: any) {
          console.error(pullErr);
          setErrorMsg('Folha localizada, mas falhou ao importar dados: ' + pullErr.message);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao comunicar com a Google Drive/Sheets API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!accessToken || !spreadsheetInfo?.id) return;
    setIsTesting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const isOk = await testSpreadsheetHealth(accessToken, spreadsheetInfo.id);
      if (isOk) {
        setSuccessMsg('Ligação testada e confirmada! A folha de cálculo está acessível.');
      } else {
        setErrorMsg('Não foi possível aceder à folha de cálculo.');
      }
    } catch (err: any) {
      setErrorMsg('Erro ao testar ligação: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleFormatSpreadsheet = async () => {
    if (!accessToken || !spreadsheetInfo?.id) return;
    setIsFormatting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await formatAndStyleFinanceSpreadsheet(accessToken, spreadsheetInfo.id);
      addSyncAuditLog({
        action: 'format',
        status: 'success',
        details: 'Formatadas abas e criada a aba Dashboard_Calculos'
      });
      refreshAuditLogs();
      await handleFindOrCreateSpreadsheet(accessToken);
      setSuccessMsg('Folha de cálculo formatada com sucesso!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao formatar folha de cálculo: ' + err.message);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleAnalyzeSpreadsheet = async () => {
    if (!recoveryUrl.trim()) return;
    let targetId = recoveryUrl.trim();
    if (targetId.includes('/d/')) {
      const match = targetId.match(/\/d\/([^/]+)/);
      if (match && match[1]) targetId = match[1];
    }

    const token = getCachedDriveToken();
    if (!token) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const titles = await getSpreadsheetSheetTitles(token, targetId);
      setDetectedSheets(titles);
      setSuccessMsg(`Folha analisada! Detetámos ${titles.length} abas.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Falha ao analisar folha: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecoverData = async () => {
    if (selectedSheets.length === 0) return;
    let targetId = recoveryUrl.trim();
    if (targetId.includes('/d/')) {
      const match = targetId.match(/\/d\/([^/]+)/);
      if (match && match[1]) targetId = match[1];
    }

    const token = getCachedDriveToken();
    if (!token) return;

    setIsRecovering(true);
    setErrorMsg(null);
    setSyncProgress({ status: 'Recuperando dados...', percent: 5 });

    try {
      await importAllDataFromSheets(token, targetId, (status, percent) => {
        setSyncProgress({ status, percent });
      }, selectedSheets);
      addSyncAuditLog({
        action: 'import',
        status: 'success',
        details: `Dados recuperados seletivamente (${selectedSheets.length} abas)`
      });
      setSuccessMsg('Recuperação concluída! A aplicação irá recarregar...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Falha na recuperação: ${err.message}`);
    } finally {
      setIsRecovering(false);
      setSyncProgress(null);
    }
  };

  const handleReorganizeIncomes = async () => {
    if (!accessToken || !spreadsheetInfo?.id) return;
    setIsReorganizing(true);
    setErrorMsg(null);

    try {
      const res = await reorganizeIncomeSheetsAndDatabase(accessToken, spreadsheetInfo.id, (status, percent) => {
        setSyncProgress({ status, percent });
      });
      setReorganizeResult(res);
      refreshAuditLogs();
      await handleFindOrCreateSpreadsheet(accessToken);
      queryClient.invalidateQueries();
      setSuccessMsg(res.message);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao reorganizar: ' + err.message);
    } finally {
      setIsReorganizing(false);
      setSyncProgress(null);
    }
  };

  const handleExportToSheets = async () => {
    if (!accessToken || !spreadsheetInfo?.id) return;
    setIsSyncing(true);
    setErrorMsg(null);

    try {
      const stats = await exportAllDataToSheets(accessToken, spreadsheetInfo.id, (status, percent) => {
        setSyncProgress({ status, percent });
      }, true);
      setSyncStats(stats);
      refreshAuditLogs();
      setSuccessMsg('Exportação concluída com sucesso!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro na exportação: ' + err.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleImportFromSheets = async () => {
    if (!accessToken || !spreadsheetInfo?.id) return;
    setIsSyncing(true);
    setErrorMsg(null);

    try {
      const stats = await importAllDataFromSheets(accessToken, spreadsheetInfo.id, (status, percent) => {
        setSyncProgress({ status, percent });
      });
      setSyncStats(stats);
      refreshAuditLogs();
      queryClient.invalidateQueries();
      setSuccessMsg('Importação concluída com sucesso!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro na importação: ' + err.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleConfirmClearSpreadsheetData = async () => {
    setShowClearModal(false);
    let token = accessToken || getCachedDriveToken();
    if (!token) return;

    setIsSyncing(true);
    setErrorMsg(null);

    try {
      await clearAllSpreadsheetData(token, spreadsheetInfo!.id, (status, percent) => {
        setSyncProgress({ status, percent });
      });
      queryClient.invalidateQueries();
      refreshAuditLogs();
      setSuccessMsg('Limpeza total concluída!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao limpar: ' + err.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleStorageModeChange = (mode: StorageMode) => {
    setStorageModeState(mode);
    setStorageMode(mode);
    if (mode === 'hybrid') {
      scheduleSheetsBackgroundSync(100);
    }
    setSuccessMsg(mode === 'hybrid' ? 'Modo Híbrido ativado!' : 'Modo Local ativado.');
  };

  const handleAutoSyncToggle = () => {
    const newVal = !autoSync;
    setAutoSyncState(newVal);
    setAutoSyncEnabled(newVal);
    if (newVal) scheduleSheetsBackgroundSync(100);
    setSuccessMsg(newVal ? 'Auto-Sync ativado!' : 'Auto-Sync desativado.');
  };

  const handleDisconnect = () => {
    setCachedDriveToken(null);
    setAccessToken(null);
    setSpreadsheetInfo(null);
    setSyncStats(null);
    localStorage.removeItem('google_drive_spreadsheet_info');
    localStorage.removeItem('google_drive_sync_stats');
    setSuccessMsg('Conexão Google Drive removida.');
  };

  const handleDownloadBackupJSON = () => {
    const data: any = {};
    const keys = ['fin_expenses', 'fin_incomes', 'fin_fixed_expenses', 'fin_accounts', 'fin_assets', 'fin_goals', 'finanas_user_prefs'];
    keys.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_financas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSuccessMsg('Backup JSON descarregado!');
  };

  const handleFetchRevisions = async () => {
    if (!accessToken) return;
    setIsFetchingRevisions(true);
    try {
      const revs = await listSpreadsheetRevisions(accessToken, spreadsheetInfo!.id);
      setRevisions(revs);
      setIsHistoryModalOpen(true);
    } catch (err: any) {
      setErrorMsg(`Erro ao carregar histórico: ${err.message}`);
    } finally {
      setIsFetchingRevisions(false);
    }
  };

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] overflow-hidden relative hover:bg-card/80 transition-all duration-300">
      <CardHeader className="bg-foreground/5 p-6 sm:p-8 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-foreground text-card flex items-center justify-center shrink-0 shadow-lg">
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl font-black tracking-tight text-foreground">Google Sheets Sync</CardTitle>
                <span className="px-2 py-0.5 text-[9px] font-black bg-foreground/10 text-foreground rounded-lg border border-border/40 uppercase tracking-widest">
                  Premium Cloud
                </span>
              </div>
              <CardDescription className="text-xs font-black uppercase text-muted-foreground/60 tracking-widest max-w-md">
                Sincronização bidirecional em tempo real com resiliência offline.
              </CardDescription>
            </div>
          </div>
          
          <SyncStatusBanner 
            isOnline={isOnline} 
            syncStatus={liveSyncStatus} 
            pendingCount={pendingCount} 
          />
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-8">
        {/* Alerts Area */}
        {(successMsg || errorMsg || syncProgress) && (
          <div className="space-y-3">
            {syncProgress && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{syncProgress.status}</span>
                  <span className="text-xs font-bold text-blue-600">{syncProgress.percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress.percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
            
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                {successMsg}
              </motion.div>
            )}

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-rose-600" />
                {errorMsg}
              </motion.div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SyncConnectionStep 
            accessToken={accessToken}
            userEmail={userEmail}
            isLoading={isLoading}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          
          <SyncSpreadsheetStep 
            spreadsheetInfo={spreadsheetInfo}
            isLoading={isLoading}
            isTesting={isTesting}
            isFormatting={isFormatting}
            onFindOrCreate={() => handleFindOrCreateSpreadsheet()}
            onTest={handleTestConnection}
            onFormat={handleFormatSpreadsheet}
          />
        </div>

        {accessToken && spreadsheetInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pt-4"
          >
            <SyncConfigStep 
              storageMode={storageMode}
              autoSync={autoSync}
              onStorageModeChange={handleStorageModeChange}
              onAutoSyncToggle={handleAutoSyncToggle}
            />

            <SyncActionsSection 
              isSyncing={isSyncing}
              isAnalyzing={isAnalyzing}
              isRecovering={isRecovering}
              isReorganizing={isReorganizing}
              recoveryUrl={recoveryUrl}
              detectedSheets={detectedSheets}
              selectedSheets={selectedSheets}
              onSetRecoveryUrl={setRecoveryUrl}
              onSetSelectedSheets={setSelectedSheets}
              onExport={handleExportToSheets}
              onImport={handleImportFromSheets}
              onClear={() => setShowClearModal(true)}
              onDownloadBackup={handleDownloadBackupJSON}
              onAnalyze={handleAnalyzeSpreadsheet}
              onRecover={handleRecoverData}
              onReorganize={handleReorganizeIncomes}
              onShowHistory={handleFetchRevisions}
            />

            <SyncAuditLogsSection 
              logs={auditLogs}
              showLogs={showLogs}
              onToggleLogs={() => setShowLogs(!showLogs)}
              onClearLogs={() => {
                clearSyncAuditLogs();
                refreshAuditLogs();
              }}
            />
          </motion.div>
        )}
      </CardContent>

      {/* History Modal */}
      <Modal 
        open={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)}
        title="Histórico de Versões do Google Sheets"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {revisions.map((rev) => (
            <div key={rev.id} className="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-border flex items-center justify-center">
                  <History className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {new Date(rev.modifiedTime).toLocaleString('pt-PT')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{rev.lastModifyingUserName || 'Sistema'}</p>
                </div>
              </div>
              <a 
                href={spreadsheetInfo?.url + `?rev=${rev.id}`}
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-black text-primary hover:underline"
              >
                VER VERSÃO
              </a>
            </div>
          ))}
        </div>
      </Modal>

      {/* Clear Modal */}
      <Modal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Limpeza Total de Dados"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase">Ação Irreversível</p>
              <p className="text-xs font-medium leading-relaxed">
                Esta ação irá eliminar permanentemente todos os dados da sua folha de cálculo Google e da memória local da aplicação. 
                Deseja mesmo continuar?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowClearModal(false)}>Cancelar</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={handleConfirmClearSpreadsheetData}>
              Sim, Eliminar Tudo
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
