import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectGoogleDrive, findOrCreateFinanceSpreadsheet, getCachedDriveToken } from '../lib/googleDriveService';
import { importAllDataFromSheets } from '../lib/googleSheetsDataService';

export function useConnectDrive() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkConnection = () => {
      const token = getCachedDriveToken();
      const hasSpreadsheet = !!localStorage.getItem('google_drive_spreadsheet_info');
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsConnected(!!token && hasSpreadsheet && isOnline);
    };

    checkConnection();

    window.addEventListener('finanas_drive_connected', checkConnection);
    // Also listen to storage to catch deletions from GoogleDriveSyncCard
    window.addEventListener('storage', checkConnection);
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    return () => {
      window.removeEventListener('finanas_drive_connected', checkConnection);
      window.removeEventListener('storage', checkConnection);
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    setToastMsg(null);
    try {
      const res = await connectGoogleDrive();
      if (!res) {
        setIsConnecting(false);
        return;
      }
      
      const info = await findOrCreateFinanceSpreadsheet(res.accessToken);
      localStorage.setItem('google_drive_spreadsheet_info', JSON.stringify(info));
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_connected'));
      }
      
      if (info.createdNow) {
        setToastMsg({ title: 'Drive Conectada!', desc: 'Nova folha criada com sucesso.', type: 'success' });
        setTimeout(() => setToastMsg(null), 3000);
      } else {
        setToastMsg({ title: 'A importar dados...', desc: 'A sincronizar dados da Google Drive.', type: 'info' });
        
        try {
          await importAllDataFromSheets(res.accessToken, info.id, () => {});
          queryClient.invalidateQueries();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('finanas_prefs_updated'));
            window.dispatchEvent(new Event('finanas_data_imported'));
          }
          setToastMsg({ title: 'Sincronização Concluída!', desc: 'Dados importados com sucesso.', type: 'success' });
        } catch (err: any) {
          setToastMsg({ title: 'Erro de Sincronização', desc: err.message, type: 'error' });
        }
        setTimeout(() => setToastMsg(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setToastMsg({ title: 'Erro ao conectar', desc: (err.message || 'Falha na comunicação.'), type: 'error' });
        setTimeout(() => setToastMsg(null), 4000);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleDisconnectDrive = () => {
    setShowDisconnectModal(true);
  };

  const confirmDisconnect = () => {
    localStorage.removeItem('google_drive_access_token');
    localStorage.removeItem('google_drive_spreadsheet_info');
    localStorage.removeItem('google_drive_sync_stats');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('finanas_drive_connected'));
    }
    setToastMsg({ title: 'Drive Desconectada', desc: 'A sincronização foi interrompida.', type: 'info' });
    setTimeout(() => setToastMsg(null), 3000);
    setShowDisconnectModal(false);
  };

  const cancelDisconnect = () => {
    setShowDisconnectModal(false);
  };

  const toggleDriveConnection = () => {
    if (isConnected) {
      handleDisconnectDrive();
    } else {
      handleConnectDrive();
    }
  };

  const handleSyncDriveData = async () => {
    setIsRefreshing(true);
    setToastMsg({ title: 'A ler dados...', desc: 'A importar dados atualizados da Google Drive.', type: 'info' });

    try {
      let token = getCachedDriveToken();
      let infoRaw = localStorage.getItem('google_drive_spreadsheet_info');
      let info = infoRaw ? JSON.parse(infoRaw) : null;

      if (!token || !info?.id) {
        const res = await connectGoogleDrive();
        if (!res) {
          setIsRefreshing(false);
          setToastMsg(null);
          return;
        }
        token = res.accessToken;
        info = await findOrCreateFinanceSpreadsheet(token);
        localStorage.setItem('google_drive_spreadsheet_info', JSON.stringify(info));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('finanas_drive_connected'));
        }
      }

      await importAllDataFromSheets(token, info.id, () => {});
      queryClient.invalidateQueries();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_prefs_updated'));
        window.dispatchEvent(new Event('finanas_data_imported'));
        window.dispatchEvent(new Event('storage'));
      }

      setToastMsg({ title: 'Aplicação Atualizada!', desc: 'Dados lidos com sucesso da Google Drive.', type: 'success' });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar dados da Drive:', err);
      if (err.message?.includes('expirada') || err.message?.includes('Token')) {
        setToastMsg({ title: 'Sessão Expirada', desc: 'Por favor, reconecte a sua conta Google Drive.', type: 'error' });
      } else {
        setToastMsg({ title: 'Erro de Atualização', desc: err.message || 'Falha ao ler dados da Drive.', type: 'error' });
      }
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { 
    isConnecting, 
    isRefreshing,
    isConnected, 
    toastMsg, 
    handleConnectDrive, 
    handleDisconnectDrive, 
    toggleDriveConnection,
    handleSyncDriveData,
    showDisconnectModal,
    confirmDisconnect,
    cancelDisconnect
  };
}
