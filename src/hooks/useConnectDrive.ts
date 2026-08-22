import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectGoogleDrive, findOrCreateFinanceSpreadsheet } from '../lib/googleDriveService';
import { importAllDataFromSheets } from '../lib/googleSheetsDataService';

export function useConnectDrive() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);
  const queryClient = useQueryClient();

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

  return { isConnecting, toastMsg, handleConnectDrive };
}
