const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/RegisterMonthModal.tsx', 'utf-8');
content = content.replace(/import \{ db.*?\} from '\.\.\/\.\.\/lib\/firebase';/, "import { auth } from '../../lib/firebase';\nimport { scheduleSheetsBackgroundSync } from '../../lib/googleSheetsDataService';");
content = content.replace(/setDoc\(doc\(db,.*?\).*?catch.*?;/g, "scheduleSheetsBackgroundSync();");
fs.writeFileSync('src/components/dashboard/RegisterMonthModal.tsx', content);
