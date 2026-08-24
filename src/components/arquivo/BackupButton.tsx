import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Database, Download, CheckCircle2 } from 'lucide-react';
import { DocumentItem, BackupPayload } from './types';
import { usePreferences } from '../../contexts';

interface BackupButtonProps {
  onBackupCreated?: (doc: DocumentItem) => void;
}

export function BackupButton({ onBackupCreated }: BackupButtonProps) {
  const { prefs } = usePreferences();
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerateBackup = () => {
    setIsBackupRunning(true);

    setTimeout(() => {
      // Gather data from localStorage / app state
      const savedExpenses = localStorage.getItem('fin_expenses');
      const savedIncomes = localStorage.getItem('fin_incomes');
      const savedOrcamentos = localStorage.getItem('fin_budgets');
      const savedObjetivos = localStorage.getItem('fin_goals');
      const savedTrash = localStorage.getItem('finanas_trash_items');

      const payload: BackupPayload = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        entities: {
          transactions: savedExpenses ? JSON.parse(savedExpenses) : [],
          budgets: savedOrcamentos ? JSON.parse(savedOrcamentos) : [],
          goals: savedObjetivos ? JSON.parse(savedObjetivos) : [],
          preferences: prefs,
          trash: savedTrash ? JSON.parse(savedTrash) : []
        }
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestampStr = new Date().toISOString().split('T')[0];
      const fileName = `Backup_Financas_${timestampStr}.json`;

      // Trigger browser download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();

      // Create DocumentItem entry for Arquivo grid
      const newDoc: DocumentItem = {
        id: `doc_backup_${Date.now()}`,
        name: fileName,
        type: 'backup',
        source: 'backup',
        sourceLabel: 'Backup de Sistema',
        url: url,
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        createdAt: timestampStr,
        dataPayload: payload
      };

      onBackupCreated(newDoc);
      setIsBackupRunning(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }, 600);
  };

  return (
    <Button 
      onClick={handleGenerateBackup} 
      disabled={isBackupRunning}
      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
    >
      {success ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-1.5 text-white" /> Backup Concluído
        </>
      ) : (
        <>
          <Database className={`w-4 h-4 mr-1.5 ${isBackupRunning ? 'animate-spin' : ''}`} />
          {isBackupRunning ? 'Gerando Backup...' : 'Criar Backup JSON'}
        </>
      )}
    </Button>
  );
}
