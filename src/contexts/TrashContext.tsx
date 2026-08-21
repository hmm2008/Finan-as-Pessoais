import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sanitizeForFirestore } from '../hooks/queries';

export interface TrashItem {
  id: string; // Unique trash record ID
  entityName: string; // Entity grouping (e.g. 'Movimentos', 'Orçamentos', 'Objetivos', 'Veículos', 'Património')
  entityId: string; // Original ID of the entity
  data: any; // Full data payload for restoring
  label: string; // Human-readable title
  deletedAt: string; // ISO date string
}

interface TrashContextType {
  trashItems: TrashItem[];
  moveToTrash: (entityName: string, entityId: string, data: any, label: string) => void;
  restoreFromTrash: (trashId: string) => TrashItem | undefined;
  permanentDelete: (trashId: string) => void;
  emptyTrash: () => void;
}

const INITIAL_TRASH: TrashItem[] = [];

function normalizeTrashItem(item: any, index: number): TrashItem {
  if (!item || typeof item !== 'object') {
    return {
      id: `trash_${Date.now()}_${index}`,
      entityName: 'Outros',
      entityId: `item_${index}`,
      data: {},
      label: 'Registo',
      deletedAt: new Date().toISOString()
    };
  }

  const entityName = item.entityName || (item.originalType === 'expense' ? 'Movimentos' : item.originalType === 'income' ? 'Receitas' : (item.amount !== undefined ? 'Movimentos' : 'Outros'));
  const label = item.label || item.data?.description || item.data?.category || item.category || item.description || item.name || item.entity || (item.amount !== undefined ? `Movimento (${item.amount}€)` : 'Registo');
  const entityId = item.entityId || item.id || `item_${index}`;
  const data = item.data || item;
  const deletedAt = item.deletedAt || new Date().toISOString();
  const id = (item.id && typeof item.id === 'string' && item.id.startsWith('trash_')) 
    ? item.id 
    : `trash_${item.id || Date.now()}_${index}`;

  return {
    id,
    entityName,
    entityId,
    data,
    label,
    deletedAt
  };
}

const TrashContext = createContext<TrashContextType | undefined>(undefined);

export function TrashProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    const saved = localStorage.getItem('finanas_trash_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item, idx) => normalizeTrashItem(item, idx));
        }
      } catch (e) {
        console.error('Failed to parse saved trash items', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('finanas_trash_items', JSON.stringify(trashItems));
  }, [trashItems]);

  const moveToTrash = (entityName: string, entityId: string, data: any, label: string) => {
    const safeEntityName = entityName || 'Outros';
    const safeLabel = label || data?.description || data?.category || data?.name || data?.entity || (data?.amount ? `Registo (${data.amount}€)` : 'Registo');
    const newItem: TrashItem = {
      id: `trash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      entityName: safeEntityName,
      entityId: entityId || data?.id || `id_${Date.now()}`,
      data: data || {},
      label: safeLabel,
      deletedAt: new Date().toISOString()
    };
    setTrashItems(prev => [newItem, ...(prev || [])]);
  };

  const restoreFromTrash = (trashId: string): TrashItem | undefined => {
    const item = trashItems.find(t => t.id === trashId);
    if (item) {
      setTrashItems(prev => prev.filter(t => t.id !== trashId));

      if (item.data) {
        let storageKey = '';
        let collectionName = '';
        let queryKey = '';

        const entity = (item.entityName || '').toLowerCase();

        if (entity.includes('receita') && entity.includes('fixa')) {
          storageKey = 'fin_fixed_incomes';
          collectionName = 'fixed_incomes';
          queryKey = 'fixedIncomes';
        } else if (entity.includes('despesa') && entity.includes('fixa')) {
          storageKey = 'fin_fixed_expenses';
          collectionName = 'fixed_expenses';
          queryKey = 'fixedExpenses';
        } else if (entity.includes('despesa') || entity.includes('movimento')) {
          if (item.data.type === 'income' || item.data.incomeType) {
            if (item.data.isFixed || item.data.fixedIncomeId) {
              storageKey = 'fin_incomes_fixed_realized';
              collectionName = 'incomes_fixed_realized';
            } else {
              storageKey = 'fin_incomes';
              collectionName = 'incomes';
            }
            queryKey = 'incomes_combined';
          } else {
            storageKey = 'fin_expenses';
            collectionName = 'expenses';
            queryKey = 'expenses';
          }
        } else if (entity.includes('receita')) {
          if (item.data.isFixed || item.data.fixedIncomeId) {
            storageKey = 'fin_incomes_fixed_realized';
            collectionName = 'incomes_fixed_realized';
          } else {
            storageKey = 'fin_incomes';
            collectionName = 'incomes';
          }
          queryKey = 'incomes_combined';
        } else if (entity.includes('orçamento') || entity.includes('orcamento')) {
          storageKey = 'fin_budgets';
          collectionName = 'budgets';
          queryKey = 'budgets';
        } else if (entity.includes('objetivo') || entity.includes('meta')) {
          storageKey = 'fin_goals';
          collectionName = 'goals';
          queryKey = 'goals';
        } else if (entity.includes('veículo') || entity.includes('veiculo') || entity.includes('viatura')) {
          storageKey = 'fin_vehicles';
          collectionName = 'vehicles';
          queryKey = 'vehicles';
        } else if (entity.includes('património') || entity.includes('patrimonio') || entity.includes('ativo') || entity.includes('asset')) {
          storageKey = 'fin_assets';
          collectionName = 'assets';
          queryKey = 'assets';
        }

        if (storageKey) {
          try {
            const raw = localStorage.getItem(storageKey);
            const list = raw ? JSON.parse(raw) : [];
            if (!list.some((existing: any) => existing.id === item.data.id)) {
              list.unshift(item.data);
              localStorage.setItem(storageKey, JSON.stringify(list));
            }
            if (queryKey) {
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            }
          } catch (e) {
            console.error('Error restoring item to localStorage:', e);
          }

          // Sync to sheets
          const { scheduleSheetsBackgroundSync } = require('../lib/googleSheetsDataService');
          scheduleSheetsBackgroundSync();
        }
      }
    }
    return item;
  };

  const permanentDelete = (trashId: string) => {
    setTrashItems(prev => prev.filter(t => t.id !== trashId));
  };

  const emptyTrash = () => {
    setTrashItems([]);
  };

  return (
    <TrashContext.Provider
      value={{
        trashItems,
        moveToTrash,
        restoreFromTrash,
        permanentDelete,
        emptyTrash
      }}
    >
      {children}
    </TrashContext.Provider>
  );
}

export function useTrash() {
  const context = useContext(TrashContext);
  if (!context) {
    throw new Error('useTrash must be used within a TrashProvider');
  }
  return context;
}
