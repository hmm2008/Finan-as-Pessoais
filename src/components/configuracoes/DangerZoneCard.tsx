import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { wipeAllLocalAndFirestoreData, clearAllSpreadsheetData } from '../../lib/googleSheetsDataService';
import { getCachedDriveToken } from '../../lib/googleDriveService';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../../contexts/NotificationContext';

export function DangerZoneCard() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const handleConfirmWipe = async () => {
    setIsWiping(true);
    setShowModal(false);

    try {
      const activeToken = getCachedDriveToken();
      let spreadsheetId = null;
      try {
        const spreadsheetRaw = localStorage.getItem('google_drive_spreadsheet_info');
        if (spreadsheetRaw) {
          spreadsheetId = JSON.parse(spreadsheetRaw).id;
        }
      } catch (e) {}

      if (activeToken && spreadsheetId) {
        // This function will also call wipeAllLocalAndFirestoreData inside it
        await clearAllSpreadsheetData(activeToken, spreadsheetId);
      } else {
        // Drive not connected, just wipe local and firestore
        await wipeAllLocalAndFirestoreData();
      }

      queryClient.invalidateQueries();
      window.dispatchEvent(new Event('storage'));
      addNotification('Sucesso', 'Todos os registos da sua conta (Aplicação) foram eliminados definitivamente.', 'success');
    } catch (e: any) {
      console.error('Erro no Danger Zone Wipe:', e);
      addNotification('Erro', 'Ocorreu um erro ao tentar eliminar alguns dados: ' + (e.message || e), 'error');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <>
      <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm rounded-xl">
        <CardHeader className="border-b border-rose-200/50 dark:border-rose-900/50 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <CardTitle className="text-lg text-rose-700 dark:text-rose-400">Zona de Perigo</CardTitle>
              <CardDescription className="text-rose-600/80 dark:text-rose-400/80">
                Ações irreversíveis que eliminam dados permanentes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-[70%]">
              <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Apagar Todos os Dados da Aplicação</h4>
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70 leading-relaxed">
                Esta ação vai eliminar permanentemente todos os registos (despesas, receitas, contas, metas, etc.) da <strong>Google Drive (Firestore)</strong>, do seu dispositivo local e também da sua <strong>folha do Google Drive</strong>, caso esteja ligada.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowModal(true)}
              disabled={isWiping}
              className="w-full sm:w-auto shrink-0 bg-rose-600 hover:bg-rose-700 font-semibold text-xs h-9"
            >
              {isWiping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Apagar Tudo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
        title="Apagar Todos os Dados Definitivamente"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="text-sm space-y-2">
              <p className="font-bold text-foreground">Tem a certeza absoluta?</p>
              <p className="text-muted-foreground leading-relaxed">
                Esta ação é <strong className="text-rose-600 dark:text-rose-400">100% irreversível</strong>. Todos os seus dados serão apagados instantaneamente de:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-1">
                <li>Armazenamento na Cloud</li>
                <li>Armazenamento do Dispositivo (Cache Local)</li>
                <li>Ficheiro Finanças Pessoais no Google Drive (se associado)</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-border mt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)} 
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmWipe}
              disabled={isWiping}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 font-semibold"
            >
              {isWiping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Sim, Apagar Todos os Dados
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
