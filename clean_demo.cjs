const fs = require('fs');
let content = fs.readFileSync('src/utils/cleanupDemoData.ts', 'utf-8');
content = content.replace(/export async function purgeDemoRecordsFromLocalAndFirebase\([\s\S]*?\} catch/m, `export async function purgeDemoRecordsFromLocalAndFirebase() {
  try`);
content = content.replace(/import \{.*?db.*?\} from '\.\.\/lib\/firebase';/, "import { auth } from '../lib/firebase';");
fs.writeFileSync('src/utils/cleanupDemoData.ts', content);
