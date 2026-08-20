import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  ExternalLink, 
  RefreshCw, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  Loader2,
  Table,
  Layers,
  UploadCloud,
  DownloadCloud,
  Clock,
  Zap,
  Radio,
  Sliders,
  Sparkles,
  Wifi,
  WifiOff,
  History,
  Trash2,
  CheckCheck,
  Calculator,
  FolderSync,
  ArrowRight,
  GitFork
} from 'lucide-react';
import { 
  connectGoogleDrive, 
  findOrCreateFinanceSpreadsheet, 
  testSpreadsheetHealth, 
  formatAndStyleFinanceSpreadsheet,
  getCachedDriveToken, 
  setCachedDriveToken, 
  DriveSpreadsheetInfo 
} from '../../lib/googleDriveService';
import { 
  exportAllDataToSheets, 
  importAllDataFromSheets, 
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
  StorageMode
} from '../../lib/googleSheetsDataService';
import { auth } from '../../lib/firebase';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';

export function GoogleDriveSyncCard() {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(getCachedDriveToken());
  const [userEmail, setUserEmail] = useState<string | null>(auth.currentUser?.email || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isReorganizing, setIsReorganizing] = useState(false);
  const [reorganizeResult, setReorganizeResult] = useState<ReorganizeResult | null>(null);
  const [isFlushingQueue, setIsFlushingQueue] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ status: string; percent: number } | null>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Phase 3 & 4 States: Storage Mode, AutoSync, Audit Logs, Queue
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
      
      if (info.createdNow) {
        setSuccessMsg('Nova folha de cálculo "Finanças Pessoais" criada com sucesso na sua Google Drive!');
      } else {
        setSuccessMsg('Folha de cálculo "Finanças Pessoais" localizada e associada com sucesso!');
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
        setSuccessMsg('Ligação testada e confirmada! A folha de cálculo está acessível com permissões de leitura e escrita.');
      } else {
        setErrorMsg('Não foi possível aceder à folha de cálculo. Tente ligar novamente a conta Google.');
      }
    } catch (err: any) {
      setErrorMsg('Erro ao testar ligação: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleFormatSpreadsheet = async () => {
    if (!accessToken || !spreadsheetInfo?.id) {
      setErrorMsg('Por favor, conecte a sua conta Google e certifique-se de que a folha de cálculo está criada.');
      return;
    }
    setIsFormatting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await formatAndStyleFinanceSpreadsheet(accessToken, spreadsheetInfo.id);
      
      addSyncAuditLog({
        action: 'format',
        status: 'success',
        details: 'Formatadas abas com tema Esmeralda e criada a aba "Dashboard_Calculos" com fórmulas automáticas'
      });
      refreshAuditLogs();

      // Refresh sheets list in info
      await handleFindOrCreateSpreadsheet(accessToken);
      setSuccessMsg('Folha de cálculo formatada com sucesso! A aba "Dashboard_Calculos" com fórmulas automáticas foi adicionada.');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || String(err);
      setErrorMsg('Erro ao formatar folha de cálculo: ' + msg);
      if (msg.includes('Sessão Google expirada') || !getCachedDriveToken()) {
        setAccessToken(null);
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const handleReorganizeIncomes = async () => {
    if (!accessToken || !spreadsheetInfo?.id) {
      setErrorMsg('Por favor, conecte a sua conta Google e certifique-se de que a folha de cálculo está ativa.');
      return;
    }
    setIsReorganizing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await reorganizeIncomeSheetsAndDatabase(accessToken, spreadsheetInfo.id, (status, percent) => {
        setSyncProgress({ status, percent });
      });

      setReorganizeResult(res);
      refreshAuditLogs();

      // Refresh sheets list in info
      await handleFindOrCreateSpreadsheet(accessToken);

      // Invalidate queries so UI refreshes everywhere instantly
      queryClient.invalidateQueries();

      setSuccessMsg(res.message);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || String(err);
      setErrorMsg('Erro ao reorganizar estrutura de receitas: ' + msg);
      if (msg.includes('Sessão Google expirada') || !getCachedDriveToken()) {
        setAccessToken(null);
      }
    } finally {
      setIsReorganizing(false);
      setSyncProgress(null);
    }
  };

  const handleExportToSheets = async () => {
    if (!accessToken || !spreadsheetInfo?.id) return;
    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const stats = await exportAllDataToSheets(accessToken, spreadsheetInfo.id, (status, percent) => {
        setSyncProgress({ status, percent });
      });

      setSyncStats(stats);
      refreshAuditLogs();
      setSuccessMsg(`Exportação concluída! ${stats.expensesCount} despesas, ${stats.incomesCount} receitas e restantes dados guardados no Google Sheets.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro na exportação para o Google Sheets: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleImportFromSheets = async () => {
    if (!accessToken || !spreadsheetInfo?.id) return;
    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const stats = await importAllDataFromSheets(accessToken, spreadsheetInfo.id, (status, percent) => {
        setSyncProgress({ status, percent });
      });

      setSyncStats(stats);
      refreshAuditLogs();
      
      // Invalidate queries so UI refreshes everywhere instantly
      queryClient.invalidateQueries();

      setSuccessMsg(`Importação concluída! Sincronizados ${stats.expensesCount} despesas e ${stats.incomesCount} receitas do Google Sheets para a aplicação.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro na importação da Google Sheets: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleOpenClearModal = () => {
    setShowClearModal(true);
  };

  const handleConfirmClearSpreadsheetData = async () => {
    setShowClearModal(false);

    let activeToken = accessToken || getCachedDriveToken();

    // If no active token, attempt to re-authenticate
    if (!activeToken) {
      try {
        const res = await connectGoogleDrive();
        if (res?.accessToken) {
          activeToken = res.accessToken;
          setAccessToken(activeToken);
        }
      } catch (err) {
        setErrorMsg('Erro de autenticação no Google Drive. Por favor, autorize a sua conta.');
        return;
      }
    }

    if (!activeToken || !spreadsheetInfo?.id) {
      setErrorMsg('Folha do Google Sheets não encontrada. Ligue primeiro o Google Drive.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const stats = await clearAllSpreadsheetData(activeToken, spreadsheetInfo.id, (status, percent) => {
        setSyncProgress({ status, percent });
      });

      setSyncStats(stats);
      queryClient.invalidateQueries();
      window.dispatchEvent(new Event('storage'));
      refreshAuditLogs();
      setSuccessMsg('Limpeza total concluída! Todos os registos no Google Drive, na base de dados e na aplicação foram eliminados definitivamente.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao limpar folha no Google Sheets: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleFlushPendingQueue = async () => {
    setIsFlushingQueue(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const ok = await flushPendingSyncQueue();
      refreshAuditLogs();
      if (ok) {
        setSuccessMsg('Fila de sincronização offline processada com sucesso!');
      } else {
        setSuccessMsg('Não existem itens pendentes para sincronizar.');
      }
    } catch (err: any) {
      setErrorMsg('Erro ao processar fila offline: ' + (err.message || 'Falha na ligação.'));
    } finally {
      setIsFlushingQueue(false);
    }
  };

  const handleStorageModeChange = (mode: StorageMode) => {
    setStorageModeState(mode);
    setStorageMode(mode);
    if (mode === 'hybrid') {
      scheduleSheetsBackgroundSync(100);
      setSuccessMsg('Modo Híbrido ativado! As alterações serão sincronizadas com o Google Sheets em tempo real.');
    } else {
      setSuccessMsg('Modo Local/Firebase ativado. O Google Sheets será atualizado apenas em exportações manuais.');
    }
  };

  const handleAutoSyncToggle = () => {
    const newVal = !autoSync;
    setAutoSyncState(newVal);
    setAutoSyncEnabled(newVal);
    if (newVal) {
      scheduleSheetsBackgroundSync(100);
      setSuccessMsg('Sincronização automática em tempo real ativada!');
    } else {
      setSuccessMsg('Sincronização automática em tempo real pausada.');
    }
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

  return (
    <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/40 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg font-bold">Google Drive & Sheets</CardTitle>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3 text-emerald-600" /> Fase 4: Autonomia & Resiliência Offline
                </span>
              </div>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Dual-Storage com sincronização automática, fila de resiliência offline e cálculos automatizados no Google Drive.
              </CardDescription>
            </div>
          </div>

          {/* Connection & Network Status Badges */}
          <div className="hidden sm:flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                  <WifiOff className="w-3 h-3" /> Modo Offline
                </span>
              )}
            </div>

            {accessToken && spreadsheetInfo && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl border bg-card text-xs font-medium shadow-2xs">
                {liveSyncStatus.state === 'syncing' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span className="text-blue-600 font-semibold">A sincronizar...</span>
                  </>
                ) : liveSyncStatus.state === 'offline_queued' || pendingCount > 0 ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-amber-600 font-semibold">{pendingCount} na fila offline</span>
                  </>
                ) : liveSyncStatus.state === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-rose-600 font-semibold">Erro no Auto-Sync</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Sincronizado</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        
        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs sm:text-sm rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5 flex-1">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{errorMsg}</p>
                {(errorMsg.includes('expirada') || errorMsg.includes('reconecte') || !accessToken) && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-300 mt-0.5">
                    Os tokens de segurança da Google expiram periodicamente por motivos de segurança. Clique no botão ao lado para renovar a autorização.
                  </p>
                )}
              </div>
            </div>
            {(errorMsg.includes('expirada') || errorMsg.includes('reconecte') || !accessToken) && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 px-3.5 shrink-0 gap-1.5 shadow-xs"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Reconectar Agora
              </Button>
            )}
          </div>
        )}

        {/* Offline Pending Items Banner */}
        {pendingCount > 0 && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Existem <strong>{pendingCount} alterações registadas offline</strong> prontas para serem enviadas para o Google Sheets.
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleFlushPendingQueue}
              disabled={isFlushingQueue || !isOnline}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-3 shrink-0"
            >
              {isFlushingQueue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Enviar Agora
            </Button>
          </div>
        )}

        {/* Step 1: Connect Account */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>1. Conexão de Conta Google</span>
            </div>
            {accessToken ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Autorizado
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">Não Conectado</span>
            )}
          </div>

          {!accessToken ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Autorize a aplicação a aceder à sua Google Drive para sincronizar todas as suas transações e dados financeiros.
              </p>
              <Button 
                onClick={handleConnect} 
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs sm:text-sm font-semibold shadow-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                Conectar Conta Google Drive
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Conta: <strong className="text-foreground">{userEmail || 'Utilizador Google'}</strong>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
                className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Desconectar
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Spreadsheet File & Professional Format */}
        {accessToken && (
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Ficheiro no Google Drive ("Finanças Pessoais")</span>
              </div>
              {spreadsheetInfo && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Table className="w-3.5 h-3.5" /> Ficheiro Pronto
                </span>
              )}
            </div>

            {!spreadsheetInfo ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Clique no botão abaixo para localizar ou criar a folha de cálculo com todas as abas estruturadas na sua Drive.
                </p>
                <Button 
                  onClick={() => handleFindOrCreateSpreadsheet()} 
                  disabled={isLoading}
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm font-semibold border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  Localizar / Criar Folha de Cálculo na Drive
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-card border border-border rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1.5 text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      {spreadsheetInfo.name}
                    </span>
                    <a 
                      href={spreadsheetInfo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-medium"
                    >
                      Abrir no Google Sheets <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-muted-foreground font-mono text-[11px] truncate">
                    ID: {spreadsheetInfo.id}
                  </div>
                </div>

                {/* Structured Sheets List */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <Layers className="w-3.5 h-3.5" /> Abas Estruturadas na Folha ({spreadsheetInfo.sheets.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {spreadsheetInfo.sheets.map((s) => (
                      <span 
                        key={s} 
                        className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${
                          s === 'Dashboard_Calculos' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-bold'
                            : 'bg-secondary text-secondary-foreground border-border/60'
                        }`}
                      >
                        {s === 'Dashboard_Calculos' && <Sparkles className="w-3 h-3 inline mr-1 text-emerald-600" />}
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions: Health Test & Format / Create Dashboard Tab */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="text-xs gap-1.5"
                  >
                    {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Testar Permissões
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleFormatSpreadsheet}
                    disabled={isFormatting}
                    className="text-xs gap-1.5 border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    {isFormatting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5 text-emerald-600" />}
                    Formatar Folha & Criar Aba Dashboard de Cálculos
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Storage Configuration & AutoSync */}
        {accessToken && spreadsheetInfo && (
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-950 dark:text-indigo-100">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>3. Configuração de Sincronização e Resiliência</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                Dual-Storage + Fila Offline
              </span>
            </div>

            {/* Storage Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => handleStorageModeChange('hybrid')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  storageMode === 'hybrid'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 ring-1 ring-indigo-500'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Modo Híbrido em Tempo Real
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${storageMode === 'hybrid' ? 'border-indigo-600 bg-indigo-600' : 'border-muted-foreground'}`}>
                    {storageMode === 'hybrid' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Grava instantaneamente na app e sincroniza automaticamente cada nova despesa/receita com o Google Sheets em segundo plano.
                </p>
              </div>

              <div 
                onClick={() => handleStorageModeChange('local_only')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  storageMode === 'local_only'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 ring-1 ring-indigo-500'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    Apenas Local / Firebase
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${storageMode === 'local_only' ? 'border-indigo-600 bg-indigo-600' : 'border-muted-foreground'}`}>
                    {storageMode === 'local_only' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Mantém os dados apenas localmente/Firebase, usando o Google Sheets como ponto de backup estático sob demanda.
                </p>
              </div>
            </div>

            {/* Auto-Sync Switch */}
            {storageMode === 'hybrid' && (
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    Sincronização Automática em Tempo Real (Auto-Sync)
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Sincroniza automaticamente a cada registo, edição ou exclusão de movimentos.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoSyncToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    autoSync ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoSync ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Manual Sync Actions */}
            <div className="pt-2 border-t border-border/50 space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Ações Manuais de Exportação / Importação Integral:
              </div>

              {/* Sync Progress Bar */}
              {isSyncing && syncProgress && (
                <div className="p-3 bg-card border border-border rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex justify-between text-xs font-medium text-foreground">
                    <span>{syncProgress.status}</span>
                    <span>{syncProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300" 
                      style={{ width: `${syncProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  onClick={handleExportToSheets} 
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs sm:text-sm font-semibold shadow-xs h-10"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  Exportar / Sincronizar
                </Button>

                <Button 
                  onClick={handleImportFromSheets} 
                  disabled={isSyncing}
                  variant="outline"
                  className="border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 gap-2 text-xs sm:text-sm font-semibold h-10"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                  Puxar do Google Sheets
                </Button>

                <Button 
                  onClick={handleOpenClearModal} 
                  disabled={isSyncing}
                  variant="outline"
                  className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-2 text-xs sm:text-sm font-semibold h-10"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Limpar Registos na Drive
                </Button>
              </div>

              {/* Sync Stats Block */}
              {syncStats && (
                <div className="p-3.5 bg-card border border-border rounded-xl space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between font-semibold text-foreground pb-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Última Sincronização Integral
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {new Date(syncStats.lastSyncedAt).toLocaleString('pt-PT')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="p-2 bg-muted/40 rounded-lg">
                      <span className="text-muted-foreground block">Despesas:</span>
                      <strong className="text-foreground text-sm">{syncStats.expensesCount}</strong>
                    </div>
                    <div className="p-2 bg-muted/40 rounded-lg">
                      <span className="text-muted-foreground block">Receitas:</span>
                      <strong className="text-foreground text-sm">{syncStats.incomesCount}</strong>
                    </div>
                    <div className="p-2 bg-muted/40 rounded-lg">
                      <span className="text-muted-foreground block">Despesas Fixas:</span>
                      <strong className="text-foreground text-sm">{syncStats.fixedExpensesCount}</strong>
                    </div>
                    <div className="p-2 bg-muted/40 rounded-lg">
                      <span className="text-muted-foreground block">Receitas Fixas:</span>
                      <strong className="text-foreground text-sm">{syncStats.fixedIncomesCount}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Income Structure Reorganization (User Requested Command) */}
        {accessToken && spreadsheetInfo && (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-950 dark:text-emerald-100">
                <FolderSync className="w-4 h-4 text-emerald-600" />
                <span>4. Reorganização Estrutural de Receitas</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                Google Sheets & Firebase
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Executa a reestruturação completa pedida para separar receitas pontuais e receitas fixas registadas:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-card border border-border rounded-lg space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> 1. Eliminar
                </div>
                <p className="text-[11px] text-muted-foreground">Remove a folha antiga <code>Receitas</code> do Sheets</p>
              </div>

              <div className="p-2.5 bg-card border border-border rounded-lg space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> 2. Criar Novas Abas
                </div>
                <p className="text-[11px] text-muted-foreground">Cria <code>Receitas_Pontuais</code> e <code>Receitas_Fixas_Registadas</code></p>
              </div>

              <div className="p-2.5 bg-card border border-border rounded-lg space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> 3. Migrar Firebase
                </div>
                <p className="text-[11px] text-muted-foreground">Atualiza e reconcilia documentos na base de dados</p>
              </div>
            </div>

            {reorganizeResult && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Reorganização Concluída com Sucesso!
                </div>
                <p className="text-[11px] text-muted-foreground">
                  • <strong>{reorganizeResult.incomesPunctualMigrated}</strong> receitas pontuais migradas para <code>Receitas_Pontuais</code><br />
                  • <strong>{reorganizeResult.incomesFixedRegisteredMigrated}</strong> receitas fixas registadas migradas para <code>Receitas_Fixas_Registadas</code><br />
                  • Folha antiga <code>Receitas</code> eliminada e Firebase sincronizado.
                </p>
              </div>
            )}

            <div className="pt-1">
              <Button
                onClick={handleReorganizeIncomes}
                disabled={isReorganizing || isSyncing}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white gap-2 text-xs sm:text-sm font-semibold shadow-xs h-10 px-5"
              >
                {isReorganizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> A reorganizar e migrar dados...
                  </>
                ) : (
                  <>
                    <GitFork className="w-4 h-4" /> Reorganizar Receitas no Google Sheets e Firebase
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Sync Audit Log Viewer (Phase 4) */}
        {accessToken && (
          <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <History className="w-4 h-4 text-primary" />
                <span>Histórico & Auditoria de Sincronizações</span>
                <span className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.2 rounded-full font-mono">
                  {auditLogs.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {auditLogs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearSyncAuditLogs();
                      refreshAuditLogs();
                    }}
                    className="text-xs text-muted-foreground hover:text-rose-600 h-7 px-2"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Limpar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-xs h-7 px-2.5"
                >
                  {showLogs ? 'Ocultar' : 'Ver Detalhes'}
                </Button>
              </div>
            </div>

            {showLogs && (
              <div className="space-y-2 pt-2 border-t border-border/50 max-h-64 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    Ainda não existem registos de auditoria gravados.
                  </p>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="p-2.5 bg-card border border-border rounded-lg text-xs flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded uppercase ${
                            log.status === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            log.status === 'queued' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {log.status === 'success' ? 'Sucesso' : log.status === 'queued' ? 'Na Fila' : 'Erro'}
                          </span>
                          <span className="font-semibold text-foreground capitalize">
                            {log.action === 'auto_sync' ? 'Auto-Sync' :
                             log.action === 'export' ? 'Exportação' :
                             log.action === 'import' ? 'Importação' :
                             log.action === 'offline_flushed' ? 'Recuperação Offline' : 'Formatação'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </CardContent>

      {/* Confirmation Modal for Clearing Google Drive Records */}
      <Modal 
        open={showClearModal} 
        onClose={() => setShowClearModal(false)} 
        title="Confirmar Limpeza na Google Drive"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-sm text-foreground">Tem a certeza que deseja esvaziar todos os registos na Google Drive e na Aplicação?</p>
              <p className="text-muted-foreground leading-relaxed">
                Esta ação irá <strong className="text-rose-600 dark:text-rose-400">apagar permanentemente</strong> todas as linhas de dados em todas as abas do seu ficheiro no Google Drive (Despesas, Receitas_Pontuais, Receitas_Fixas_Registadas, Despesas_Fixas, Ativos, Veículos, Metas, etc.), esvaziando também a base de dados e a aplicação para garantir a eliminação definitiva sem ressurreição de dados velhos.
              </p>
              <p className="text-muted-foreground font-medium">
                Esta operação é irreversível.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowClearModal(false)} 
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleConfirmClearSpreadsheetData}
              disabled={isSyncing}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white gap-2 font-semibold"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Sim, Apagar Registos na Drive
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
