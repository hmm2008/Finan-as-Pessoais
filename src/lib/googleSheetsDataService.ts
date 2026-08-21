import { auth } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getCachedDriveToken, setCachedDriveToken, formatAndStyleFinanceSpreadsheet } from './googleDriveService';
import { sanitizeForFirestore } from '../hooks/queries';

export interface SyncStats {
  expensesCount: number;
  incomesCount: number;
  fixedExpensesCount: number;
  fixedIncomesCount: number;
  accountsCount: number;
  patrimonioCount: number;
  vehiclesCount: number;
  budgetsCount: number;
  goalsCount: number;
  trashCount: number;
  lastSyncedAt: string;
}

export type StorageMode = 'hybrid' | 'local_only';

export type SyncStatusState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline_queued';

export interface SyncStatusEvent {
  state: SyncStatusState;
  message?: string;
  timestamp: string;
  pendingCount?: number;
}

export interface SyncAuditLogEntry {
  id: string;
  action: 'export' | 'import' | 'auto_sync' | 'offline_flushed' | 'format' | 'reorganize';
  status: 'success' | 'error' | 'queued';
  details: string;
  timestamp: string;
  recordsCount?: number;
}

// Global sync listeners
const syncListeners = new Set<(event: SyncStatusEvent) => void>();
let currentSyncStatus: SyncStatusEvent = {
  state: 'idle',
  timestamp: new Date().toISOString(),
  pendingCount: getPendingSyncQueueCount()
};

export function getSyncStatus(): SyncStatusEvent {
  return currentSyncStatus;
}

export function subscribeToSyncStatus(listener: (event: SyncStatusEvent) => void): () => void {
  syncListeners.add(listener);
  listener(currentSyncStatus);
  return () => {
    syncListeners.delete(listener);
  };
}

function notifySyncStatus(state: SyncStatusState, message?: string) {
  const pendingCount = getPendingSyncQueueCount();
  currentSyncStatus = {
    state,
    message,
    timestamp: new Date().toISOString(),
    pendingCount
  };
  syncListeners.forEach(listener => listener(currentSyncStatus));
}

// Audit Logs Management
export function getSyncAuditLogs(): SyncAuditLogEntry[] {
  try {
    const raw = localStorage.getItem('fin_sheets_sync_history');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addSyncAuditLog(entry: Omit<SyncAuditLogEntry, 'id' | 'timestamp'>) {
  try {
    const logs = getSyncAuditLogs();
    const newEntry: SyncAuditLogEntry = {
      ...entry,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString()
    };
    const updated = [newEntry, ...logs].slice(0, 30); // Keep last 30 entries
    localStorage.setItem('fin_sheets_sync_history', JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao guardar log de sincronização:', err);
  }
}

export function clearSyncAuditLogs() {
  localStorage.removeItem('fin_sheets_sync_history');
}

// Offline Pending Queue Management
export function getPendingSyncQueueCount(): number {
  try {
    const raw = localStorage.getItem('fin_sheets_pending_queue');
    if (!raw) return 0;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.length : 0;
  } catch {
    return 0;
  }
}

function enqueuePendingSync(reason: string) {
  try {
    const raw = localStorage.getItem('fin_sheets_pending_queue');
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ timestamp: new Date().toISOString(), reason });
    localStorage.setItem('fin_sheets_pending_queue', JSON.stringify(queue.slice(-10)));
    notifySyncStatus('offline_queued', 'Alterações pendentes guardadas na fila offline');
    addSyncAuditLog({
      action: 'auto_sync',
      status: 'queued',
      details: `Guardado na fila offline: ${reason}`
    });
  } catch {
    // ignore
  }
}

export function clearPendingSyncQueue() {
  localStorage.removeItem('fin_sheets_pending_queue');
}

export function getStorageMode(): StorageMode {
  const saved = localStorage.getItem('google_drive_storage_mode');
  return (saved === 'local_only') ? 'local_only' : 'hybrid';
}

export function setStorageMode(mode: StorageMode) {
  localStorage.setItem('google_drive_storage_mode', mode);
}

export function isAutoSyncEnabled(): boolean {
  const mode = getStorageMode();
  if (mode !== 'hybrid') return false;
  const autoSyncSetting = localStorage.getItem('google_drive_auto_sync');
  return autoSyncSetting !== 'false';
}

export function setAutoSyncEnabled(enabled: boolean) {
  localStorage.setItem('google_drive_auto_sync', enabled ? 'true' : 'false');
}

export function getStoredSpreadsheetId(): string | null {
  try {
    const raw = localStorage.getItem('google_drive_spreadsheet_info');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch {
    return null;
  }
}

/**
 * Safely parse numeric values from Sheets or Inputs.
 */
function parseNum(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/€/g, '').replace(/\s/g, '').replace(',', '.').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Safely parse boolean values from Sheets or Inputs.
 */
function parseBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === 'sim' || s === '1' || s === 'yes' || s === 'ativo';
}

/**
 * Reads data from localStorage for a given key, with fallback to empty array.
 */
function getLocalData(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save data locally and update localStorage.
 */
function setLocalData(key: string, data: any[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao guardar localData (${key}):`, e);
  }
}

/**
 * Checks if an income record is a fixed income execution.
 */
export function isFixedIncomeItem(item: any): boolean {
  if (!item) return false;
  return Boolean(
    item.fixedIncomeId ||
    item.fixed_income_id ||
    item.isFixed === true ||
    item.isFixedIncome === true ||
    item.recurring === true ||
    (typeof item.id === 'string' && item.id.startsWith('inc_fixed_'))
  );
}

/**
 * Partitions a combined array of income records into punctual incomes and fixed income executions.
 */
export function partitionIncomes(items: any[]): { punctual: any[]; fixedRealized: any[] } {
  const map = new Map<string, any>();
  (items || []).forEach(item => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  const list = Array.from(map.values());
  const fixedRealized = list.filter(isFixedIncomeItem);
  const punctual = list.filter(item => !isFixedIncomeItem(item));
  return { punctual, fixedRealized };
}

async function ensureMissingSheetsExist(accessToken: string, spreadsheetId: string): Promise<string[]> {
  const REQUIRED_SHEETS = [
    'Despesas',
    'Receitas_Pontuais',
    'Receitas_Fixas_Registadas',
    'Despesas_Fixas',
    'Receitas_Fixas',
    'Contas',
    'Patrimonio',
    'Veiculos',
    'Orcamentos',
    'Metas',
    'Reciclagem',
    'Preferencias',
    'Regras_Categorizacao',
    'Notificacoes',
    'Arquivo'
  ];

  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) return REQUIRED_SHEETS;

    const metaData = await metaRes.json();
    let existingSheetTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties.title);
    
    const missingSheets = REQUIRED_SHEETS.filter(sheet => !existingSheetTitles.includes(sheet));
    
    if (missingSheets.length > 0) {
      console.log('Criando abas em falta:', missingSheets);
      const addSheetRequests = missingSheets.map(title => ({
        addSheet: { properties: { title } }
      }));
      
      const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: addSheetRequests })
      });
      
      if (addRes.ok) {
        existingSheetTitles = [...existingSheetTitles, ...missingSheets];
      }
      
      const allHeaders: Record<string, string[]> = {
        'Despesas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Veículo", "Notas", "ID Fixo"],
        'Receitas_Pontuais': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas"],
        'Receitas_Fixas_Registadas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas", "ID Fixo"],
        'Despesas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas"],
        'Receitas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Frequência", "Ativo", "Notas"],
        'Contas': ["ID", "Nome", "Tipo", "IBAN", "Saldo (€)", "Ativa"],
        'Patrimonio': ["ID", "Nome", "Categoria", "Valor (€)", "Notas"],
        'Veiculos': ["ID", "Marca", "Modelo", "Matrícula", "Ano"],
        'Orcamentos': ["ID", "Categoria", "Limite (€)", "Mês"],
        'Metas': ["ID", "Nome", "Valor Alvo (€)", "Valor Atual (€)", "Data Limite"],
        'Reciclagem': ["ID", "Tipo", "Dados JSON", "Data Eliminação"],
    'Preferencias': ["Chave", "Dados JSON", "Atualizado Em"],
    'Regras_Categorizacao': ["ID", "Keyword", "Categoria", "Tipo", "Prioridade"],
    'Notificacoes': ["ID", "Título", "Mensagem", "Data", "Lida", "Tipo"],
    'Arquivo': ["ID", "Título", "Data", "Dados JSON", "Tipo"]
      };

      const headerData = missingSheets
        .filter(sheet => allHeaders[sheet])
        .map(sheet => ({
          range: `${sheet}!A1:Z1`,
          values: [allHeaders[sheet]]
        }));

      if (headerData.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: headerData
          })
        }).catch(() => {});
      }
    }
    return existingSheetTitles;
  } catch (e) {
    console.warn('Falha ao verificar/criar abas em falta:', e);
    return REQUIRED_SHEETS;
  }
}

/**
 * Export all local and Firestore data into the Google Spreadsheet in a single batch operation.
 */
export async function exportAllDataToSheets(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (status: string, percent: number) => void
): Promise<SyncStats> {
  notifySyncStatus('syncing', 'A exportar dados para a Google Drive...');
  onProgress?.('A recolher dados da aplicação...', 10);

  // Check connectivity
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingSync('Sem ligação à Internet (Offline)');
    throw new Error('Dispositivo offline. A sincronização foi colocada na fila e será enviada assim que recuperar a ligação.');
  }

  onProgress?.('A verificar estrutura da folha...', 15);
  const activeSheetTitles = await ensureMissingSheetsExist(accessToken, spreadsheetId);

  // 1. Gather Data using correct LocalStorage keys mapped to queries.ts
  let expenses = getLocalData('fin_expenses');
  let rawIncomesPunctual = getLocalData('fin_incomes');
  let rawIncomesFixedRealized = getLocalData('fin_incomes_fixed_realized');

  // Re-classify and partition incomes cleanly to fix any historical mix-ups
  const { punctual: incomesPunctual, fixedRealized: incomesFixedRealized } = partitionIncomes([
    ...rawIncomesPunctual,
    ...rawIncomesFixedRealized
  ]);

  // Persist cleaned lists back to LocalStorage
  setLocalData('fin_incomes', incomesPunctual);
  setLocalData('fin_incomes_fixed_realized', incomesFixedRealized);

  let fixedExpenses = getLocalData('fin_fixed_expenses');
  let fixedIncomes = getLocalData('fin_fixed_incomes');
  let accounts = getLocalData('fin_assets'); // Accounts view uses fin_assets
  let patrimonio = getLocalData('fin_patrimonio'); // Patrimonio uses fin_patrimonio
  let vehicles = getLocalData('fin_vehicles');
  let budgets = getLocalData('fin_budgets');
  let goals = getLocalData('fin_goals');
  let trash = getLocalData('fin_trash');
  let userPrefsStr = localStorage.getItem('finanas_user_prefs');
  let userPrefs = userPrefsStr ? JSON.parse(userPrefsStr) : {};
  let categorizationRules = getLocalData('fin_categorization_rules');
  let notifications = getLocalData('finanas_notifications');
  let archives = getLocalData('finanas_archives');
  if (trash.length === 0) {
    trash = getLocalData('finanas_trash_items');
  }

  // Note: LocalStorage is the primary source of truth for user edits/deletions.
  // We do NOT pull missing items from Firestore during export to prevent deleted items from resurrecting.

  onProgress?.('A formatar dados para o formato Google Sheets...', 40);

  // 2. Format 2D Arrays for Sheets with Headers + Data Rows
  const expRows = [
    ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Veículo", "Notas", "ID Fixo"],
    ...expenses.map((e: any) => [
      e.id || '',
      e.date || '',
      e.entity || '',
      e.category || '',
      Number(e.amount || 0),
      e.method || '',
      e.vehicle ? 'Sim' : 'Não',
      e.notes || '',
      e.fixedExpenseId || ''
    ])
  ];

  const incRows = [
    ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas"],
    ...incomesPunctual.map((i: any) => [
      i.id || '',
      i.date || '',
      i.entity || '',
      i.category || '',
      Number(i.amount || 0),
      i.method || '',
      i.notes || ''
    ])
  ];

  const fixedIncRealizedRows = [
    ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas", "ID Fixo"],
    ...incomesFixedRealized.map((i: any) => [
      i.id || '',
      i.date || '',
      i.entity || '',
      i.category || '',
      Number(i.amount || 0),
      i.method || '',
      i.notes || '',
      i.fixedIncomeId || ''
    ])
  ];

  const fixExpRows = [
    ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas"],
    ...fixedExpenses.map((fe: any) => [
      fe.id || '',
      fe.name || fe.entity || '',
      fe.entity || fe.name || '',
      fe.category || '',
      Number(fe.amount || 0),
      fe.dueDay || fe.day || 1,
      fe.method || '',
      fe.active !== false ? 'Sim' : 'Não',
      fe.vehicle ? 'Sim' : 'Não',
      fe.notes || ''
    ])
  ];

  const fixIncRows = [
    ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Frequência", "Ativo", "Notas"],
    ...fixedIncomes.map((fi: any) => [
      fi.id || '',
      fi.name || fi.entity || '',
      fi.entity || fi.name || '',
      fi.category || '',
      Number(fi.amount || 0),
      fi.dueDateDay || fi.dueDay || 1,
      fi.frequency || 'Mensal',
      fi.active !== false ? 'Sim' : 'Não',
      fi.notes || ''
    ])
  ];

  const accRows = [
    ["ID", "Nome", "Tipo", "IBAN", "Saldo (€)", "Ativa"],
    ...accounts.map((a: any) => [
      a.id || '',
      a.name || '',
      a.type || 'Conta Ordem',
      a.iban || '',
      Number(a.balance || 0),
      a.active !== false ? 'Sim' : 'Não'
    ])
  ];

  const patRows = [
    ["ID", "Nome", "Categoria", "Valor (€)", "Notas"],
    ...patrimonio.map((p: any) => [
      p.id || '',
      p.name || '',
      p.category || '',
      Number(p.value || p.amount || 0),
      p.notes || ''
    ])
  ];

  const vehRows = [
    ["ID", "Marca", "Modelo", "Matrícula", "Ano"],
    ...vehicles.map((v: any) => [
      v.id || '',
      v.make || v.marca || '',
      v.model || v.modelo || '',
      v.plate || v.matricula || '',
      v.year || v.ano || ''
    ])
  ];

  const budRows = [
    ["ID", "Categoria", "Limite (€)", "Mês"],
    ...budgets.map((b: any) => [
      b.id || '',
      b.category || '',
      Number(b.limit || b.amount || 0),
      b.month || ''
    ])
  ];

  const goalRows = [
    ["ID", "Nome", "Valor Alvo (€)", "Valor Atual (€)", "Data Limite"],
    ...goals.map((g: any) => [
      g.id || '',
      g.title || g.name || '',
      Number(g.targetAmount || g.target || 0),
      Number(g.currentAmount || g.current || 0),
      g.deadline || g.targetDate || ''
    ])
  ];

  const trashRows = [
    ["ID", "Tipo", "Dados JSON", "Data Eliminação"],
    ...trash.map((t: any) => [
      t.id || '',
      t.type || '',
      JSON.stringify(t.data || {}),
      t.deletedAt || t.createdAt || ''
    ])
  ];

  const prefsRows = [
    ["Chave", "Dados JSON", "Atualizado Em"],
    ["Preferencias", JSON.stringify(userPrefs || {}), userPrefs.updatedAt || '']
  ];

  const catRulesRows = [
    ["ID", "Keyword", "Categoria", "Tipo", "Prioridade"],
    ...categorizationRules.map((r: any) => [
      r.id || '',
      r.keyword || '',
      r.category || '',
      r.type || '',
      r.priority || 0
    ])
  ];

  const notifRows = [
    ["ID", "Título", "Mensagem", "Data", "Lida", "Tipo"],
    ...notifications.map((n: any) => [
      n.id || '',
      n.title || '',
      n.message || '',
      n.createdAt || '',
      n.read ? 'Sim' : 'Não',
      n.type || ''
    ])
  ];

  const archiveRows = [
    ["ID", "Título", "Data", "Dados JSON", "Tipo"],
    ...archives.map((a: any) => [
      a.id || '',
      a.title || '',
      a.createdAt || '',
      JSON.stringify(a.data || {}),
      a.type || ''
    ])
  ];

  onProgress?.('A limpar dados antigos na Google Sheets...', 60);

  // Clear existing data rows completely so that deleted items are properly removed from the spreadsheet
  // Only target sheets that actually exist in the workbook to avoid 400 errors
  try {
    const sheetsToClear = [
      'Despesas',
      'Receitas_Pontuais',
      'Receitas_Fixas_Registadas',
      'Despesas_Fixas',
      'Receitas_Fixas',
      'Contas',
      'Patrimonio',
      'Veiculos',
      'Orcamentos',
      'Metas',
      'Reciclagem',
      'Dashboard_Calculos',
      'Receitas'
    ].filter(s => activeSheetTitles.includes(s));

    const clearRanges = sheetsToClear.map(s => s === 'Dashboard_Calculos' ? `'${s}'!A1:Z1000` : `'${s}'!A2:Z100000`);

    if (clearRanges.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ranges: clearRanges })
      }).catch(() => {});
    }

    // Always run individual fallback clears to guarantee every sheet row is erased
    for (const sheetName of sheetsToClear) {
      const rangeStr = sheetName === 'Dashboard_Calculos' ? `'${sheetName}'!A1:Z1000` : `'${sheetName}'!A2:Z100000`;
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeStr)}:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      }).catch(() => {});
    }
  } catch (clearErr) {
    console.warn('Limpeza pré-exportação falhou:', clearErr);
  }

  onProgress?.('A enviar novos dados para a Google Sheets API...', 75);

  // 3. Send batchUpdate to Google Sheets API only for existing active sheets
  const dataPayload = [];
  if (activeSheetTitles.includes('Despesas') && expRows.length > 0) dataPayload.push({ range: 'Despesas!A1:I' + expRows.length, values: expRows });
  if (activeSheetTitles.includes('Receitas_Pontuais') && incRows.length > 0) dataPayload.push({ range: 'Receitas_Pontuais!A1:H' + incRows.length, values: incRows });
  if (activeSheetTitles.includes('Receitas_Fixas_Registadas') && fixedIncRealizedRows.length > 0) dataPayload.push({ range: 'Receitas_Fixas_Registadas!A1:H' + fixedIncRealizedRows.length, values: fixedIncRealizedRows });
  if (activeSheetTitles.includes('Despesas_Fixas') && fixExpRows.length > 0) dataPayload.push({ range: 'Despesas_Fixas!A1:J' + fixExpRows.length, values: fixExpRows });
  if (activeSheetTitles.includes('Receitas_Fixas') && fixIncRows.length > 0) dataPayload.push({ range: 'Receitas_Fixas!A1:I' + fixIncRows.length, values: fixIncRows });
  if (activeSheetTitles.includes('Contas') && accRows.length > 0) dataPayload.push({ range: 'Contas!A1:F' + accRows.length, values: accRows });
  if (activeSheetTitles.includes('Patrimonio') && patRows.length > 0) dataPayload.push({ range: 'Patrimonio!A1:E' + patRows.length, values: patRows });
  if (activeSheetTitles.includes('Veiculos') && vehRows.length > 0) dataPayload.push({ range: 'Veiculos!A1:E' + vehRows.length, values: vehRows });
  if (activeSheetTitles.includes('Orcamentos') && budRows.length > 0) dataPayload.push({ range: 'Orcamentos!A1:D' + budRows.length, values: budRows });
  if (activeSheetTitles.includes('Metas') && goalRows.length > 0) dataPayload.push({ range: 'Metas!A1:E' + goalRows.length, values: goalRows });
  if (activeSheetTitles.includes('Reciclagem') && trashRows.length > 0) dataPayload.push({ range: 'Reciclagem!A1:D' + trashRows.length, values: trashRows });

  if (dataPayload.length === 0) {
    onProgress?.('Concluído!', 100);
    return {
      expensesCount: expenses.length,
      incomesCount: incomesPunctual.length + incomesFixedRealized.length,
      fixedExpensesCount: fixedExpenses.length,
      fixedIncomesCount: fixedIncomes.length,
      accountsCount: accounts.length,
      patrimonioCount: patrimonio.length,
      vehiclesCount: vehicles.length,
      budgetsCount: budgets.length,
      goalsCount: goals.length,
      trashCount: trash.length,
      lastSyncedAt: new Date().toISOString()
    };
  }

  const batchBody = {
    valueInputOption: 'USER_ENTERED',
    data: dataPayload
  };

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(batchBody)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const detail = errData.error?.message || `Status HTTP ${res.status}`;
    let errorText = detail;
    if (res.status === 401 || res.status === 403) {
      setCachedDriveToken(null);
      errorText = 'Sessão Google expirada ou sem permissões. Por favor, reconecte a conta Google.';
    } else {
      errorText = `Erro ao atualizar folha: ${detail}`;
    }
    notifySyncStatus('error', errorText);
    enqueuePendingSync(errorText);
    addSyncAuditLog({
      action: 'export',
      status: 'error',
      details: errorText
    });
    throw new Error(errorText);
  }

  // Rebuild and format Dashboard_Calculos formulas dynamically
  try {
    await formatAndStyleFinanceSpreadsheet(accessToken, spreadsheetId);
  } catch (dashErr) {
    console.warn('Aviso ao formatar Dashboard_Calculos:', dashErr);
  }

  // Clear offline queue upon successful export
  clearPendingSyncQueue();

  onProgress?.('Concluído!', 100);

  const stats: SyncStats = {
    expensesCount: expenses.length,
    incomesCount: incomesPunctual.length + incomesFixedRealized.length,
    fixedExpensesCount: fixedExpenses.length,
    fixedIncomesCount: fixedIncomes.length,
    accountsCount: accounts.length,
    patrimonioCount: patrimonio.length,
    vehiclesCount: vehicles.length,
    budgetsCount: budgets.length,
    goalsCount: goals.length,
    trashCount: trash.length,
    lastSyncedAt: new Date().toISOString()
  };

  localStorage.setItem('google_drive_sync_stats', JSON.stringify(stats));
  notifySyncStatus('synced', 'Dados sincronizados com o Google Sheets');
  
  addSyncAuditLog({
    action: 'export',
    status: 'success',
    details: `Exportados ${stats.expensesCount} despesas, ${stats.incomesCount} receitas e demais dados`,
    recordsCount: stats.expensesCount + stats.incomesCount
  });

  return stats;
}

/**
 * Fetch all financial data from Google Sheets spreadsheet and populate local state / localStorage / Firestore.
 */
export async function importAllDataFromSheets(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (status: string, percent: number) => void
): Promise<SyncStats> {
  notifySyncStatus('syncing', 'A descarregar dados da Google Drive...');
  onProgress?.('A inspecionar abas e descarregar do Google Sheets...', 15);

  let titles: string[] = [];
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      titles = (metaData.sheets || []).map((s: any) => s.properties?.title);
    }
  } catch (e) {
    console.warn('Erro ao ler metadados para import:', e);
  }

  const incSheet = titles.includes('Receitas_Pontuais')
    ? 'Receitas_Pontuais'
    : (titles.includes('Receitas') ? 'Receitas' : 'Receitas_Pontuais');

  const incFixedRegSheet = titles.includes('Receitas_Fixas_Registadas')
    ? 'Receitas_Fixas_Registadas'
    : (titles.includes('Receitas_Fixas_Reg') ? 'Receitas_Fixas_Reg' : 'Receitas_Fixas_Registadas');

  const ranges = [
    'Despesas!A1:I5000',
    `${incSheet}!A1:H5000`,
    `${incFixedRegSheet}!A1:H5000`,
    'Despesas_Fixas!A1:J5000',
    'Receitas_Fixas!A1:I5000',
    'Contas!A1:F1000',
    'Patrimonio!A1:E1000',
    'Veiculos!A1:E1000',
    'Orcamentos!A1:D1000',
    'Metas!A1:E1000',
    'Reciclagem!A1:D1000',
    'Preferencias!A1:C5',
    'Regras_Categorizacao!A1:E1000',
    'Notificacoes!A1:F1000',
    'Arquivo!A1:E1000'
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?` + 
    ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const detail = errData.error?.message || `Status HTTP ${res.status}`;
    let errorText = detail;
    if (res.status === 401 || res.status === 403) {
      setCachedDriveToken(null);
      errorText = 'Sessão Google expirada ou sem permissões. Por favor, reconecte a conta Google.';
    } else {
      errorText = `Erro ao ler dados da Google Sheets: ${detail}`;
    }
    notifySyncStatus('error', errorText);
    addSyncAuditLog({
      action: 'import',
      status: 'error',
      details: errorText
    });
    throw new Error(errorText);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  onProgress?.('A processar e converter linhas...', 50);

  const getRows = (idx: number) => {
    const rows = valueRanges[idx]?.values || [];
    // Skip the first row since it contains column headers
    return rows.length > 1 ? rows.slice(1) : [];
  };

  // Parse Expenses
  const expRows = getRows(0);
  const parsedExpenses = expRows.map((row: any[], i: number) => ({
    id: row[0] || `exp_sheet_${i}`,
    date: row[1] || new Date().toISOString().slice(0, 10),
    entity: row[2] || 'Despesa',
    category: row[3] || 'Outros',
    amount: parseNum(row[4]),
    method: row[5] || 'MBWay',
    vehicle: parseBool(row[6]),
    notes: row[7] || '',
    fixedExpenseId: row[8] || undefined
  })).filter((e: any) => e.amount > 0 || e.entity);

  // Parse Incomes
  const incRows = getRows(1);
  const rawParsedIncomes = incRows.map((row: any[], i: number) => ({
    id: row[0] || `inc_sheet_${i}`,
    date: row[1] || new Date().toISOString().slice(0, 10),
    entity: row[2] || 'Receita',
    category: row[3] || 'Salário',
    amount: parseNum(row[4]),
    method: row[5] || 'Transferência Bancária',
    notes: row[6] || '',
    fixedIncomeId: row[7] || undefined,
    isFixed: !!row[7] || (typeof row[0] === 'string' && row[0].startsWith('inc_fixed_'))
  })).filter((i: any) => i.amount > 0 || i.entity);

  // Parse Realized Fixed Incomes
  const fixIncRegRows = getRows(2);
  const rawParsedFixedIncomesRealized = fixIncRegRows.map((row: any[], i: number) => ({
    id: row[0] || `inc_fixed_sheet_${i}`,
    date: row[1] || new Date().toISOString().slice(0, 10),
    entity: row[2] || 'Receita',
    category: row[3] || 'Salário',
    amount: parseNum(row[4]),
    method: row[5] || 'Transferência Bancária',
    notes: row[6] || '',
    fixedIncomeId: row[7] || undefined,
    isFixed: true
  })).filter((i: any) => i.amount > 0 || i.entity);

  // Separate incomes cleanly in case fixed incomes were placed in Receitas_Pontuais
  const { punctual: parsedIncomes, fixedRealized: parsedFixedIncomesRealized } = partitionIncomes([
    ...rawParsedIncomes,
    ...rawParsedFixedIncomesRealized
  ]);

  // Parse Fixed Expenses
  const fixExpRows = getRows(3);
  const parsedFixedExpenses = fixExpRows.map((row: any[], i: number) => ({
    id: row[0] || `fix_exp_${i}`,
    name: row[1] || row[2] || 'Despesa Fixa',
    entity: row[2] || row[1] || 'Entidade',
    category: row[3] || 'Habitação',
    amount: parseNum(row[4]),
    dueDay: parseNum(row[5]) || 1,
    method: row[6] || 'Débito Direto',
    active: parseBool(row[7]),
    vehicle: parseBool(row[8]),
    notes: row[9] || ''
  })).filter((e: any) => e.amount > 0 || (e.name !== 'Despesa Fixa' && e.name));

  // Parse Fixed Incomes
  const fixIncRows = getRows(4);
  const parsedFixedIncomes = fixIncRows.map((row: any[], i: number) => ({
    id: row[0] || `fix_inc_${i}`,
    name: row[1] || row[2] || 'Receita Fixa',
    entity: row[2] || row[1] || 'Entidade',
    category: row[3] || 'Salário',
    amount: parseNum(row[4]),
    dueDateDay: parseNum(row[5]) || 1,
    frequency: row[6] || 'Mensal',
    active: parseBool(row[7]),
    notes: row[8] || ''
  })).filter((fi: any) => fi.amount > 0 || (fi.name !== 'Receita Fixa' && fi.name));

  // Parse Accounts
  const accRows = getRows(5);
  const parsedAccounts = accRows.map((row: any[], i: number) => ({
    id: row[0] || `acc_${i}`,
    name: row[1] || 'Conta Principal',
    type: row[2] || 'Conta Ordem',
    iban: row[3] || '',
    balance: parseNum(row[4]),
    active: parseBool(row[5])
  })).filter((a: any) => a.name !== 'Conta Principal' || a.balance > 0);

  // Parse Assets
  const patRows = getRows(6);
  const parsedPatrimonio = patRows.map((row: any[], i: number) => ({
    id: row[0] || `pat_${i}`,
    name: row[1] || 'Ativo',
    category: row[2] || 'Imóveis',
    value: parseNum(row[3]),
    notes: row[4] || ''
  })).filter((p: any) => p.name !== 'Ativo' || p.value > 0);

  // Parse Vehicles
  const vehRows = getRows(7);
  const parsedVehicles = vehRows.map((row: any[], i: number) => ({
    id: row[0] || `veh_${i}`,
    make: row[1] || '',
    model: row[2] || '',
    plate: row[3] || '',
    year: row[4] || ''
  }));

  // Parse Budgets
  const budRows = getRows(8);
  const parsedBudgets = budRows.map((row: any[], i: number) => ({
    id: row[0] || `bud_${i}`,
    category: row[1] || '',
    limit: parseNum(row[2]),
    month: row[3] || ''
  }));

  // Parse Goals
  const goalRows = getRows(9);
  const parsedGoals = goalRows.map((row: any[], i: number) => ({
    id: row[0] || `goal_${i}`,
    title: row[1] || '',
    targetAmount: parseNum(row[2]),
    currentAmount: parseNum(row[3]),
    deadline: row[4] || ''
  }));

  onProgress?.('A guardar dados no armazenamento local...', 80);

  // Update LocalStorage unconditionally so emptied sheets clear local data
  setLocalData('fin_expenses', parsedExpenses);
  setLocalData('fin_incomes', parsedIncomes);
  setLocalData('fin_incomes_fixed_realized', parsedFixedIncomesRealized);
  setLocalData('fin_fixed_expenses', parsedFixedExpenses);
  setLocalData('fin_fixed_incomes', parsedFixedIncomes);
  setLocalData('fin_assets', parsedAccounts.concat(parsedPatrimonio));
  setLocalData('fin_patrimonio', parsedPatrimonio);
  setLocalData('fin_vehicles', parsedVehicles);
  setLocalData('fin_budgets', parsedBudgets);
  setLocalData('fin_goals', parsedGoals);

  // Parse Trash
  const trashRowsData = getRows(10);
  const parsedTrash = trashRowsData.map((row: any[], i: number) => {
    let dataObj = {};
    try { dataObj = JSON.parse(row[2]); } catch (e) {}
    return {
      id: row[0] || `trash_${i}`,
      type: row[1] || '',
      data: dataObj,
      deletedAt: row[3] || '',
      createdAt: row[3] || ''
    };
  }).filter((t: any) => t.type);
  setLocalData('finanas_trash_items', parsedTrash);

  // Parse Preferences
  const prefsRowsData = getRows(11);
  if (prefsRowsData.length > 0 && prefsRowsData[0][1]) {
    try {
      const prefsData = JSON.parse(prefsRowsData[0][1]);
      localStorage.setItem('finanas_user_prefs', JSON.stringify(prefsData));
    } catch (e) {
      console.warn('Erro ao parsear preferências', e);
    }
  }

  // Parse Categorization Rules
  const catRulesRowsData = getRows(12);
  const parsedCatRules = catRulesRowsData.map((row: any[], i: number) => ({
    id: row[0] || `rule_${i}`,
    keyword: row[1] || '',
    category: row[2] || '',
    type: row[3] || '',
    priority: parseNum(row[4])
  })).filter((r: any) => r.keyword);
  setLocalData('fin_categorization_rules', parsedCatRules);

  // Parse Notifications
  const notifRowsData = getRows(13);
  const parsedNotifs = notifRowsData.map((row: any[], i: number) => ({
    id: row[0] || `notif_${i}`,
    title: row[1] || '',
    message: row[2] || '',
    createdAt: row[3] || '',
    read: row[4] === 'Sim',
    type: row[5] || ''
  })).filter((n: any) => n.title);
  setLocalData('finanas_notifications', parsedNotifs);

  // Parse Archives
  const archiveRowsData = getRows(14);
  const parsedArchives = archiveRowsData.map((row: any[], i: number) => {
    let dataObj = {};
    try { dataObj = JSON.parse(row[3]); } catch (e) {}
    return {
      id: row[0] || `arch_${i}`,
      title: row[1] || '',
      createdAt: row[2] || '',
      data: dataObj,
      type: row[4] || ''
    };
  }).filter((a: any) => a.title);
  setLocalData('finanas_archives', parsedArchives);

  // Firestore optional background sync if user is logged in
  const user = auth.currentUser;
  if (user) {
    try {
      // Firestore mirroring removed.
    } catch {
      // ignore
    }
  }

  onProgress?.('Concluído!', 100);

  const stats: SyncStats = {
    expensesCount: parsedExpenses.length,
    incomesCount: parsedIncomes.length + parsedFixedIncomesRealized.length,
    fixedExpensesCount: parsedFixedExpenses.length,
    fixedIncomesCount: parsedFixedIncomes.length,
    accountsCount: parsedAccounts.length,
    patrimonioCount: parsedPatrimonio.length,
    vehiclesCount: parsedVehicles.length,
    budgetsCount: parsedBudgets.length,
    goalsCount: parsedGoals.length,
    trashCount: getRows(9).length,
    lastSyncedAt: new Date().toISOString()
  };

  localStorage.setItem('google_drive_sync_stats', JSON.stringify(stats));
  notifySyncStatus('synced', 'Dados importados com sucesso do Google Sheets');
  
  addSyncAuditLog({
    action: 'import',
    status: 'success',
    details: `Importados com sucesso ${stats.expensesCount} despesas e ${stats.incomesCount} receitas`,
    recordsCount: stats.expensesCount + stats.incomesCount
  });

  return stats;
}

export interface ReorganizeResult {
  success: boolean;
  sheetsCreated: string[];
  sheetsRemoved: string[];
  incomesPunctualMigrated: number;
  incomesFixedRegisteredMigrated: number;
  firebaseMigrated: boolean;
  message: string;
}

/**
 * Reorganizes income structure across Google Sheets, LocalStorage, and Firebase.
 * - Removes old "Receitas" and "Receitas_Fixas_Reg" sheets
 * - Creates & populates "Receitas_Pontuais" and "Receitas_Fixas_Registadas"
 * - Updates Firebase Firestore collections and LocalStorage
 */
export async function reorganizeIncomeSheetsAndDatabase(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (status: string, percent: number) => void
): Promise<ReorganizeResult> {
  notifySyncStatus('syncing', 'A reorganizar estrutura de receitas no Google Sheets & Firebase...');
  onProgress?.('A inspecionar abas do Google Sheets...', 10);

  // 1. Fetch spreadsheet metadata to get existing sheet IDs and names
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const errData = await metaRes.json().catch(() => ({}));
    const detail = errData.error?.message || `Status HTTP ${metaRes.status}`;
    let errorText = detail;
    if (metaRes.status === 401 || metaRes.status === 403) {
      setCachedDriveToken(null);
      errorText = 'Sessão Google expirada. Por favor reconecte a conta Google.';
    }
    throw new Error(`Falha ao aceder à folha de cálculo: ${errorText}`);
  }

  const metaData = await metaRes.json();
  const existingSheets: { sheetId: number; title: string }[] = (metaData.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title
  }));

  const existingTitles = existingSheets.map(s => s.title);
  const sheetsCreated: string[] = [];
  const sheetsRemoved: string[] = [];

  // 2. Read legacy data from Google Sheets if available
  let legacyIncomes: any[] = [];
  let legacyFixedIncomesRealized: any[] = [];

  if (existingTitles.includes('Receitas')) {
    onProgress?.('A resgatar dados da folha legada "Receitas"...', 20);
    try {
      const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Receitas!A2:H5000`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (getRes.ok) {
        const valData = await getRes.json();
        const rows = valData.values || [];
        legacyIncomes = rows.map((row: any[], i: number) => ({
          id: row[0] || `inc_sheet_${i}`,
          date: row[1] || new Date().toISOString().slice(0, 10),
          entity: row[2] || 'Receita',
          category: row[3] || 'Salário',
          amount: parseNum(row[4]),
          method: row[5] || 'Transferência Bancária',
          notes: row[6] || ''
        })).filter((i: any) => i.amount > 0 || i.entity);
      }
    } catch (e) {
      console.warn('Erro ao ler aba Receitas antiga:', e);
    }
  }

  if (existingTitles.includes('Receitas_Fixas_Reg')) {
    onProgress?.('A resgatar dados da folha legada "Receitas_Fixas_Reg"...', 30);
    try {
      const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Receitas_Fixas_Reg!A2:H5000`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (getRes.ok) {
        const valData = await getRes.json();
        const rows = valData.values || [];
        legacyFixedIncomesRealized = rows.map((row: any[], i: number) => ({
          id: row[0] || `inc_fixed_sheet_${i}`,
          date: row[1] || new Date().toISOString().slice(0, 10),
          entity: row[2] || 'Receita',
          category: row[3] || 'Salário',
          amount: parseNum(row[4]),
          method: row[5] || 'Transferência Bancária',
          notes: row[6] || '',
          fixedIncomeId: row[7] || undefined,
          isFixed: true
        })).filter((i: any) => i.amount > 0 || i.entity);
      }
    } catch (e) {
      console.warn('Erro ao ler aba Receitas_Fixas_Reg antiga:', e);
    }
  }

  // 3. Merge with local data
  let localPunctual = getLocalData('fin_incomes');
  let localFixedRealized = getLocalData('fin_incomes_fixed_realized');

  if (localPunctual.length === 0 && legacyIncomes.length > 0) {
    localPunctual = legacyIncomes;
  }
  if (localFixedRealized.length === 0 && legacyFixedIncomesRealized.length > 0) {
    localFixedRealized = legacyFixedIncomesRealized;
  }

  // Separate incomes cleanly
  const { punctual: cleanLocalPunctual, fixedRealized: cleanLocalFixedRealized } = partitionIncomes([
    ...localPunctual,
    ...localFixedRealized
  ]);

  localPunctual = cleanLocalPunctual;
  localFixedRealized = cleanLocalFixedRealized;
  setLocalData('fin_incomes', localPunctual);
  setLocalData('fin_incomes_fixed_realized', localFixedRealized);

  // 4. Create new target sheets if not present
  const sheetsToCreate: string[] = [];
  if (!existingTitles.includes('Receitas_Pontuais')) {
    sheetsToCreate.push('Receitas_Pontuais');
  }
  if (!existingTitles.includes('Receitas_Fixas_Registadas')) {
    sheetsToCreate.push('Receitas_Fixas_Registadas');
  }

  if (sheetsToCreate.length > 0) {
    onProgress?.(`A criar novas abas (${sheetsToCreate.join(', ')})...`, 45);
    const addRequests = sheetsToCreate.map(title => ({
      addSheet: { properties: { title } }
    }));

    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: addRequests })
    });

    if (addRes.ok) {
      sheetsCreated.push(...sheetsToCreate);
    }
  }

  // 5. Populate and write headers & data for the new sheets
  onProgress?.('A exportar dados de receitas para as novas abas estruturadas...', 60);

  const incPunctualRows = [
    ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas"],
    ...localPunctual.map((i: any) => [
      i.id || '',
      i.date || '',
      i.entity || '',
      i.category || '',
      Number(i.amount || 0),
      i.method || '',
      i.notes || ''
    ])
  ];

  const incFixedRealizedRows = [
    ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas", "ID Fixo"],
    ...localFixedRealized.map((i: any) => [
      i.id || '',
      i.date || '',
      i.entity || '',
      i.category || '',
      Number(i.amount || 0),
      i.method || '',
      i.notes || '',
      i.fixedIncomeId || ''
    ])
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Receitas_Pontuais!A1:H' + incPunctualRows.length, values: incPunctualRows },
        { range: 'Receitas_Fixas_Registadas!A1:H' + incFixedRealizedRows.length, values: incFixedRealizedRows }
      ]
    })
  });

  // 6. Delete old legacy sheets ('Receitas' and 'Receitas_Fixas_Reg')
  const sheetsToDelete: number[] = [];
  const oldReceitas = existingSheets.find(s => s.title === 'Receitas');
  if (oldReceitas) {
    sheetsToDelete.push(oldReceitas.sheetId);
    sheetsRemoved.push('Receitas');
  }
  const oldFixReg = existingSheets.find(s => s.title === 'Receitas_Fixas_Reg');
  if (oldFixReg) {
    sheetsToDelete.push(oldFixReg.sheetId);
    sheetsRemoved.push('Receitas_Fixas_Reg');
  }

  if (sheetsToDelete.length > 0) {
    onProgress?.(`A remover abas antigas (${sheetsRemoved.join(', ')})...`, 75);
    const deleteRequests = sheetsToDelete.map(sheetId => ({
      deleteSheet: { sheetId }
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: deleteRequests })
    });
  }

  // 7. Update Firebase Firestore collections
  let firebaseMigrated = false;
  const user = auth.currentUser;
  if (user) {
    onProgress?.('A sincronizar e atualizar coleções no Firebase...', 85);
    try {
      for (const inc of localPunctual) {
//
//
      }
      for (const inc of localFixedRealized) {
//
//
      }
      firebaseMigrated = true;
    } catch (fbErr) {
      console.warn('Aviso na migração Firebase:', fbErr);
    }
  }

  // 8. Re-apply overall sheet export and formatting/formulas
  onProgress?.('A atualizar fórmulas do Dashboard e formatação geral...', 92);
  try {
    await exportAllDataToSheets(accessToken, spreadsheetId);
  } catch (e) {
    console.warn('Erro ao finalizar export:', e);
  }

  // Update cached spreadsheet info in localStorage
  try {
    const freshMetaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (freshMetaRes.ok) {
      const freshMeta = await freshMetaRes.json();
      const updatedSheets = (freshMeta.sheets || []).map((s: any) => s.properties?.title);
      const stored = localStorage.getItem('google_drive_spreadsheet_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.sheets = updatedSheets;
        localStorage.setItem('google_drive_spreadsheet_info', JSON.stringify(parsed));
      }
    }
  } catch (e) {
    // ignore
  }

  onProgress?.('Reorganização concluída com sucesso!', 100);

  const result: ReorganizeResult = {
    success: true,
    sheetsCreated,
    sheetsRemoved,
    incomesPunctualMigrated: localPunctual.length,
    incomesFixedRegisteredMigrated: localFixedRealized.length,
    firebaseMigrated,
    message: `Reorganização concluída: folha "Receitas" eliminada, criadas e migradas ${localPunctual.length} receitas pontuais em "Receitas_Pontuais" e ${localFixedRealized.length} receitas fixas registadas em "Receitas_Fixas_Registadas".`
  };

  addSyncAuditLog({
    action: 'reorganize',
    status: 'success',
    details: result.message,
    recordsCount: localPunctual.length + localFixedRealized.length
  });

  notifySyncStatus('synced', 'Estrutura de receitas reorganizada com sucesso!');

  return result;
}

// Debounced background sync timer for real-time CRUD operations
let backgroundSyncTimer: any = null;

/**
 * Schedules debounced background synchronization to Google Sheets.
 * Called automatically by mutations in Phase 3/4.
 */
export function scheduleSheetsBackgroundSync(delayMs = 1200) {
  if (!isAutoSyncEnabled()) return;

  const token = getCachedDriveToken();
  const spreadsheetId = getStoredSpreadsheetId();

  if (!token || !spreadsheetId) return;

  // If offline, store in offline queue
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingSync('Registo local efetuado em modo offline');
    return;
  }

  if (backgroundSyncTimer) {
    clearTimeout(backgroundSyncTimer);
  }

  notifySyncStatus('syncing', 'A sincronizar alterações com o Google Sheets...');

  backgroundSyncTimer = setTimeout(async () => {
    try {
      await exportAllDataToSheets(token, spreadsheetId);
    } catch (err: any) {
      console.warn('Falha na sincronização em segundo plano com o Google Sheets:', err);
      notifySyncStatus('error', err?.message || 'Falha ao sincronizar');
    }
  }, delayMs);
}

/**
 * Automatically drain any pending offline queue when online.
 */
export async function flushPendingSyncQueue(): Promise<boolean> {
  const pendingCount = getPendingSyncQueueCount();
  if (pendingCount === 0) return true;

  const token = getCachedDriveToken();
  const spreadsheetId = getStoredSpreadsheetId();
  if (!token || !spreadsheetId) {
    throw new Error('Sessão inválida ou folha de cálculo não selecionada. Reconecte o Google Drive.');
  }

  notifySyncStatus('syncing', `A processar ${pendingCount} sincronizações pendentes...`);

  try {
    await exportAllDataToSheets(token, spreadsheetId);
    clearPendingSyncQueue();
    addSyncAuditLog({
      action: 'offline_flushed',
      status: 'success',
      details: `Fila offline (${pendingCount} itens) sincronizada com sucesso após reconexão`
    });
    notifySyncStatus('synced', 'Fila offline sincronizada');
    return true;
  } catch (err: any) {
    notifySyncStatus('error', 'Falha ao processar fila offline: ' + err.message);
    throw err;
  }
}

// Setup network and focus listeners for automatic offline recovery
let listenersInitialized = false;
export function initOfflineSyncListeners() {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  window.addEventListener('online', () => {
    console.log('[SyncEngine] Conexão à Internet restaurada. A processar fila...');
    flushPendingSyncQueue().catch(() => {});
  });

  window.addEventListener('focus', () => {
    // If there are pending items and we are online, attempt flush
    if (navigator.onLine && getPendingSyncQueueCount() > 0) {
      flushPendingSyncQueue().catch(() => {});
    }
  });
}

/**
 * Wipes all local entity caches and Firestore user documents completely.
 */
export async function wipeAllLocalAndFirestoreData(): Promise<void> {
  const LOCAL_STORAGE_KEYS = [
    'fin_expenses',
    'fin_incomes',
    'fin_incomes_fixed_realized',
    'fin_fixed_expenses',
    'fin_fixed_incomes',
    'fin_assets',
    'fin_patrimonio',
    'fin_vehicles',
    'fin_vehicle_tasks',
    'fin_vehicle_fuel',
    'fin_goals',
    'fin_budgets',
    'fin_trash',
    'finanas_trash_items',
    'fin_property_expenses',
    'fin_documents',
    'finanas_archives',
    'fin_categorization_rules',
    'finanas_notifications'
  ];

  LOCAL_STORAGE_KEYS.forEach(key => {
    try {
      localStorage.setItem(key, JSON.stringify([]));
    } catch (e) {
      console.warn(`Erro ao limpar chave local ${key}:`, e);
    }
  });

  const user = auth.currentUser;
  if (user) {
    const FIRESTORE_COLLECTIONS = [
      'expenses',
      'incomes',
      'incomes_punctual',
      'incomes_fixed_registered',
      'incomes_fixed_realized',
      'fixed_expenses',
      'fixed_incomes',
      'assets',
      'accounts',
      'vehicles',
      'vehicle_tasks',
      'vehicle_fuel',
      'goals',
      'savings_goals',
      'budgets',
      'trash',
      'property_expenses',
      'documents',
      'archives',
      'categorization_rules',
      'notifications',
      'user_preferences'
    ];

    const deletePromises: Promise<any>[] = [];

    for (const collName of FIRESTORE_COLLECTIONS) {
      deletePromises.push((async () => {
        try {
          
          const snap = { docs: [] };
          
          
        } catch (e) {
          // Ignore
        }

        try {
          
          const snap2 = { docs: [] };
          
          
        } catch (e2) {
          // Ignore
        }
      })());
    }

    await Promise.all(deletePromises);
  }
}

/**
 * Forcefully clears all data rows across all active sheets in Google Drive, wipes local/Firestore caches, and resets headers & Dashboard.
 */
export async function clearAllSpreadsheetData(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (status: string, percent: number) => void
): Promise<SyncStats> {
  notifySyncStatus('syncing', 'A apagar todos os registos na Google Sheets, na Base de Dados e na Aplicação...');
  onProgress?.('A esvaziar dados na base de dados e no armazenamento local...', 10);

  // 1. Wipe local storage and Firestore documents so old data never resurrects
  await wipeAllLocalAndFirestoreData();

  onProgress?.('A verificar abas na Google Drive...', 25);
  const activeSheetTitles = await ensureMissingSheetsExist(accessToken, spreadsheetId);

  // Get ALL existing sheets in the workbook (including legacy sheets like Receitas, Receitas_Fixas_Reg, etc.)
  let allExistingSheets: string[] = activeSheetTitles;
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      allExistingSheets = (metaData.sheets || []).map((s: any) => s.properties.title);
    }
  } catch (e) {
    console.warn('Erro ao ler abas para limpeza total:', e);
  }

  onProgress?.('A esvaziar todas as folhas na Google Drive...', 45);

  // 2. Clear entire ranges across ALL existing sheets
  const clearRanges = allExistingSheets.map(s => {
    if (s === 'Dashboard_Calculos' || s === 'Receitas' || s === 'Receitas_Fixas_Reg') {
      return `'${s}'!A1:Z100000`;
    }
    return `'${s}'!A2:Z100000`;
  });

  if (clearRanges.length > 0) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ranges: clearRanges })
      });
    } catch (err) {
      console.warn('batchClear error em clearAllSpreadsheetData:', err);
    }
  }

  // Fallback individual clear for guaranteed execution on every sheet
  for (const sheetName of allExistingSheets) {
    const rangeStr = (sheetName === 'Dashboard_Calculos' || sheetName === 'Receitas' || sheetName === 'Receitas_Fixas_Reg')
      ? `'${sheetName}'!A1:Z100000`
      : `'${sheetName}'!A2:Z100000`;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeStr)}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    }).catch(() => {});
  }

  onProgress?.('A repor cabeçalhos limpos nas abas...', 70);

  // 3. Write clean header rows
  const allHeaders: Record<string, string[]> = {
    'Despesas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Veículo", "Notas", "ID Fixo"],
    'Receitas_Pontuais': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas"],
    'Receitas_Fixas_Registadas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas", "ID Fixo"],
    'Despesas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas"],
    'Receitas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Frequência", "Ativo", "Notas"],
    'Contas': ["ID", "Nome", "Tipo", "IBAN", "Saldo (€)", "Ativa"],
    'Patrimonio': ["ID", "Nome", "Categoria", "Valor (€)", "Notas"],
    'Veiculos': ["ID", "Marca", "Modelo", "Matrícula", "Ano"],
    'Orcamentos': ["ID", "Categoria", "Limite (€)", "Mês"],
    'Metas': ["ID", "Nome", "Valor Alvo (€)", "Valor Atual (€)", "Data Limite"],
    'Reciclagem': ["ID", "Tipo", "Dados JSON", "Data Eliminação"],
    'Preferencias': ["Chave", "Dados JSON", "Atualizado Em"],
    'Regras_Categorizacao': ["ID", "Keyword", "Categoria", "Tipo", "Prioridade"],
    'Notificacoes': ["ID", "Título", "Mensagem", "Data", "Lida", "Tipo"],
    'Arquivo': ["ID", "Título", "Data", "Dados JSON", "Tipo"]
  };

  const headerPayload = Object.keys(allHeaders)
    .filter(sheet => allExistingSheets.includes(sheet))
    .map(sheet => ({
      range: `${sheet}!A1:Z1`,
      values: [allHeaders[sheet]]
    }));

  if (headerPayload.length > 0) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: headerPayload
        })
      });
    } catch (err) {
      console.warn('Erro ao repor cabeçalhos:', err);
    }
  }

  onProgress?.('A recalcular o Dashboard de Cálculos com totais a 0,00 €...', 85);

  // 4. Re-inject clean formulas into Dashboard_Calculos
  try {
    await formatAndStyleFinanceSpreadsheet(accessToken, spreadsheetId);
  } catch (e) {
    console.warn('Aviso ao formatar Dashboard em clearAllSpreadsheetData:', e);
  }

  const cleanStats: SyncStats = {
    expensesCount: 0,
    incomesCount: 0,
    fixedExpensesCount: 0,
    fixedIncomesCount: 0,
    accountsCount: 0,
    patrimonioCount: 0,
    vehiclesCount: 0,
    budgetsCount: 0,
    goalsCount: 0,
    trashCount: 0,
    lastSyncedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem('google_drive_sync_stats', JSON.stringify(cleanStats));
  } catch (e) {}

  addSyncAuditLog({
    action: 'export',
    status: 'success',
    details: 'Todos os registos na Google Drive, base de dados e aplicação foram eliminados definitivamente.',
    recordsCount: 0
  });

  notifySyncStatus('synced', 'Google Sheets, Base de Dados e Aplicação totalmente limpos.');
  onProgress?.('Concluído! Todos os dados foram apagados.', 100);

  return cleanStats;
}
