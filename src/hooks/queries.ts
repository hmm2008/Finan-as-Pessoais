import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { scheduleSheetsBackgroundSync, partitionIncomes, isFixedIncomeItem } from '../lib/googleSheetsDataService';
import { isBannedDemoRecord } from '../utils/cleanupDemoData';

// -----------------------------------------
// Helper: LocalStorage Initializers
// -----------------------------------------
// -----------------------------------------
// Helper: LocalStorage Initializers & Historical Multi-Month Seeding
// -----------------------------------------
const initLocalStorage = (key: string, initialData: any) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(initialData));
  }
};

initLocalStorage('fin_expenses', []);
initLocalStorage('fin_incomes', []);
initLocalStorage('fin_incomes_fixed_realized', []);
initLocalStorage('fin_fixed_expenses', []);
initLocalStorage('fin_fixed_incomes', []);
initLocalStorage('fin_assets', []);
initLocalStorage('fin_vehicles', []);
initLocalStorage('fin_vehicle_tasks', []);
initLocalStorage('fin_goals', []);
initLocalStorage('fin_budgets', []);
initLocalStorage('fin_categorization_rules', []);

// -----------------------------------------
// Helper: Synchronous Local-First Reader & Cloud Sync
// -----------------------------------------
export function sanitizeForFirestore<T>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj, (key, value) => (value === undefined ? null : value)));
}

export function getLocalEntityList<T>(localStorageKey: string): T[] {
  try {
    const raw = localStorage.getItem(localStorageKey);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      let modified = false;
      const sanitized = list.filter(item => !isBannedDemoRecord(item)).map((item: any) => {
        if (item && typeof item.date === 'string' && item.date.includes('2026-2026')) {
          modified = true;
          return { ...item, date: item.date.replace(/2026-2026-?/g, '2026-') };
        }
        return item;
      });
      if (sanitized.length !== list.length) modified = true;
      if (modified) {
        localStorage.setItem(localStorageKey, JSON.stringify(sanitized));
        return sanitized as T[];
      }
      return list as T[];
    }
    return [];
  } catch (e) {
    return [];
  }
}

async function getEntityList<T extends { id?: string }>(localStorageKey: string, firestoreCollectionName: string): Promise<T[]> {
  const user = auth.currentUser;
  
  // 1. Read local cache synchronously
  const localList = getLocalEntityList<T>(localStorageKey);

  // 2. If user is logged in, sync in background with a fast network timeout
  if (user) {
    try {
      const fetchPromise = (async () => {
        const cloudMap = new Map<string, T>();

        try {
          const q1 = query(collection(db, firestoreCollectionName), where('userId', '==', user.uid));
          const snap1 = await getDocs(q1);
          snap1.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            if (isBannedDemoRecord(data)) {
              deleteDoc(doc(db, firestoreCollectionName, docSnap.id)).catch(() => {});
            } else {
              cloudMap.set(docSnap.id, data as T);
            }
          });
        } catch (e1) {
          console.warn(`Firestore q1 query failed for ${firestoreCollectionName}`, e1);
        }

        try {
          const q2 = query(collection(db, firestoreCollectionName), where('created_by_id', '==', user.uid));
          const snap2 = await getDocs(q2);
          snap2.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            if (isBannedDemoRecord(data)) {
              deleteDoc(doc(db, firestoreCollectionName, docSnap.id)).catch(() => {});
            } else if (!cloudMap.has(docSnap.id)) {
              cloudMap.set(docSnap.id, data as T);
            }
          });
        } catch (e2) {
          console.warn(`Firestore q2 query failed for ${firestoreCollectionName}`, e2);
        }

        // BI-DIRECTIONAL SYNC: Upload local items that are missing from Firestore
        const pushPromises: Promise<void>[] = [];
        localList.forEach((locItem: any) => {
          if (locItem && locItem.id && !cloudMap.has(locItem.id) && !isBannedDemoRecord(locItem)) {
            cloudMap.set(locItem.id, locItem);
            const payload = sanitizeForFirestore({
              ...locItem,
              userId: user.uid,
              created_by_id: user.uid,
              createdAt: locItem.createdAt || new Date().toISOString()
            });
            pushPromises.push(
              setDoc(doc(db, firestoreCollectionName, locItem.id), payload, { merge: true }).catch(err => {
                console.warn(`Error auto-syncing local item ${locItem.id} to Firestore ${firestoreCollectionName}:`, err);
              })
            );
          }
        });

        if (pushPromises.length > 0) {
          await Promise.all(pushPromises);
        }

        const merged = Array.from(cloudMap.values());
        localStorage.setItem(localStorageKey, JSON.stringify(merged));
        return merged;
      })();

      // 3.5 second timeout to never block user render if Firestore network is slow
      const timeoutPromise = new Promise<T[]>((resolve) => 
        setTimeout(() => resolve(localList), 3500)
      );

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      console.warn(`Firestore read failed for ${firestoreCollectionName}, using local cache`, e);
      return localList;
    }
  }

  return localList;
}

async function saveEntity<T extends { id?: string }>(
  localStorageKey: string,
  firestoreCollectionName: string,
  item: T
): Promise<T> {
  const user = auth.currentUser;
  const id = item.id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const itemWithId = { ...item, id };

  // 1. Write to LocalStorage
  const raw = localStorage.getItem(localStorageKey);
  const currentList: T[] = raw ? JSON.parse(raw) : [];
  const filtered = currentList.filter((existing: any) => existing.id !== id);
  filtered.unshift(itemWithId);
  localStorage.setItem(localStorageKey, JSON.stringify(filtered));

  // 2. Write to Firestore if connected
  if (user) {
    try {
      const payload = sanitizeForFirestore({
        ...itemWithId,
        userId: user.uid,
        created_by_id: user.uid,
        createdAt: (itemWithId as any).createdAt || new Date().toISOString()
      });
      await setDoc(doc(db, firestoreCollectionName, id), payload, { merge: true });
    } catch (e) {
      console.warn(`Firestore create failed for ${firestoreCollectionName}, saved locally:`, e);
    }
  }

  // 3. Trigger Google Sheets Auto-Sync (Phase 3)
  scheduleSheetsBackgroundSync();

  return itemWithId;
}

async function updateEntity<T extends { id: string }>(
  localStorageKey: string,
  firestoreCollectionName: string,
  item: T
): Promise<T> {
  const user = auth.currentUser;

  // 1. Write to LocalStorage
  const raw = localStorage.getItem(localStorageKey);
  let currentList: T[] = raw ? JSON.parse(raw) : [];
  const exists = currentList.some(existing => existing.id === item.id);
  if (exists) {
    currentList = currentList.map(existing => existing.id === item.id ? { ...existing, ...item } : existing);
  } else {
    currentList = [item, ...currentList];
  }
  localStorage.setItem(localStorageKey, JSON.stringify(currentList));

  // 2. Write to Firestore if connected
  if (user) {
    try {
      const docRef = doc(db, firestoreCollectionName, item.id);
      const payload = sanitizeForFirestore({
        ...item,
        userId: user.uid,
        created_by_id: user.uid,
        updatedAt: new Date().toISOString()
      });
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn(`Firestore update failed for ${firestoreCollectionName}, updated locally:`, e);
    }
  }

  // 3. Trigger Google Sheets Auto-Sync (Phase 3)
  scheduleSheetsBackgroundSync();

  return item;
}

async function deleteEntity(
  localStorageKey: string,
  firestoreCollectionName: string,
  id: string
): Promise<string> {
  const user = auth.currentUser;

  // 1. Write to LocalStorage
  const raw = localStorage.getItem(localStorageKey);
  let currentList: any[] = raw ? JSON.parse(raw) : [];
  currentList = currentList.filter(item => item.id !== id);
  localStorage.setItem(localStorageKey, JSON.stringify(currentList));

  // 2. Write to Firestore if connected
  if (user) {
    (async () => {
      try {
        const docRef = doc(db, firestoreCollectionName, id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn(`Firestore delete failed for ${firestoreCollectionName}, deleted locally`, e);
      }
    })();
  }

  // 3. Trigger Google Sheets Auto-Sync (Phase 3)
  scheduleSheetsBackgroundSync();

  return id;
}

// -----------------------------------------
// 1. Expenses Hook (useExpenses)
// -----------------------------------------
export function useExpenses() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['expenses'],
    queryFn: () => getEntityList<any>('fin_expenses', 'expenses'),
    initialData: () => getLocalEntityList<any>('fin_expenses'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newExp: any) => saveEntity<any>('fin_expenses', 'expenses', newExp),
    onSuccess: (data) => queryClient.setQueryData(['expenses'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedExp: any) => updateEntity<any>('fin_expenses', 'expenses', updatedExp),
    onSuccess: (data, variables) => queryClient.setQueryData(['expenses'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_expenses', 'expenses', id),
    onSuccess: (_, id) => queryClient.setQueryData(['expenses'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    expenses: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addExpense: addMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 2. Incomes Hook (useIncomes)
// -----------------------------------------
export function useIncomes() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['incomes_combined'],
    queryFn: async () => {
      const punctual = await getEntityList<any>('fin_incomes', 'incomes');
      const fixedRealized = await getEntityList<any>('fin_incomes_fixed_realized', 'incomes_fixed_realized');
      
      const { punctual: cleanPunctual, fixedRealized: cleanFixedRealized } = partitionIncomes([
        ...punctual,
        ...fixedRealized
      ]);

      // Sync cleaned lists back to LocalStorage
      localStorage.setItem('fin_incomes', JSON.stringify(cleanPunctual));
      localStorage.setItem('fin_incomes_fixed_realized', JSON.stringify(cleanFixedRealized));

      const combined = [...cleanPunctual, ...cleanFixedRealized];
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    initialData: () => {
      const punctual = getLocalEntityList<any>('fin_incomes');
      const fixedRealized = getLocalEntityList<any>('fin_incomes_fixed_realized');
      const { punctual: cleanPunctual, fixedRealized: cleanFixedRealized } = partitionIncomes([
        ...punctual,
        ...fixedRealized
      ]);
      const combined = [...cleanPunctual, ...cleanFixedRealized];
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: async (newInc: any) => {
      const isFixed = isFixedIncomeItem(newInc);
      if (isFixed) {
        const itemToSave = { ...newInc, isFixed: true };
        const saved = await saveEntity<any>('fin_incomes_fixed_realized', 'incomes_fixed_realized', itemToSave);
        // Also mirror to incomes_fixed_registered for compatibility
        const user = auth.currentUser;
        if (user) {
          setDoc(doc(db, 'incomes_fixed_registered', saved.id), { ...saved, userId: user.uid, created_by_id: user.uid }).catch(() => {});
        }
        return saved;
      } else {
        const itemToSave = { ...newInc, isFixed: false };
        const saved = await saveEntity<any>('fin_incomes', 'incomes', itemToSave);
        // Also mirror to incomes_punctual for compatibility
        const user = auth.currentUser;
        if (user) {
          setDoc(doc(db, 'incomes_punctual', saved.id), { ...saved, userId: user.uid, created_by_id: user.uid }).catch(() => {});
        }
        return saved;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['incomes_combined'], (old: any) => [data, ...(old || [])]);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedInc: any) => {
      const isFixed = isFixedIncomeItem(updatedInc);
      if (isFixed) {
        // Remove from punctual local list if it was previously there
        const rawPunctual = localStorage.getItem('fin_incomes');
        if (rawPunctual) {
          const list = JSON.parse(rawPunctual).filter((item: any) => item.id !== updatedInc.id);
          localStorage.setItem('fin_incomes', JSON.stringify(list));
        }
        const updated = await updateEntity<any>('fin_incomes_fixed_realized', 'incomes_fixed_realized', { ...updatedInc, isFixed: true });
        const user = auth.currentUser;
        if (user) {
          setDoc(doc(db, 'incomes_fixed_registered', updated.id), { ...updated, userId: user.uid, created_by_id: user.uid }, { merge: true }).catch(() => {});
          deleteDoc(doc(db, 'incomes_punctual', updated.id)).catch(() => {});
          deleteDoc(doc(db, 'incomes', updated.id)).catch(() => {});
        }
        return updated;
      } else {
        // Remove from fixed local list if it was previously there
        const rawFixed = localStorage.getItem('fin_incomes_fixed_realized');
        if (rawFixed) {
          const list = JSON.parse(rawFixed).filter((item: any) => item.id !== updatedInc.id);
          localStorage.setItem('fin_incomes_fixed_realized', JSON.stringify(list));
        }
        const updated = await updateEntity<any>('fin_incomes', 'incomes', { ...updatedInc, isFixed: false });
        const user = auth.currentUser;
        if (user) {
          setDoc(doc(db, 'incomes_punctual', updated.id), { ...updated, userId: user.uid, created_by_id: user.uid }, { merge: true }).catch(() => {});
          deleteDoc(doc(db, 'incomes_fixed_registered', updated.id)).catch(() => {});
          deleteDoc(doc(db, 'incomes_fixed_realized', updated.id)).catch(() => {});
        }
        return updated;
      }
    },
    onSuccess: (data, variables) => {
      const targetId = data?.id || variables?.id;
      queryClient.setQueryData(['incomes_combined'], (old: any) => {
        if (!old || !Array.isArray(old)) return [data || variables];
        const exists = old.some((item: any) => item.id === targetId);
        if (exists) {
          return old.map((item: any) => item.id === targetId ? { ...item, ...data, ...variables } : item);
        }
        return [{ ...data, ...variables }, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['incomes_combined'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteEntity('fin_incomes_fixed_realized', 'incomes_fixed_realized', id);
      await deleteEntity('fin_incomes', 'incomes', id);
      const user = auth.currentUser;
      if (user) {
        deleteDoc(doc(db, 'incomes_fixed_registered', id)).catch(() => {});
        deleteDoc(doc(db, 'incomes_punctual', id)).catch(() => {});
      }
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['incomes_combined'], (old: any) => (old || []).filter((item: any) => item.id !== id));
    }
  });

  return {
    incomes: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addIncome: addMutation.mutateAsync,
    updateIncome: updateMutation.mutateAsync,
    deleteIncome: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 3. Fixed Expenses Hook (useFixedExpenses)
// -----------------------------------------
export function useFixedExpenses() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['fixedExpenses'],
    queryFn: () => getEntityList<any>('fin_fixed_expenses', 'fixed_expenses'),
    initialData: () => getLocalEntityList<any>('fin_fixed_expenses'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newFE: any) => saveEntity<any>('fin_fixed_expenses', 'fixed_expenses', newFE),
    onSuccess: (data) => queryClient.setQueryData(['fixedExpenses'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedFE: any) => updateEntity<any>('fin_fixed_expenses', 'fixed_expenses', updatedFE),
    onSuccess: (data, variables) => queryClient.setQueryData(['fixedExpenses'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_fixed_expenses', 'fixed_expenses', id),
    onSuccess: (_, id) => queryClient.setQueryData(['fixedExpenses'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    fixedExpenses: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addFixedExpense: addMutation.mutateAsync,
    updateFixedExpense: updateMutation.mutateAsync,
    deleteFixedExpense: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 4. Fixed Incomes Hook (useFixedIncomes)
// -----------------------------------------
export function useFixedIncomes() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['fixedIncomes'],
    queryFn: () => getEntityList<any>('fin_fixed_incomes', 'fixed_incomes'),
    initialData: () => getLocalEntityList<any>('fin_fixed_incomes'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newFI: any) => saveEntity<any>('fin_fixed_incomes', 'fixed_incomes', newFI),
    onSuccess: (data) => queryClient.setQueryData(['fixedIncomes'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedFI: any) => updateEntity<any>('fin_fixed_incomes', 'fixed_incomes', updatedFI),
    onSuccess: (data, variables) => queryClient.setQueryData(['fixedIncomes'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_fixed_incomes', 'fixed_incomes', id),
    onSuccess: (_, id) => queryClient.setQueryData(['fixedIncomes'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    fixedIncomes: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addFixedIncome: addMutation.mutateAsync,
    updateFixedIncome: updateMutation.mutateAsync,
    deleteFixedIncome: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 5. Assets Hook (useAssets)
// -----------------------------------------
export function useAssets() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['assets'],
    queryFn: () => getEntityList<any>('fin_assets', 'assets'),
    initialData: () => getLocalEntityList<any>('fin_assets'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newAsset: any) => saveEntity<any>('fin_assets', 'assets', newAsset),
    onSuccess: (data) => queryClient.setQueryData(['assets'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedAsset: any) => updateEntity<any>('fin_assets', 'assets', updatedAsset),
    onSuccess: (data, variables) => queryClient.setQueryData(['assets'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_assets', 'assets', id),
    onSuccess: (_, id) => queryClient.setQueryData(['assets'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    assets: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addAsset: addMutation.mutateAsync,
    updateAsset: updateMutation.mutateAsync,
    deleteAsset: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 6. Vehicles Hook (useVehicles)
// -----------------------------------------
export function useVehicles() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => getEntityList<any>('fin_vehicles', 'vehicles'),
    initialData: () => getLocalEntityList<any>('fin_vehicles'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newVeh: any) => saveEntity<any>('fin_vehicles', 'vehicles', newVeh),
    onSuccess: (data) => queryClient.setQueryData(['vehicles'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedVeh: any) => updateEntity<any>('fin_vehicles', 'vehicles', updatedVeh),
    onSuccess: (data, variables) => queryClient.setQueryData(['vehicles'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_vehicles', 'vehicles', id),
    onSuccess: (_, id) => queryClient.setQueryData(['vehicles'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    vehicles: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addVehicle: addMutation.mutateAsync,
    updateVehicle: updateMutation.mutateAsync,
    deleteVehicle: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 7. Vehicle Tasks Hook (useVehicleTasks)
// -----------------------------------------
export function useVehicleTasks() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['vehicleTasks'],
    queryFn: () => getEntityList<any>('fin_vehicle_tasks', 'vehicle_tasks'),
    initialData: () => getLocalEntityList<any>('fin_vehicle_tasks'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newTask: any) => saveEntity<any>('fin_vehicle_tasks', 'vehicle_tasks', newTask),
    onSuccess: (data) => queryClient.setQueryData(['vehicleTasks'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedTask: any) => updateEntity<any>('fin_vehicle_tasks', 'vehicle_tasks', updatedTask),
    onSuccess: (data, variables) => queryClient.setQueryData(['vehicleTasks'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_vehicle_tasks', 'vehicle_tasks', id),
    onSuccess: (_, id) => queryClient.setQueryData(['vehicleTasks'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    vehicleTasks: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addVehicleTask: addMutation.mutateAsync,
    updateVehicleTask: updateMutation.mutateAsync,
    deleteVehicleTask: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 8. Goals Hook (useGoals)
// -----------------------------------------
export function useGoals() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['goals'],
    queryFn: () => getEntityList<any>('fin_goals', 'goals'),
    initialData: () => getLocalEntityList<any>('fin_goals'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newGoal: any) => saveEntity<any>('fin_goals', 'goals', newGoal),
    onSuccess: (data) => queryClient.setQueryData(['goals'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedGoal: any) => updateEntity<any>('fin_goals', 'goals', updatedGoal),
    onSuccess: (data, variables) => queryClient.setQueryData(['goals'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_goals', 'goals', id),
    onSuccess: (_, id) => queryClient.setQueryData(['goals'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    goals: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addGoal: addMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 9. Budgets Hook (useBudgets)
// -----------------------------------------
export function useBudgets() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['budgets'],
    queryFn: () => getEntityList<any>('fin_budgets', 'budgets'),
    initialData: () => getLocalEntityList<any>('fin_budgets'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newBudget: any) => saveEntity<any>('fin_budgets', 'budgets', newBudget),
    onSuccess: (data) => queryClient.setQueryData(['budgets'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedBudget: any) => updateEntity<any>('fin_budgets', 'budgets', updatedBudget),
    onSuccess: (data, variables) => queryClient.setQueryData(['budgets'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_budgets', 'budgets', id),
    onSuccess: (_, id) => queryClient.setQueryData(['budgets'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    budgets: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addBudget: addMutation.mutateAsync,
    updateBudget: updateMutation.mutateAsync,
    deleteBudget: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 10. Notifications Hook (useNotifications)
// -----------------------------------------
export function useNotifications() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getEntityList<any>('finanas_notifications', 'notifications'),
    initialData: () => getLocalEntityList<any>('finanas_notifications'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newNotif: any) => saveEntity<any>('finanas_notifications', 'notifications', newNotif),
    onSuccess: (data) => queryClient.setQueryData(['notifications'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedNotif: any) => updateEntity<any>('finanas_notifications', 'notifications', updatedNotif),
    onSuccess: (data, variables) => queryClient.setQueryData(['notifications'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('finanas_notifications', 'notifications', id),
    onSuccess: (_, id) => queryClient.setQueryData(['notifications'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    notifications: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addNotification: addMutation.mutateAsync,
    updateNotification: updateMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 11. Trash Hook (useTrash)
// -----------------------------------------
export function useTrash() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['trash'],
    queryFn: () => getEntityList<any>('finanas_trash_items', 'trash'),
    initialData: () => getLocalEntityList<any>('finanas_trash_items'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newItem: any) => saveEntity<any>('finanas_trash_items', 'trash', newItem),
    onSuccess: (data) => queryClient.setQueryData(['trash'], (old: any) => [data, ...(old || [])])
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('finanas_trash_items', 'trash', id),
    onSuccess: (_, id) => queryClient.setQueryData(['trash'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    trashItems: queryResult.data || [],
    isLoading: queryResult.isLoading,
    moveToTrash: addMutation.mutateAsync,
    permanentDelete: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 12. Archive Hook (useArchive)
// -----------------------------------------
export function useArchive() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['archives'],
    queryFn: () => getEntityList<any>('finanas_archives', 'archives'),
    initialData: () => getLocalEntityList<any>('finanas_archives'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newArchive: any) => saveEntity<any>('finanas_archives', 'archives', newArchive),
    onSuccess: (data) => queryClient.setQueryData(['archives'], (old: any) => [data, ...(old || [])])
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('finanas_archives', 'archives', id),
    onSuccess: (_, id) => queryClient.setQueryData(['archives'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    archives: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addArchive: addMutation.mutateAsync,
    deleteArchive: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// 13. Categorization Rules Hook (useCategorizationRules)
// -----------------------------------------
export function useCategorizationRules() {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['categorizationRules'],
    queryFn: () => getEntityList<any>('fin_categorization_rules', 'categorization_rules'),
    initialData: () => getLocalEntityList<any>('fin_categorization_rules'),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: (newRule: any) => saveEntity<any>('fin_categorization_rules', 'categorization_rules', newRule),
    onSuccess: (data) => queryClient.setQueryData(['categorizationRules'], (old: any) => [data, ...(old || [])])
  });

  const updateMutation = useMutation({
    mutationFn: (updatedRule: any) => updateEntity<any>('fin_categorization_rules', 'categorization_rules', updatedRule),
    onSuccess: (data, variables) => queryClient.setQueryData(['categorizationRules'], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity('fin_categorization_rules', 'categorization_rules', id),
    onSuccess: (_, id) => queryClient.setQueryData(['categorizationRules'], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });

  return {
    categorizationRules: queryResult.data || [],
    isLoading: queryResult.isLoading,
    addRule: addMutation.mutateAsync,
    updateRule: updateMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync
  };
}

// -----------------------------------------
// Helper: Global Cloud Migration & Sweep
// -----------------------------------------
export async function syncAllLocalEntitiesToFirestore(userUid: string): Promise<void> {
  if (!userUid) return;

  const mappings: { storageKey: string; collectionName: string }[] = [
    { storageKey: 'fin_expenses', collectionName: 'expenses' },
    { storageKey: 'fin_incomes', collectionName: 'incomes' },
    { storageKey: 'fin_incomes_fixed_realized', collectionName: 'incomes_fixed_realized' },
    { storageKey: 'fin_fixed_expenses', collectionName: 'fixed_expenses' },
    { storageKey: 'fin_fixed_incomes', collectionName: 'fixed_incomes' },
    { storageKey: 'fin_assets', collectionName: 'assets' },
    { storageKey: 'fin_vehicles', collectionName: 'vehicles' },
    { storageKey: 'fin_vehicle_tasks', collectionName: 'vehicle_tasks' },
    { storageKey: 'fin_goals', collectionName: 'goals' },
    { storageKey: 'fin_budgets', collectionName: 'budgets' },
    { storageKey: 'fin_categorization_rules', collectionName: 'categorization_rules' },
    { storageKey: 'finanas_trash_items', collectionName: 'trash' },
    { storageKey: 'finanas_archives', collectionName: 'archives' },
  ];

  for (const { storageKey, collectionName } of mappings) {
    try {
      const localItems = getLocalEntityList<any>(storageKey);
      if (localItems && localItems.length > 0) {
        const batchPromises = localItems.map(item => {
          if (!item || !item.id || isBannedDemoRecord(item)) return Promise.resolve();
          const payload = sanitizeForFirestore({
            ...item,
            userId: userUid,
            created_by_id: userUid,
            createdAt: item.createdAt || new Date().toISOString()
          });
          return setDoc(doc(db, collectionName, item.id), payload, { merge: true }).catch(err => {
            console.warn(`Error syncing local item ${item.id} to Firestore collection ${collectionName}:`, err);
          });
        });
        await Promise.all(batchPromises);
      }
    } catch (err) {
      console.warn(`Error during sync for ${storageKey}:`, err);
    }
  }
}

