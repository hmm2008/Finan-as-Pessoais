import { db, auth } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

const BANNED_PATTERNS = [
  /millennium/i,
  /conta\s*(à\s*)?ordem/i,
  /fundo\s*oportunidades/i,
  /oportunidades/i,
  /s&p\s*500/i,
  /ações\s*s&p/i
];

export function isBannedDemoRecord(item: any): boolean {
  if (!item) return false;
  const targetObj = item.data ? item.data : item;
  
  const fields = [
    targetObj.name,
    targetObj.title,
    targetObj.description,
    targetObj.category,
    targetObj.institution,
    targetObj.subType,
    targetObj.label
  ].filter(Boolean).map(s => String(s));

  return fields.some(text => BANNED_PATTERNS.some(pattern => pattern.test(text)));
}

const LOCAL_STORAGE_KEYS = [
  'fin_assets',
  'fin_patrimonio',
  'fin_expenses',
  'fin_incomes',
  'fin_incomes_fixed_realized',
  'fin_fixed_expenses',
  'fin_fixed_incomes',
  'fin_goals',
  'fin_budgets',
  'fin_vehicles',
  'fin_vehicle_tasks',
  'finanas_trash_items'
];

const FIRESTORE_COLLECTIONS = [
  'assets',
  'accounts',
  'expenses',
  'incomes',
  'incomes_fixed_realized',
  'fixed_expenses',
  'fixed_incomes',
  'goals',
  'budgets',
  'vehicles',
  'vehicle_tasks'
];

export async function purgeDemoRecordsFromLocalAndFirebase(): Promise<{ purgedLocal: number; purgedFirebase: number }> {
  let purgedLocal = 0;
  let purgedFirebase = 0;

  // 1. Clean LocalStorage
  LOCAL_STORAGE_KEYS.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter(item => {
            const banned = isBannedDemoRecord(item);
            if (banned) purgedLocal++;
            return !banned;
          });
          if (filtered.length !== list.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      }
    } catch (e) {
      console.warn(`Error cleaning LocalStorage key ${key}:`, e);
    }
  });

  // 2. Clean Firestore if user authenticated
  const user = auth.currentUser;
  if (user) {
    for (const collName of FIRESTORE_COLLECTIONS) {
      try {
        const q = query(collection(db, collName), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (isBannedDemoRecord({ id: docSnap.id, ...data })) {
            await deleteDoc(doc(db, collName, docSnap.id));
            purgedFirebase++;
          }
        }
      } catch (e) {
        console.warn(`Error cleaning Firestore collection ${collName}:`, e);
      }

      try {
        const q2 = query(collection(db, collName), where('created_by_id', '==', user.uid));
        const snap2 = await getDocs(q2);
        for (const docSnap of snap2.docs) {
          const data = docSnap.data();
          if (isBannedDemoRecord({ id: docSnap.id, ...data })) {
            await deleteDoc(doc(db, collName, docSnap.id));
            purgedFirebase++;
          }
        }
      } catch (e2) {
        // Ignore duplicate queries
      }
    }
  }

  return { purgedLocal, purgedFirebase };
}

// Run local cleanup immediately upon file import
purgeDemoRecordsFromLocalAndFirebase().catch(() => {});
