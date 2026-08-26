import React, { useState } from 'react';
import { Button } from '../ui/button';
import { FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getCachedDriveToken } from '../../lib/googleDriveService';

interface ExcelBackupButtonProps {
  onSuccess?: () => void;
}

export function ExcelBackupButton({ onSuccess }: ExcelBackupButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateExcelBackup = async () => {
    setIsRunning(true);
    setError(null);

    const accessToken = getCachedDriveToken();
    let spreadsheetId = null;
    try {
      const spreadsheetRaw = localStorage.getItem('google_drive_spreadsheet_info');
      if (spreadsheetRaw) {
        spreadsheetId = JSON.parse(spreadsheetRaw).id;
      }
    } catch (e) {}

    // 1. Try to download directly from Google Drive if connected
    if (accessToken && spreadsheetId) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          const timestampStr = new Date().toISOString().split('T')[0];
          a.href = url;
          a.download = `Financas_Pessoais_Drive_Backup_${timestampStr}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          if (onSuccess) onSuccess();
          setIsRunning(false);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2500);
          return;
        } else {
          console.warn('Falha ao exportar da Drive, a tentar geração local...');
        }
      } catch (err) {
        console.warn('Erro ao contactar Drive API, a tentar geração local...', err);
      }
    }

    // 2. Fallback: Generate local copy matching Drive structure exactly
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();

        const getLocal = (key: string) => {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : [];
        };

        // Define exact mappings to match Drive REQUIRED_SHEETS and allHeaders
        const sheetsData: Record<string, any[]> = {
          'Despesas': getLocal('fin_expenses').map(i => [
            i.id, i.date, i.entity || i.description || '', i.category || '', 
            Number(i.amount), i.method || i.paymentMethod || '', i.vehicle || '', 
            i.notes || '', i.fixedExpenseId || ''
          ]),
          'Receitas_Pontuais': getLocal('fin_incomes').map(i => [
            i.id, i.date, i.entity || i.description || '', i.category || '', 
            Number(i.amount), i.method || '', i.notes || ''
          ]),
          'Receitas_Fixas_Registadas': getLocal('fin_incomes_fixed_realized').map(i => [
            i.id, i.date, i.entity || i.description || '', i.category || '', 
            Number(i.amount), i.method || '', i.notes || '', i.fixedIncomeId || ''
          ]),
          'Despesas_Fixas': getLocal('fin_fixed_expenses').map(i => [
            i.id, i.name, i.entity || '', i.category, Number(i.amount), 
            i.day, i.method || '', i.active !== false ? 'Sim' : 'Não', i.vehicle || '', i.notes || ''
          ]),
          'Receitas_Fixas': getLocal('fin_fixed_incomes').map(i => [
            i.id, i.name, i.entity || '', i.category, Number(i.amount), 
            i.day, i.frequency || 'Mensal', i.active !== false ? 'Sim' : 'Não', i.notes || ''
          ]),
          'Contas': getLocal('fin_accounts').map(i => [
            i.id, i.name, i.type, i.iban || '', Number(i.balance), i.active !== false ? 'Sim' : 'Não'
          ]),
          'Patrimonio': getLocal('fin_assets').map(i => [
            i.id, i.name, i.type, Number(i.value), Number(i.purchaseValue || i.value), 
            i.date, i.address || '', i.zipCode || '', i.city || '', i.notes || ''
          ]),
          'Veiculos': getLocal('fin_vehicles').map(i => [
            i.id, i.brand, i.model, i.plate, i.year
          ]),
          'Veiculos_Abastecimentos': getLocal('fin_vehicle_fuel').map(i => [
            i.id, i.vehicleId, i.date, i.liters, i.totalAmount, i.pricePerLiter, 
            i.odometer, i.station || '', i.notes || ''
          ]),
          'Veiculos_Tarefas': getLocal('fin_vehicle_tasks').map(i => [
            i.id, i.vehicleId, i.description, i.type, i.amount, i.status || 'concluido', 
            i.date, i.completionDate || i.date, i.frequency || '', i.nextDate || '', 
            i.nextAmount || '', i.document || '', i.notes || ''
          ]),
          'Orcamentos': getLocal('fin_budgets').map(i => [
            i.id, i.category, i.limit, i.period || 'Mensal'
          ]),
          'Metas': getLocal('fin_goals').map(i => [
            i.id, i.name, i.target, i.current, i.deadline
          ]),
          'Regras_Categorizacao': getLocal('fin_categorization_rules').map(i => [
            i.id, i.keyword, i.category, i.priority
          ]),
          'Arquivo': getLocal('fin_trash').map(i => [
            i.id, i.originalType, i.deletedAt, i.data?.entity || i.data?.name || '', i.data?.amount || 0
          ])
        };

        const headers: Record<string, string[]> = {
          'Despesas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Veículo", "Notas", "ID Fixo"],
          'Receitas_Pontuais': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas"],
          'Receitas_Fixas_Registadas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas", "ID Fixo"],
          'Despesas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas"],
          'Receitas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Frequência", "Ativo", "Notas"],
          'Contas': ["ID", "Nome", "Tipo", "IBAN", "Saldo (€)", "Ativa"],
          'Patrimonio': ["ID", "Nome", "Categoria / SubTipo", "Valor Atual (€)", "Valor Compra (€)", "Data Aquisição", "Rua", "Código Postal", "Localidade", "Notas"],
          'Veiculos': ["ID", "Marca", "Modelo", "Matrícula", "Ano"],
          'Veiculos_Abastecimentos': ["ID", "ID Viatura", "Data", "Litros", "Valor Total (€)", "Preço/L (€)", "Quilometragem (km)", "Posto / Local", "Notas"],
          'Veiculos_Tarefas': ["ID", "ID Viatura", "Título", "Tipo", "Custo (€)", "Estado", "Data Limite", "Data Conclusão", "Periodicidade", "Próx. Data Vencimento", "Próx. Custo (€)", "Documento", "Notas"],
          'Orcamentos': ["ID", "Categoria", "Limite", "Período"],
          'Metas': ["ID", "Nome", "Objetivo", "Atual", "Data Limite"],
          'Regras_Categorizacao': ["ID", "PalavraChave", "Categoria", "Prioridade"],
          'Arquivo': ["ID", "Tipo Original", "Data Eliminação", "Nome/Entidade", "Valor"]
        };

        // Append sheets to workbook
        Object.keys(headers).forEach(sheetName => {
          const data = [headers[sheetName], ...(sheetsData[sheetName] || [])];
          const ws = XLSX.utils.aoa_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const timestampStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Backup_Fiel_Financas_${timestampStr}.xlsx`);

        if (onSuccess) onSuccess();
        setIsRunning(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } catch (err) {
        console.error('Erro ao gerar backup local fiel:', err);
        setError('Erro ao gerar ficheiro Excel.');
        setIsRunning(false);
      }
    }, 800);
  };

  return (
    <Button 
      onClick={handleGenerateExcelBackup} 
      disabled={isRunning}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full"
    >
      {success ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2" /> Backup Excel Concluído
        </>
      ) : (
        <>
          <FileSpreadsheet className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'A gerar cópia fiel...' : 'Cópia Fiel do Excel (Drive)'}
        </>
      )}
    </Button>
  );
}
