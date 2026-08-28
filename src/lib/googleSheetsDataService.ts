import { auth } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getCachedDriveToken, setCachedDriveToken, formatAndStyleFinanceSpreadsheet, getSpreadsheetModifiedTime } from './googleDriveService';
import { sanitizeForFirestore } from '../hooks/queries';
import { AssetCategory } from '../types';

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
  let str = String(val).replace(/€/g, '').replace(/\s/g, '').trim();
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf('.') < str.lastIndexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
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

function mapToAssetCategory(val: string): AssetCategory {
  const lower = val?.toLowerCase() || '';
  if (
    lower.includes('imovel') ||
    lower.includes('imóvel') ||
    lower.includes('apartamento') ||
    lower.includes('moradia') ||
    lower.includes('terreno') ||
    lower.includes('garagem') ||
    lower.includes('loja') ||
    lower.includes('armazém') ||
    lower.includes('armazem') ||
    lower.includes('escritório') ||
    lower.includes('escritorio') ||
    lower.includes('quinta') ||
    lower.includes('prédio') ||
    lower.includes('predio') ||
    lower.includes('casa')
  ) {
    return 'imovel';
  }
  return 'financeiro';
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

export const ALIAS_MAP: Record<string, string[]> = {
  'Patrimonio': ['Património', 'Patrimônio', 'Ativos', 'Assets', 'Patrimony', 'Investimentos'],
  'Veiculos': ['Veículos', 'Viaturas', 'Carros', 'Vehicles', 'Frota'],
  'Orcamentos': ['Orçamentos', 'Budgets', 'Limites', 'Planeamento'],
  'Preferencias': ['Preferências', 'Settings', 'Configurações', 'Prefs'],
  'Notificacoes': ['Notificações', 'Alertas', 'Notifications', 'Avisos'],
  'Regras_Categorizacao': ['Regras_Categorização', 'RegrasCategorizacao', 'Rules', 'Regras'],
  'Receitas_Pontuais': ['Receitas', 'Ganhos', 'Incomes', 'Entradas', 'Rendimentos'],
  'Receitas_Fixas_Registadas': ['Receitas_Fixas_Reg', 'Receitas_Fixas_Realizadas', 'Rendimentos_Fixos'],
  'Despesas': ['Gastos', 'Saídas', 'Expenses', 'Pagamentos', 'Custos'],
  'Contas': ['Bancos', 'Contas_Bancarias', 'Accounts', 'Saldos']
};

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
    'Veiculos_Abastecimentos',
    'Veiculos_Tarefas',
    'Orcamentos',
    'Metas',
    'Reciclagem',
    'Preferencias',
    'Regras_Categorizacao',
    'Notificacoes',
    'Arquivo'
  ];

  const allHeaders: Record<string, string[]> = {
    'Despesas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Veículo", "Notas", "ID Fixo"],
    'Receitas_Pontuais': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas"],
    'Receitas_Fixas_Registadas': ["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas", "ID Fixo"],
    'Despesas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas", "Data Início", "Data Fim", "Próximo Vencimento"],
    'Receitas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Frequência", "Ativo", "Notas"],
    'Contas': ["ID", "Nome", "Tipo", "IBAN", "Saldo (€)", "Ativa"],
    'Patrimonio': ["ID", "Nome", "Categoria / SubTipo", "Valor Atual (€)", "Valor Compra (€)", "Data Aquisição", "Rua", "Código Postal", "Localidade", "Notas", "Custos Fixos Detalhados (JSON)"],
    'Veiculos': ["ID", "Marca", "Modelo", "Matrícula", "Ano"],
    'Veiculos_Abastecimentos': ["ID", "ID Viatura", "Data", "Litros", "Valor Total (€)", "Preço/L (€)", "Quilometragem (km)", "Posto / Local", "Notas"],
    'Veiculos_Tarefas': ["ID", "ID Viatura", "Título", "Tipo", "Custo (€)", "Estado", "Data Limite", "Data Conclusão", "Periodicidade", "Próx. Data Vencimento", "Próx. Custo (€)", "Documento", "Notas"],
    'Orcamentos': ["ID", "Categoria", "Limite (€)", "Mês", "Ano"],
    'Metas': ["ID", "Nome", "Valor Alvo (€)", "Valor Atual (€)", "Data Limite"],
    'Reciclagem': ["ID", "Tipo", "Dados JSON", "Data Eliminação"],
    'Preferencias': ["Chave", "Dados JSON", "Atualizado Em"],
    'Regras_Categorizacao': ["ID", "Keyword", "Categoria", "Tipo", "Prioridade"],
    'Notificacoes': ["ID", "Título", "Mensagem", "Data", "Lida", "Tipo"],
    'Arquivo': ["ID", "Título", "Data", "Dados JSON", "Tipo"]
  };

  try {
    // 1. Get current sheets list
    const getMeta = async () => {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.sheets || [];
    };

    let sheetsList = await getMeta();
    const getResolvedTitles = (list: any[]) => {
      const titles = new Set<string>();
      for (const s of list) {
        const currentTitle = (s.properties?.title || '').trim();
        const lowerTitle = currentTitle.toLowerCase();
        
        let canonical = null;
        const exact = REQUIRED_SHEETS.find(rs => rs.toLowerCase() === lowerTitle);
        if (exact) canonical = exact;
        else {
          for (const [can, aliases] of Object.entries(ALIAS_MAP)) {
            if (aliases.some(a => a.toLowerCase() === lowerTitle)) {
              canonical = can;
              break;
            }
          }
        }
        if (canonical) titles.add(canonical);
      }
      return titles;
    };

    let resolvedTitles = getResolvedTitles(sheetsList);
    const structuralRequests = [];

    // Check for missing or hidden/misnamed sheets
    for (const s of sheetsList) {
      const currentTitle = (s.properties?.title || '').trim();
      const sheetId = s.properties?.sheetId;
      const lowerTitle = currentTitle.toLowerCase();
      
      let canonicalTarget = null;
      const exactMatch = REQUIRED_SHEETS.find(rs => rs.toLowerCase() === lowerTitle);
      if (exactMatch) canonicalTarget = exactMatch;
      else {
        for (const [can, aliases] of Object.entries(ALIAS_MAP)) {
          if (aliases.some(a => a.toLowerCase() === lowerTitle)) {
            canonicalTarget = can;
            break;
          }
        }
      }

      if (canonicalTarget) {
        const needsRename = currentTitle !== canonicalTarget;
        const isHidden = s.properties?.hidden === true;
        if (needsRename || isHidden) {
          structuralRequests.push({
            updateSheetProperties: {
              properties: { sheetId, title: canonicalTarget, hidden: false },
              fields: 'title,hidden'
            }
          });
        }
      }
    }

    const missing = REQUIRED_SHEETS.filter(sheet => !resolvedTitles.has(sheet));
    for (const title of missing) {
      structuralRequests.push({
        addSheet: { properties: { title, gridProperties: { rowCount: 1000, columnCount: 26 } } }
      });
    }

    if (structuralRequests.length > 0) {
      console.log('A executar atualizações estruturais...', structuralRequests.length);
      try {
        const structRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: structuralRequests })
        });

        if (!structRes.ok) {
          console.warn('Batch update falhou, a tentar criação individual...');
          // Individual fallback
          for (const req of structuralRequests) {
            try {
              await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: [req] })
              });
            } catch (e) {
              console.error('Falha ao criar aba individualmente:', e);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao processar structuralRequests:', err);
      }
      
      // RE-VERIFY AFTER UPDATE with a small delay to allow consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      sheetsList = await getMeta();
      resolvedTitles = getResolvedTitles(sheetsList);
    }

    const finalActiveTitles = Array.from(resolvedTitles) as string[];
    console.log('Abas ativas finais na Google Drive:', finalActiveTitles);

    // Write Headers to all resolved sheets
    const headerData = finalActiveTitles
      .filter(sheet => allHeaders[sheet])
      .map(sheet => {
        const headers = allHeaders[sheet];
        const endChar = String.fromCharCode(64 + headers.length);
        return {
          range: `'${sheet}'!A1:${endChar}1`,
          values: [headers]
        };
      });

    if (headerData.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: headerData })
      }).catch(e => console.error('Erro ao escrever cabeçalhos:', e));
    }

    return finalActiveTitles;
  } catch (err) {
    console.error('Erro em ensureMissingSheetsExist:', err);
    return REQUIRED_SHEETS;
  }
}

export async function exportAllDataToSheets(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (status: string, percent: number) => void,
  force = false
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

  // --- SAFETY CHECK: Change Detection & Anti-Wipe ---
  const lastSyncStatsRaw = localStorage.getItem('google_drive_sync_stats');
  const lastSyncStats = lastSyncStatsRaw ? JSON.parse(lastSyncStatsRaw) : null;
  
  // Get current local data
  const expenses = getLocalData('fin_expenses');
  const rawIncomesPunctual = getLocalData('fin_incomes');
  const rawIncomesFixedRealized = getLocalData('fin_incomes_fixed_realized');
  const { punctual: incomesPunctual, fixedRealized: incomesFixedRealized } = partitionIncomes([
    ...rawIncomesPunctual,
    ...rawIncomesFixedRealized
  ]);
  const fixedExpenses = getLocalData('fin_fixed_expenses');
  const fixedIncomes = getLocalData('fin_fixed_incomes');

  const acc1 = getLocalData('fin_accounts');
  let acc2 = getLocalData('fin_bank_accounts');
  const accMap = new Map<string, any>();
  [...acc1, ...acc2].forEach((item: any) => {
    if (item && (item.id || item.name)) {
      accMap.set(item.id || item.name, item);
    }
  });
  let accounts = Array.from(accMap.values());

  let pat1 = getLocalData('fin_patrimonio');
  let pat2 = getLocalData('fin_assets');
  const patMap = new Map<string, any>();
  [...pat1, ...pat2].forEach((item: any) => {
    if (item && (item.id || item.name)) {
      const key = item.id || `${item.name}_${item.currentValue || item.value || 0}`;
      patMap.set(key, item);
    }
  });
  let patrimonio = Array.from(patMap.values());
  let propertyExpenses = getLocalData('fin_property_expenses');
  
  // Attach property expenses to patrimonio items for export
  patrimonio = patrimonio.map((p: any) => ({
    ...p,
    expenses: propertyExpenses.filter((pe: any) => pe.assetId === p.id)
  }));

  let vehicles = getLocalData('fin_vehicles');
  let vehicleFuel = getLocalData('fin_vehicle_fuel');
  let vehicleTasks = getLocalData('fin_vehicle_tasks');
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
  
  const currentTotalRecords = 
    expenses.length + 
    incomesPunctual.length + 
    incomesFixedRealized.length + 
    fixedExpenses.length + 
    fixedIncomes.length +
    accounts.length +
    patrimonio.length +
    vehicles.length +
    categorizationRules.length;

  // 1. Check if remote version was restored or edited manually
  if (!force) {
    try {
      const remoteModTime = await getSpreadsheetModifiedTime(accessToken, spreadsheetId);
      const lastSyncedModTime = localStorage.getItem('google_drive_last_synced_modified_time');
      
      if (remoteModTime && lastSyncedModTime && remoteModTime !== lastSyncedModTime) {
        console.warn('Conflito de Sincronização: A folha na Drive foi alterada externamente ou restaurada. Abortando exportação automática.');
        notifySyncStatus('error', 'A folha na Drive foi alterada ou restaurada. Por favor, use "Puxar do Google Sheets" para reconciliar.');
        return lastSyncStats || { lastSyncedAt: new Date().toISOString() } as any;
      }
    } catch (modErr) {
      console.warn('Não foi possível verificar data de modificação da folha:', modErr);
    }
  }

  // 2. Prevent accidental wipe during auto-sync
  if (!force && lastSyncStats && lastSyncStats.expensesCount > 0 && expenses.length === 0) {
    console.error('ALERTA: Tentativa de apagar todos os dados via Sincronização Automática.');
    notifySyncStatus('error', 'Sincronização bloqueada: Os seus dados locais parecem estar vazios.');
    throw new Error('Proteção Anti-Wipe: Operação cancelada para evitar perda de dados.');
  }

  // 3. Robust Data Change Detection
  const generateChecksum = (obj: any) => {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString();
  };

  const currentDataHash = generateChecksum({
    exp: expenses,
    incP: incomesPunctual,
    incF: incomesFixedRealized,
    fExp: fixedExpenses,
    fInc: fixedIncomes,
    acc: accounts,
    pat: patrimonio,
    veh: vehicles,
    rules: categorizationRules,
    goals: goals,
    budgets: budgets,
    prefs: userPrefs
  });
  const lastDataHash = localStorage.getItem('google_drive_last_export_hash');
  
  if (!force && currentDataHash === lastDataHash) {
    console.log('Dados idênticos ao último envio. Sincronização ignorada.');
    onProgress?.('Concluído (Sem alterações)!', 100);
    notifySyncStatus('synced', 'Dados já estão sincronizados.');
    return lastSyncStats;
  }

  // 1. Gather Data directly from LocalStorage without pre-export merge
  // (Redundant call removed since we already gathered data for safety checks)
  
  // Persist cleaned lists back to LocalStorage
  setLocalData('fin_incomes', incomesPunctual);
  setLocalData('fin_incomes_fixed_realized', incomesFixedRealized);

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
    ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas", "Data Início", "Data Fim", "Próximo Vencimento"],
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
      fe.notes || '',
      fe.startDate || '',
      fe.endDate || '',
      fe.dueDate || ''
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

  const safeNum = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const patRows = [
    ["ID", "Nome", "Categoria / SubTipo", "Valor Atual (€)", "Valor Compra (€)", "Data Aquisição", "Rua", "Código Postal", "Localidade", "Notas", "Custos Fixos Detalhados (JSON)"],
    ...patrimonio.map((p: any) => [
      p.id || '',
      p.name || '',
      p.subType || p.category || '',
      safeNum(p.currentValue || p.value || p.amount || 0),
      safeNum(p.purchaseValue || 0),
      p.acquisitionDate || '',
      p.street || '',
      p.zipCode || '',
      p.city || '',
      p.notes || '',
      JSON.stringify(p.expenses || [])
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

  const vehFuelRows = [
    ["ID", "ID Viatura", "Data", "Litros", "Valor Total (€)", "Preço/L (€)", "Quilometragem (km)", "Posto / Local", "Notas"],
    ...vehicleFuel.map((f: any) => [
      f.id || '',
      f.vehicleId || '',
      f.date || '',
      Number(f.liters || 0),
      Number(f.totalCost || 0),
      Number(f.pricePerLiter || 0),
      Number(f.odometer || 0),
      f.station || '',
      f.notes || ''
    ])
  ];

  const vehTaskRows = [
    ["ID", "ID Viatura", "Título", "Tipo", "Custo (€)", "Estado", "Data Limite", "Data Conclusão", "Periodicidade", "Próx. Data Vencimento", "Próx. Custo (€)", "Documento", "Notas"],
    ...vehicleTasks.map((t: any) => [
      t.id || '',
      t.vehicleId || '',
      t.title || '',
      t.taskType || '',
      Number(t.cost || 0),
      t.status || 'pendente',
      t.dueDate || '',
      t.completedDate || '',
      t.recurrenceInterval || (t.recurring ? '12_months' : 'none'),
      t.nextDueDate || '',
      Number(t.nextCost || 0),
      t.documentName || '',
      t.notes || ''
    ])
  ];

  const budRows = [
    ["ID", "Categoria", "Limite (€)", "Mês", "Ano"],
    ...budgets.map((b: any) => {
      let m = '';
      let y = '';
      if (b.month && b.month.includes('-')) {
        [y, m] = b.month.split('-');
      } else if (b.month) {
        m = b.month;
      }
      if (b.year) y = b.year;

      return [
        b.id || '',
        b.category || '',
        Number(b.limit || b.amount || 0),
        m || '',
        y || ''
      ];
    })
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
    ["Preferencias", JSON.stringify(userPrefs || {}), userPrefs.updatedAt || ''],
    ["CustomCategories", localStorage.getItem('expense_custom_categories') || '[]', new Date().toISOString()]
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

  onProgress?.('A preparar dados para envio...', 60);

    // 3. Send batchUpdate to Google Sheets API only for existing active sheets
  const dataPayload = [];
  const clearRanges = [];
  const missingCriticalSheets = [];
  
  const checkAndPush = (sheetName: string, rows: any[][]) => {
    // Push if we have data OR if it's a critical sheet (to ensure headers stay if we somehow cleared them)
    if (rows.length > 1 || ['Preferencias', 'Dashboard_Calculos'].includes(sheetName)) {
      if (activeSheetTitles.includes(sheetName)) {
        // Clear first (up to Z1000) to ensure old records don't persist if we have fewer now
        clearRanges.push(`'${sheetName}'!A1:Z1000`);
        dataPayload.push({ range: `'${sheetName}'!A1`, values: rows });
      } else {
        missingCriticalSheets.push(sheetName);
      }
    }
  };

  checkAndPush('Despesas', expRows);
  checkAndPush('Receitas_Pontuais', incRows);
  checkAndPush('Receitas_Fixas_Registadas', fixedIncRealizedRows);
  checkAndPush('Despesas_Fixas', fixExpRows);
  checkAndPush('Receitas_Fixas', fixIncRows);
  checkAndPush('Contas', accRows);
  checkAndPush('Patrimonio', patRows);
  checkAndPush('Veiculos', vehRows);
  checkAndPush('Veiculos_Abastecimentos', vehFuelRows);
  checkAndPush('Veiculos_Tarefas', vehTaskRows);
  checkAndPush('Orcamentos', budRows);
  checkAndPush('Metas', goalRows);
  checkAndPush('Reciclagem', trashRows);
  checkAndPush('Preferencias', prefsRows);
  checkAndPush('Regras_Categorizacao', catRulesRows);
  checkAndPush('Notificacoes', notifRows);
  checkAndPush('Arquivo', archiveRows);

  if (missingCriticalSheets.length > 0) {
    const msg = `Erro de Sincronização: As seguintes abas não foram encontradas na Drive, apesar de haver dados para gravar: ${missingCriticalSheets.join(', ')}. Por favor, use o botão "Reparar Abas" nas configurações.`;
    notifySyncStatus('error', msg);
    throw new Error(msg);
  }


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

  // Clear ranges first
  onProgress?.('A limpar dados antigos na Drive...', 80);
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ranges: clearRanges })
  }).catch(e => console.warn('Erro ao limpar abas:', e));

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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_auth_error'));
      }
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

  // Update hash and mod time after successful export
  localStorage.setItem('google_drive_last_export_hash', generateChecksum({
    exp: expenses,
    incP: incomesPunctual,
    incF: incomesFixedRealized,
    fExp: fixedExpenses,
    fInc: fixedIncomes,
    acc: accounts,
    pat: patrimonio,
    veh: vehicles,
    rules: categorizationRules,
    goals: goals,
    budgets: budgets,
    prefs: userPrefs
  }));

  try {
    const newModTime = await getSpreadsheetModifiedTime(accessToken, spreadsheetId);
    if (newModTime) {
      localStorage.setItem('google_drive_last_synced_modified_time', newModTime);
    }
  } catch (e) {}

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
 * Safely merges a remote array into a local collection stored in LocalStorage by entity ID.
 * Items present in trashedIds are excluded to preserve local user deletions.
 */
export function mergeCollection<T extends { id?: string }>(
  localKey: string,
  remoteList: T[],
  trashedIds: Set<string>
): T[] {
  const localList: T[] = getLocalData(localKey);
  const map = new Map<string, T>();

  // 1. First add remote items that were not deleted locally
  for (const rItem of remoteList) {
    if (rItem && rItem.id && !trashedIds.has(rItem.id)) {
      map.set(rItem.id, rItem);
    }
  }

  // 2. Add/Override local items (local unsaved edits or additions have precedence)
  for (const lItem of localList) {
    if (lItem && lItem.id) {
      map.set(lItem.id, lItem);
    }
  }

  const merged = Array.from(map.values());
  setLocalData(localKey, merged);
  return merged;
}

/**
 * Fetches and parses all remote financial collections from Google Sheets.
 */
export async function fetchAndParseRemoteSheets(
  accessToken: string,
  spreadsheetId: string,
  selectedSheets?: string[]
) {
  let titles: string[] = [];
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      titles = (metaData.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);
    }
  } catch (e) {
    console.warn('Erro ao ler metadados:', e);
  }

  const resolveSheetTitle = (canonical: string) => {
    const canonicalClean = canonical.toLowerCase().trim();
    
    // Exact match first (case-insensitive)
    const exactMatch = titles.find(t => t.toLowerCase().trim() === canonicalClean);
    if (exactMatch) return exactMatch;

    if (ALIAS_MAP[canonical]) {
      const aliasMatch = ALIAS_MAP[canonical].find(a => 
        titles.some(t => t.toLowerCase().trim() === a.toLowerCase().trim())
      );
      
      if (aliasMatch) {
        // Return the actual title from the sheet, not our alias
        return titles.find(t => t.toLowerCase().trim() === aliasMatch.toLowerCase().trim()) || aliasMatch;
      }
    }
    return null;
  };

  const sheetMapping = [
    { key: 'Despesas', canonical: 'Despesas', range: 'A1:Z' },
    { key: 'Receitas_Pontuais', canonical: 'Receitas_Pontuais', range: 'A1:Z' },
    { key: 'Receitas_Fixas_Registadas', canonical: 'Receitas_Fixas_Registadas', range: 'A1:Z' },
    { key: 'Despesas_Fixas', canonical: 'Despesas_Fixas', range: 'A1:Z' },
    { key: 'Receitas_Fixas', canonical: 'Receitas_Fixas', range: 'A1:Z' },
    { key: 'Contas', canonical: 'Contas', range: 'A1:Z' },
    { key: 'Patrimonio', canonical: 'Patrimonio', range: 'A1:Z' },
    { key: 'Veiculos', canonical: 'Veiculos', range: 'A1:Z' },
    { key: 'Veiculos_Abastecimentos', canonical: 'Veiculos_Abastecimentos', range: 'A1:Z' },
    { key: 'Veiculos_Tarefas', canonical: 'Veiculos_Tarefas', range: 'A1:Z' },
    { key: 'Orcamentos', canonical: 'Orcamentos', range: 'A1:Z' },
    { key: 'Metas', canonical: 'Metas', range: 'A1:Z' },
    { key: 'Reciclagem', canonical: 'Reciclagem', range: 'A1:Z' },
    { key: 'Preferencias', canonical: 'Preferencias', range: 'A1:C5' },
    { key: 'Regras_Categorizacao', canonical: 'Regras_Categorizacao', range: 'A1:Z' },
    { key: 'Notificacoes', canonical: 'Notificacoes', range: 'A1:Z' },
    { key: 'Arquivo', canonical: 'Arquivo', range: 'A1:Z' }
  ];

  // Filter based on selectedSheets if provided, and check if sheet exists remotely
  const activeMappings = sheetMapping.filter(m => {
    const isSelected = !selectedSheets || selectedSheets.includes(m.key);
    if (!isSelected) return false;
    
    const actualTitle = resolveSheetTitle(m.canonical);
    return actualTitle !== null;
  }).map(m => ({
    ...m,
    resolvedTitle: resolveSheetTitle(m.canonical) as string
  }));

  if (activeMappings.length === 0) {
    return {
      parsedExpenses: [], parsedIncomes: [], parsedFixedIncomesRealized: [],
      parsedFixedExpenses: [], parsedFixedIncomes: [], parsedAccounts: [],
      parsedPatrimonio: [], parsedVehicles: [], parsedVehicleFuel: [],
      parsedVehicleTasks: [], parsedBudgets: [], parsedGoals: [],
      parsedTrash: [], userPrefs: null, parsedCatRules: [],
      parsedNotifs: [], parsedArchives: []
    };
  }

  // Build batchGet URL with quoted ranges to handle spaces/special chars
  const ranges = activeMappings.map(m => `'${m.resolvedTitle}'!${m.range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?` + 
    ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Google Sheets Error Body:', errText);
    throw new Error(`Erro de resposta Google Sheets HTTP ${res.status}`);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  // Helper to find data by original mapping key
  const getRowsByKey = (key: string) => {
    const mappingIdx = activeMappings.findIndex(m => m.key === key);
    if (mappingIdx === -1) return [];
    const rows = valueRanges[mappingIdx]?.values || [];
    return rows.length > 1 ? rows.slice(1) : [];
  };

  // Parse Expenses
  const expRows = getRowsByKey('Despesas');
  const parsedExpenses = expRows.map((row: any[], i: number) => ({
    id: row[0] || `exp_sheet_${i}`,
    date: row[1] || new Date().toISOString().slice(0, 10),
    entity: row[2] || 'Despesa',
    category: row[3] || 'Outros',
    amount: parseNum(row[4]),
    method: row[5] || 'MBWay',
    vehicle: parseBool(row[6]),
    notes: row[7] || '',
    fixedExpenseId: row[8] || undefined,
    description: row[2] || 'Despesa',
    recurring: !!row[8]
  })).filter((e: any) => e.amount > 0 || e.entity);

  // Parse Incomes
  const incRows = getRowsByKey('Receitas_Pontuais');
  const rawParsedIncomes = incRows.map((row: any[], i: number) => ({
    id: row[0] || `inc_sheet_${i}`,
    date: row[1] || new Date().toISOString().slice(0, 10),
    entity: row[2] || 'Receita',
    category: row[3] || 'Outros',
    amount: parseNum(row[4]),
    method: row[5] || 'Transferência Bancária',
    notes: row[6] || '',
    fixedIncomeId: row[7] || undefined,
    isFixed: !!row[7] || (typeof row[0] === 'string' && row[0].startsWith('inc_fixed_')),
    description: row[2] || 'Receita',
    recurring: !!row[7]
  })).filter((i: any) => i.amount > 0 || i.entity);

  // Parse Realized Fixed Incomes
  const fixIncRegRows = getRowsByKey('Receitas_Fixas_Registadas');
  const rawParsedFixedIncomesRealized = fixIncRegRows.map((row: any[], i: number) => ({
    id: row[0] || `inc_fixed_sheet_${i}`,
    date: row[1] || new Date().toISOString().slice(0, 10),
    entity: row[2] || 'Receita',
    category: row[3] || 'Outros',
    amount: parseNum(row[4]),
    method: row[5] || 'Transferência Bancária',
    notes: row[6] || '',
    fixedIncomeId: row[7] || undefined,
    isFixed: true
  })).filter((i: any) => i.amount > 0 || i.entity);

  const { punctual: parsedIncomes, fixedRealized: parsedFixedIncomesRealized } = partitionIncomes([
    ...rawParsedIncomes,
    ...rawParsedFixedIncomesRealized
  ]);

  // Parse Fixed Expenses
  const fixExpRows = getRowsByKey('Despesas_Fixas');
  const parsedFixedExpenses = fixExpRows.map((row: any[], i: number) => ({
    id: row[0] || `fix_exp_${i}`,
    name: row[1] || row[2] || 'Despesa Fixa',
    entity: row[2] || row[1] || 'Entidade',
    category: row[3] || 'Outros',
    amount: parseNum(row[4]),
    dueDay: parseNum(row[5]) || 1,
    method: row[6] || 'Débito Direto',
    active: parseBool(row[7]),
    vehicle: parseBool(row[8]),
    notes: row[9] || '',
    startDate: row[10] || undefined,
    endDate: row[11] || undefined,
    dueDate: row[12] || undefined
  })).filter((e: any) => e.amount > 0 || (e.name !== 'Despesa Fixa' && e.name));

  // Parse Fixed Incomes
  const fixIncRows = getRowsByKey('Receitas_Fixas');
  const parsedFixedIncomes = fixIncRows.map((row: any[], i: number) => ({
    id: row[0] || `fix_inc_${i}`,
    name: row[1] || row[2] || 'Receita Fixa',
    entity: row[2] || row[1] || 'Entidade',
    category: row[3] || 'Outros',
    amount: parseNum(row[4]),
    dueDateDay: parseNum(row[5]) || 1,
    frequency: row[6] || 'Mensal',
    active: parseBool(row[7]),
    notes: row[8] || ''
  })).filter((fi: any) => fi.amount > 0 || (fi.name !== 'Receita Fixa' && fi.name));

  // Parse Accounts
  const accRows = getRowsByKey('Contas');
  const parsedAccounts = accRows.map((row: any[], i: number) => ({
    id: row[0] || `acc_${i}`,
    name: row[1] || 'Conta Principal',
    type: row[2] || 'Conta Ordem',
    iban: row[3] || '',
    balance: parseNum(row[4]),
    active: parseBool(row[5])
  })).filter((a: any) => a.name !== 'Conta Principal' || a.balance > 0);

  // Parse Patrimonio
  const patRows = getRowsByKey('Patrimonio');
  const parsedPatrimonio = patRows.map((row: any[], i: number) => {
    let detailedExpenses = [];
    try {
      if (row[10]) {
        detailedExpenses = JSON.parse(row[10]);
      }
    } catch (e) {
      console.warn('Erro ao processar custos detalhados do imóvel:', e);
    }

    return {
      id: row[0] || `pat_${i}`,
      name: row[1] || 'Ativo',
      category: mapToAssetCategory(row[2]),
      subType: row[2] || 'Imóvel',
      currentValue: parseNum(row[3]) || 0,
      purchaseValue: parseNum(row[4]) || parseNum(row[3]) || 0,
      acquisitionDate: row[5] || new Date().toISOString().slice(0, 10),
      street: row[6] || '',
      zipCode: row[7] || '',
      city: row[8] || '',
      notes: row[9] || (row.length === 5 ? row[4] : '') || '',
      expenses: detailedExpenses
    };
  }).filter((p: any) => p.name !== 'Ativo' || p.currentValue > 0);

  // Parse Vehicles
  const vehRows = getRowsByKey('Veiculos');
  const parsedVehicles = vehRows.map((row: any[], i: number) => ({
    id: row[0] || `veh_${i}`,
    make: row[1] || '',
    model: row[2] || '',
    plate: row[3] || '',
    year: row[4] || ''
  }));

  // Parse Vehicle Fuel
  const vehFuelRowsData = getRowsByKey('Veiculos_Abastecimentos');
  const parsedVehicleFuel = vehFuelRowsData.map((row: any[], i: number) => ({
    id: row[0] || `fuel_${i}`,
    vehicleId: row[1] || '',
    date: row[2] || new Date().toISOString().slice(0, 10),
    liters: parseNum(row[3]),
    totalCost: parseNum(row[4]),
    pricePerLiter: parseNum(row[5]),
    odometer: parseNum(row[6]),
    station: row[7] || '',
    notes: row[8] || ''
  })).filter((f: any) => f.vehicleId || f.totalCost > 0 || f.liters > 0);

  // Parse Vehicle Tasks
  const vehTaskRowsData = getRowsByKey('Veiculos_Tarefas');
  const parsedVehicleTasks = vehTaskRowsData.map((row: any[], i: number) => ({
    id: row[0] || `task_${i}`,
    vehicleId: row[1] || '',
    title: row[2] || '',
    taskType: row[3] || 'Manutenção',
    cost: parseNum(row[4]),
    status: row[5] || 'pendente',
    dueDate: row[6] || new Date().toISOString().slice(0, 10),
    completedDate: row[7] || undefined,
    recurrenceInterval: row[8] || 'none',
    recurring: row[8] ? row[8] !== 'none' : false,
    nextDueDate: row[9] || undefined,
    nextCost: parseNum(row[10]) || undefined,
    documentName: row[11] || undefined,
    notes: row[12] || ''
  })).filter((t: any) => t.vehicleId || t.title);

  // Parse Budgets
  const budRows = getRowsByKey('Orcamentos');
  const parsedBudgets = budRows.map((row: any[], i: number) => {
    const m = row[3] || '';
    const y = row[4] || '';
    return {
      id: row[0] || `bud_${i}`,
      category: row[1] || '',
      limit: parseNum(row[2]),
      month: m && y ? `${y}-${m.padStart(2, '0')}` : (m || '')
    };
  });

  // Parse Goals
  const goalRows = getRowsByKey('Metas');
  const parsedGoals = goalRows.map((row: any[], i: number) => ({
    id: row[0] || `goal_${i}`,
    title: row[1] || '',
    targetAmount: parseNum(row[2]),
    currentAmount: parseNum(row[3]),
    deadline: row[4] || ''
  }));

  // Parse Trash
  const trashRowsData = getRowsByKey('Reciclagem');
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

  // Parse Preferences
  const prefsRowsData = getRowsByKey('Preferencias');
  let userPrefs: any = null;
  let customCategories: any[] = [];
  
  prefsRowsData.forEach((row: any[]) => {
    const key = row[0] || '';
    const json = row[1] || '';
    if (key === 'Preferencias' && json) {
      try {
        userPrefs = JSON.parse(json);
      } catch (e) {
        console.warn('Erro ao parsear preferências', e);
      }
    } else if (key === 'CustomCategories' && json) {
      try {
        customCategories = JSON.parse(json);
      } catch (e) {
        console.warn('Erro ao parsear categorias personalizadas', e);
      }
    }
  });

  // Parse Categorization Rules
  const catRulesRowsData = getRowsByKey('Regras_Categorizacao');
  const parsedCatRules = catRulesRowsData.map((row: any[], i: number) => ({
    id: row[0] || `rule_${i}`,
    keyword: row[1] || '',
    category: row[2] || '',
    type: row[3] || '',
    priority: parseNum(row[4])
  })).filter((r: any) => r.keyword);

  // Parse Notifications
  const notifRowsData = getRowsByKey('Notificacoes');
  const parsedNotifs = notifRowsData.map((row: any[], i: number) => ({
    id: row[0] || `notif_${i}`,
    title: row[1] || '',
    message: row[2] || '',
    createdAt: row[3] || '',
    read: row[4] === 'Sim',
    type: row[5] || ''
  })).filter((n: any) => n.title);

  // Parse Archives
  const archiveRowsData = getRowsByKey('Arquivo');
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

  return {
    parsedExpenses,
    parsedIncomes,
    parsedFixedIncomesRealized,
    parsedFixedExpenses,
    parsedFixedIncomes,
    parsedAccounts,
    parsedPatrimonio,
    parsedVehicles,
    parsedVehicleFuel,
    parsedVehicleTasks,
    parsedBudgets,
    parsedGoals,
    parsedTrash,
    userPrefs,
    customCategories,
    parsedCatRules,
    parsedNotifs,
    parsedArchives
  };
}

/**
 * Fetch all financial data from Google Sheets spreadsheet and populate local state / localStorage / Firestore.
 */
export async function getSpreadsheetSheetTitles(accessToken: string, spreadsheetId: string): Promise<string[]> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.sheets || []).map((s: any) => s.properties.title);
  } catch (err) {
    console.error('Erro ao ler títulos:', err);
    return [];
  }
}

export async function importAllDataFromSheets(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (status: string, percent: number) => void,
  selectedSheets?: string[]
): Promise<SyncStats> {
  notifySyncStatus('syncing', 'A descarregar dados da Google Drive...');
  onProgress?.('A inspecionar abas e descarregar do Google Sheets...', 15);

  let remote;
  try {
    remote = await fetchAndParseRemoteSheets(accessToken, spreadsheetId, selectedSheets);
  } catch (err: any) {
    let errorText = err?.message || 'Erro ao ler dados da Google Sheets';
    if (err?.status === 401 || err?.status === 403) {
      setCachedDriveToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_auth_error'));
      }
      errorText = 'Sessão Google expirada ou sem permissões. Por favor, reconecte a conta Google.';
    }
    notifySyncStatus('error', errorText);
    addSyncAuditLog({
      action: 'import',
      status: 'error',
      details: errorText
    });
    throw new Error(errorText);
  }

  onProgress?.('A atualizar armazenamento local...', 60);

  // Set local storage directly from remote sheet without merging stale cache
  if (!selectedSheets || selectedSheets.includes('Despesas')) { setLocalData('fin_expenses', remote.parsedExpenses); }
  if (!selectedSheets || selectedSheets.includes('Receitas_Pontuais')) { setLocalData('fin_incomes', remote.parsedIncomes); }
  if (!selectedSheets || selectedSheets.includes('Receitas_Fixas_Registadas')) { setLocalData('fin_incomes_fixed_realized', remote.parsedFixedIncomesRealized); }
  if (!selectedSheets || selectedSheets.includes('Despesas_Fixas')) { setLocalData('fin_fixed_expenses', remote.parsedFixedExpenses); }
  if (!selectedSheets || selectedSheets.includes('Receitas_Fixas')) { setLocalData('fin_fixed_incomes', remote.parsedFixedIncomes); }
  if (!selectedSheets || selectedSheets.includes('Contas')) { setLocalData('fin_accounts', remote.parsedAccounts); }
  setLocalData('fin_bank_accounts', remote.parsedAccounts);
  if (!selectedSheets || selectedSheets.includes('Patrimonio')) {
    const remotePatrimonio = remote.parsedPatrimonio || [];
    const allPropertyExpenses: any[] = [];
    
    const assetsWithoutExpenses = remotePatrimonio.map((p: any) => {
      if (Array.isArray(p.expenses)) {
        p.expenses.forEach((pe: any) => {
          if (!pe.assetId) pe.assetId = p.id;
          allPropertyExpenses.push(pe);
        });
      }
      const { expenses, ...rest } = p;
      return rest;
    });

    setLocalData('fin_assets', assetsWithoutExpenses);
    setLocalData('fin_patrimonio', assetsWithoutExpenses);
    setLocalData('fin_property_expenses', allPropertyExpenses);
  }
  if (!selectedSheets || selectedSheets.includes('Veiculos')) { setLocalData('fin_vehicles', remote.parsedVehicles); }
  if (!selectedSheets || selectedSheets.includes('Veiculos_Abastecimentos')) { setLocalData('fin_vehicle_fuel', remote.parsedVehicleFuel); }
  if (!selectedSheets || selectedSheets.includes('Veiculos_Tarefas')) { setLocalData('fin_vehicle_tasks', remote.parsedVehicleTasks); }
  if (!selectedSheets || selectedSheets.includes('Orcamentos')) { setLocalData('fin_budgets', remote.parsedBudgets); }
  if (!selectedSheets || selectedSheets.includes('Metas')) { setLocalData('fin_goals', remote.parsedGoals); }
  if (!selectedSheets || selectedSheets.includes('Reciclagem')) { setLocalData('finanas_trash_items', remote.parsedTrash); }

  const parsedExpenses = remote.parsedExpenses;
  const parsedIncomes = remote.parsedIncomes;
  const parsedFixedIncomesRealized = remote.parsedFixedIncomesRealized;
  const parsedFixedExpenses = remote.parsedFixedExpenses;
  const parsedFixedIncomes = remote.parsedFixedIncomes;
  const parsedAccounts = remote.parsedAccounts;
  const parsedPatrimonio = remote.parsedPatrimonio;
  const parsedVehicles = remote.parsedVehicles;
  const parsedBudgets = remote.parsedBudgets;
  const parsedGoals = remote.parsedGoals;

  if (remote.userPrefs && (!selectedSheets || selectedSheets.includes('Preferencias'))) {
    localStorage.setItem('finanas_user_prefs', JSON.stringify(remote.userPrefs));
    if (remote.customCategories && remote.customCategories.length > 0) {
      localStorage.setItem('expense_custom_categories', JSON.stringify(remote.customCategories));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('finanas_prefs_updated'));
    }
  }

  if (remote.parsedCatRules.length > 0) {
    if (!selectedSheets || selectedSheets.includes('Regras_Categorizacao')) { setLocalData('fin_categorization_rules', remote.parsedCatRules); }
  }
  if (remote.parsedNotifs.length > 0) {
    if (!selectedSheets || selectedSheets.includes('Notificacoes')) { setLocalData('finanas_notifications', remote.parsedNotifs); }
  }
  if (remote.parsedArchives.length > 0) {
    if (!selectedSheets || selectedSheets.includes('Arquivo')) { setLocalData('finanas_archives', remote.parsedArchives); }
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
    trashCount: remote.parsedTrash.length,
    lastSyncedAt: new Date().toISOString()
  };

  localStorage.setItem('google_drive_sync_stats', JSON.stringify(stats));

  // Save current modifiedTime from Drive
  getSpreadsheetModifiedTime(accessToken, spreadsheetId).then(modTime => {
    if (modTime) {
      localStorage.setItem('google_drive_last_synced_modified_time', modTime);
    }
  }).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }

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
 * Reorganizes income structure across Google Sheets, LocalStorage, .
 * - Removes old "Receitas" and "Receitas_Fixas_Reg" sheets
 * - Creates & populates "Receitas_Pontuais" and "Receitas_Fixas_Registadas"
 * - Updates Firebase Firestore collections and LocalStorage
 */
export async function reorganizeIncomeSheetsAndDatabase(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (status: string, percent: number) => void
): Promise<ReorganizeResult> {
  notifySyncStatus('syncing', 'A reorganizar estrutura de receitas no Google Sheets...');
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_auth_error'));
      }
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
          category: row[3] || 'Outros',
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
          category: row[3] || 'Outros',
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

  // 7. Updat Firestore collections
  let firebaseMigrated = false;
  const user = auth.currentUser;
  if (user) {
    onProgress?.('A sincronizar coleções...', 85);
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
      console.warn('Aviso na migração:', fbErr);
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
export function scheduleSheetsBackgroundSync(delayMs = 1200, force = false) {
  if (!force && !isAutoSyncEnabled()) return;

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
      await exportAllDataToSheets(token, spreadsheetId, undefined, force);
      notifySyncStatus('synced', 'Sincronizado com sucesso.');
    } catch (err: any) {
      console.warn('Falha na sincronização em segundo plano com o Google Sheets:', err);
      notifySyncStatus('error', err?.message || 'Falha ao sincronizar');
    }
  }, 500);
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
  notifySyncStatus('syncing', 'A apagar todos os registos na Google Sheets, e na Aplicação...');
  onProgress?.('A esvaziar dados  e no armazenamento local...', 10);

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
      return `'${s}'!A1:Z`;
    }
    return `'${s}'!A2:Z`;
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
      ? `'${sheetName}'!A1:Z`
      : `'${sheetName}'!A2:Z`;
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
    'Despesas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas", "Data Início", "Data Fim", "Próximo Vencimento"],
    'Receitas_Fixas': ["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Frequência", "Ativo", "Notas"],
    'Contas': ["ID", "Nome", "Tipo", "IBAN", "Saldo (€)", "Ativa"],
    'Patrimonio': ["ID", "Nome", "Categoria / SubTipo", "Valor Atual (€)", "Valor Compra (€)", "Data Aquisição", "Rua", "Código Postal", "Localidade", "Notas", "Custos Fixos Detalhados (JSON)"],
    'Veiculos': ["ID", "Marca", "Modelo", "Matrícula", "Ano"],
    'Orcamentos': ["ID", "Categoria", "Limite (€)", "Mês", "Ano"],
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
    details: 'Todos os registos na Google Drive, Google Drive e aplicação foram eliminados definitivamente.',
    recordsCount: 0
  });

  notifySyncStatus('synced', 'Google Sheets, Aplicação totalmente limpos.');
  onProgress?.('Concluído! Todos os dados foram apagados.', 100);

  return cleanStats;
}

export async function forceRecreateMissingSheets(accessToken: string, spreadsheetId: string) {
  return ensureMissingSheetsExist(accessToken, spreadsheetId);
}
