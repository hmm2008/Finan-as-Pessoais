import { DocumentItem } from '../components/arquivo/types';

/**
 * Generates a full system JSON backup containing all local financial data entities,
 * triggers browser download, and returns a DocumentItem wrapper.
 */
export function archiveBackup(): DocumentItem {
  const data: Record<string, any> = {};

  const keys = [
    'fin_prefs',
    'finanas_trash_items',
    'finanas_notifications',
    'finanas_archives',
    'finanas_custom_payment_methods',
    'fin_expenses',
    'fin_incomes',
    'fin_incomes_fixed_realized',
    'fin_fixed_expenses',
    'fin_fixed_incomes',
    'fin_assets',
    'fin_vehicles',
    'fin_vehicle_tasks',
    'fin_goals',
    'fin_budgets',
    'fin_categorization_rules',
    'fin_app_logs'
  ];

  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
      }
    } catch (e) {
      console.warn(`Could not backup key: ${key}`, e);
    }
  });

  const payload = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    data
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const fileName = `Backup_Financas_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();

  const docItem: DocumentItem = {
    id: `doc_backup_${Date.now()}`,
    name: fileName,
    type: 'backup',
    source: 'backup',
    sourceLabel: 'Cópia de Segurança Completa',
    url: url,
    size: `${(blob.size / 1024).toFixed(1)} KB`,
    createdAt: new Date().toISOString().split('T')[0],
    dataPayload: payload
  };

  return docItem;
}
