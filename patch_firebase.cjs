const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
content = content.replace(/export const db = initializeFirestore[\s\S]*?\}\);/m, "// Database connection disabled - moving to Google Sheets only");
content = content.replace(/import \{.*?initializeFirestore.*?\} from 'firebase\/firestore';/, "");
fs.writeFileSync('src/lib/firebase.ts', content);
