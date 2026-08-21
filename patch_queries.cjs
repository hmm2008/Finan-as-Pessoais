const fs = require('fs');
const content = fs.readFileSync('src/hooks/queries.ts', 'utf-8');

// Replace the top imports
let newContent = content.replace(/import \{ collection, getDocs, setDoc, updateDoc, deleteDoc, doc, query, where \} from 'firebase\/firestore';\n/, '');
newContent = newContent.replace(/import \{ db, auth \} from '\.\.\/lib\/firebase';\n/, "import { auth } from '../lib/firebase';\n");

// Replace getEntityList
newContent = newContent.replace(/async function getEntityList<T extends \{ id\?: string \}>\([\s\S]*?async function saveEntity/m, `async function getEntityList<T extends { id?: string }>(localStorageKey: string, firestoreCollectionName: string): Promise<T[]> {
  const localList = getLocalEntityList<T>(localStorageKey);
  return localList;
}

async function saveEntity`);

// Replace saveEntity
newContent = newContent.replace(/async function saveEntity<T>\([\s\S]*?async function updateEntity/m, `async function saveEntity<T>(
  localStorageKey: string,
  firestoreCollectionName: string,
  item: T
): Promise<T> {
  const user = auth.currentUser;
  const itemWithId = {
    ...item,
    id: (item as any).id || Date.now().toString(),
  };

  const currentList = getLocalEntityList<T>(localStorageKey);
  const updatedList = [itemWithId, ...currentList];
  localStorage.setItem(localStorageKey, JSON.stringify(updatedList));

  // Trigger Google Sheets sync
  scheduleSheetsBackgroundSync();

  return itemWithId;
}

async function updateEntity`);

// Replace updateEntity
newContent = newContent.replace(/async function updateEntity<T extends \{ id: string \}>\([\s\S]*?async function deleteEntity/m, `async function updateEntity<T extends { id: string }>(
  localStorageKey: string,
  firestoreCollectionName: string,
  item: T
): Promise<T> {
  const user = auth.currentUser;
  const currentList = getLocalEntityList<T>(localStorageKey);
  const updatedList = currentList.map((existing: any) =>
    existing.id === item.id ? { ...existing, ...item } : existing
  );
  localStorage.setItem(localStorageKey, JSON.stringify(updatedList));

  // Trigger Google Sheets sync
  scheduleSheetsBackgroundSync();

  return item;
}

async function deleteEntity`);

// Replace deleteEntity
newContent = newContent.replace(/async function deleteEntity\([\s\S]*?\/\/ -----------------------------------------/m, `async function deleteEntity(
  localStorageKey: string,
  firestoreCollectionName: string,
  id: string
): Promise<string> {
  const user = auth.currentUser;
  const currentList = getLocalEntityList<any>(localStorageKey);
  const filtered = currentList.filter((existing: any) => existing.id !== id);
  localStorage.setItem(localStorageKey, JSON.stringify(filtered));

  // Trigger Google Sheets sync
  scheduleSheetsBackgroundSync();

  return id;
}

// -----------------------------------------`);

// Replace syncAllLocalEntitiesToFirestore
newContent = newContent.replace(/export async function syncAllLocalEntitiesToFirestore\(userUid: string\): Promise<void> \{[\s\S]*?\}\n\}/m, `export async function syncAllLocalEntitiesToFirestore(userUid: string): Promise<void> {
  // Disconnected from Firestore. Data sync runs only through Google Sheets now.
  console.log('Firestore sync disabled. Re-routing all syncs to Google Sheets.');
}`);

fs.writeFileSync('src/hooks/queries.ts', newContent);
