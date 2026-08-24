import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app); // Default DB

async function run() {
  console.log('Testing getFirestore(app) default DB...');
  const ref = doc(db, 'user_preferences', 'global_shared');
  try {
    await setDoc(ref, {
      navLabels: {
        '/': 'fim'
      },
      updatedAt: new Date().toISOString(),
      userId: 'global_shared'
    }, { merge: true });
    console.log('Default DB setDoc SUCCESS!');

    const snap = await getDoc(ref);
    console.log('Default DB read back:', snap.data());
  } catch (err: any) {
    console.error('Default DB Error:', err.message || err);
  }
}

run().catch(console.error).finally(() => process.exit(0));
