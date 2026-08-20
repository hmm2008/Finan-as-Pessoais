import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Upload, Database, CheckCircle2, AlertTriangle, FileJson } from 'lucide-react';
import { BackupPayload } from './types';
import { usePreferences } from '../../contexts';

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete: (message: string) => void;
}

export function RestoreBackupModal({ isOpen, onClose, onRestoreComplete }: RestoreBackupModalProps) {
  const { updatePrefs } = usePreferences();

  const [parsedPayload, setParsedPayload] = useState<BackupPayload | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Selection Checkboxes
  const [selectedEntities, setSelectedEntities] = useState<{
    transactions: boolean;
    budgets: boolean;
    goals: boolean;
    preferences: boolean;
    trash: boolean;
  }>({
    transactions: true,
    budgets: true,
    goals: true,
    preferences: true,
    trash: false
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setParsedPayload(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.entities) {
          setError('Ficheiro de backup inválido (estrutura de entidades em falta).');
          return;
        }
        setParsedPayload(json);
      } catch (err) {
        setError('Erro ao ler o ficheiro JSON. Certifique-se de que é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!parsedPayload) return;

    const { entities } = parsedPayload;
    let restoredCount = 0;

    if (selectedEntities.transactions && entities.transactions) {
      localStorage.setItem('fin_expenses', JSON.stringify(entities.transactions));
      restoredCount += entities.transactions.length;
    }

    if (selectedEntities.budgets && entities.budgets) {
      localStorage.setItem('fin_budgets', JSON.stringify(entities.budgets));
      restoredCount += entities.budgets.length;
    }

    if (selectedEntities.goals && entities.goals) {
      localStorage.setItem('fin_goals', JSON.stringify(entities.goals));
      restoredCount += entities.goals.length;
    }

    if (selectedEntities.preferences && entities.preferences) {
      updatePrefs(entities.preferences);
    }

    if (selectedEntities.trash && entities.trash) {
      localStorage.setItem('finanas_trash_items', JSON.stringify(entities.trash));
    }

    onRestoreComplete(`Restauração concluída com sucesso! (${restoredCount} elementos processados).`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-xl border-border my-6 bg-card">
        <CardHeader className="relative pb-3 border-b border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Restaurar Dados a Partir de Backup
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* File Upload Box */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Selecione o Ficheiro de Backup (.json)</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <Input 
                type="file" 
                accept=".json"
                onChange={handleFileChange}
                className="hidden" 
                id="backupFileInput"
              />
              <label htmlFor="backupFileInput" className="cursor-pointer space-y-2 block">
                <FileJson className="w-10 h-10 text-primary mx-auto opacity-70" />
                <p className="text-sm font-semibold text-foreground">
                  {fileName ? fileName : 'Clique para selecionar ficheiro JSON'}
                </p>
                <p className="text-xs text-muted-foreground">Ficheiros de backup criados pela aplicação</p>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview and Entity Selection */}
          {parsedPayload && (
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase">Pré-visualização do Conteúdo</span>
                <span className="text-[11px] text-muted-foreground">Versão: {parsedPayload.version}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Data do Backup: <strong className="text-foreground">{new Date(parsedPayload.timestamp).toLocaleString('pt-PT')}</strong>
              </p>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs font-semibold">Selecione os Dados a Restaurar:</Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {parsedPayload.entities.transactions && (
                    <label className="flex items-center gap-2 p-2 rounded bg-card border border-border cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedEntities.transactions}
                        onChange={(e) => setSelectedEntities(prev => ({ ...prev, transactions: e.target.checked }))}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span>Movimentos ({parsedPayload.entities.transactions.length})</span>
                    </label>
                  )}

                  {parsedPayload.entities.budgets && (
                    <label className="flex items-center gap-2 p-2 rounded bg-card border border-border cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedEntities.budgets}
                        onChange={(e) => setSelectedEntities(prev => ({ ...prev, budgets: e.target.checked }))}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span>Orçamentos ({parsedPayload.entities.budgets.length})</span>
                    </label>
                  )}

                  {parsedPayload.entities.goals && (
                    <label className="flex items-center gap-2 p-2 rounded bg-card border border-border cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedEntities.goals}
                        onChange={(e) => setSelectedEntities(prev => ({ ...prev, goals: e.target.checked }))}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span>Objetivos ({parsedPayload.entities.goals.length})</span>
                    </label>
                  )}

                  {parsedPayload.entities.preferences && (
                    <label className="flex items-center gap-2 p-2 rounded bg-card border border-border cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedEntities.preferences}
                        onChange={(e) => setSelectedEntities(prev => ({ ...prev, preferences: e.target.checked }))}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span>Preferências & Regras</span>
                    </label>
                  )}

                  {parsedPayload.entities.trash && (
                    <label className="flex items-center gap-2 p-2 rounded bg-card border border-border cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedEntities.trash}
                        onChange={(e) => setSelectedEntities(prev => ({ ...prev, trash: e.target.checked }))}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span>Itens da Lixeira ({parsedPayload.entities.trash.length})</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
              onClick={handleExecuteRestore} 
              disabled={!parsedPayload}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              <Database className="w-4 h-4 mr-1.5" /> Executar Restauração
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
