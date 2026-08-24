const fs = require('fs');
let content = fs.readFileSync('src/contexts/TrashContext.tsx', 'utf-8');

content = content.replace(/const user = auth\.currentUser;[\s\S]*?\}\s*\}[\s\S]*?\}[\s\S]*?return item;/m, `// Sync to sheets
          const { scheduleSheetsBackgroundSync } = require('../lib/googleSheetsDataService');
          scheduleSheetsBackgroundSync();
        }
      }
    }
    return item;`);

content = content.replace(/import \{ auth, db \} from '\.\.\/lib\/firebase';/g, "import { auth } from '../lib/firebase';");
content = content.replace(/import \{ collection, doc, setDoc \} from 'firebase\/firestore';/g, "");

fs.writeFileSync('src/contexts/TrashContext.tsx', content);
