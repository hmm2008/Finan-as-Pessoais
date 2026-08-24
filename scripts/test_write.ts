import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);

async function testWithDb(dbName: string, db: any) {
  console.log(`--- Testing DB: ${dbName} ---`);
  try {
    const ref = doc(db, 'user_preferences', 'global_shared');
    await setDoc(ref, {
      navLabels: {
        '/': 'fim'
      },
      updatedAt: new Date().toISOString(),
      userId: 'global_shared'
    }, { merge: true });

    console.log(`Write succeeded on ${dbName}!`);
    const snap = await getDoc(ref);
    console.log(`Read back on ${dbName}:`, JSON.stringify(snap.data(), null, 2));
  } catch (err: any) {
    console.error(`Error on ${dbName}:`, err.message || err);
  }
}

async function run() {
  const dbCustom = getFirestore(app, config.firestoreDatabaseId);
  await testWithDb('customDB (' + config.firestoreDatabaseId + ')', dbCustom);

  const dbDefault = getFirestore(app);
  await testWithDb('defaultDB', dbDefault);
}

run().catch(console.error).finally(() => process.exit(0));
