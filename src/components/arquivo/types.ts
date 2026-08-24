export type DocumentType = 'pdf' | 'image' | 'doc' | 'archive' | 'backup';
export type DocumentSource = 'despesas' | 'assets' | 'vehicle_tasks' | 'archives' | 'backup';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  source: DocumentSource;
  sourceLabel: string;
  url: string;
  size: string; // e.g. "1.2 MB"
  createdAt: string; // YYYY-MM-DD or ISO
  entityId?: string;
  isPrivate?: boolean;
  dataPayload?: any; // For backup files
}

export interface BackupPayload {
  version: string;
  timestamp: string;
  entities: {
    transactions?: any[];
    budgets?: any[];
    goals?: any[];
    vehicles?: any[];
    preferences?: any;
    trash?: any[];
  };
}
