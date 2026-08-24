import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId;

// Database connection disabled - moving to Google Sheets only
export const auth = getAuth(app);
