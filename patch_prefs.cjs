const fs = require('fs');
let content = fs.readFileSync('src/contexts/PreferencesContext.tsx', 'utf-8');

// Strip out firestore imports
content = content.replace(/import \{.*?\} from 'firebase\/firestore';\n/, '');
content = content.replace(/import \{ auth, db \} from '\.\.\/lib\/firebase';\n/, "import { auth } from '../lib/firebase';\nimport { scheduleSheetsBackgroundSync } from '../lib/googleSheetsDataService';\n");

// Strip out Firestore logic from saveToFirestore
content = content.replace(/const saveToFirestore = useCallback\(async \(payload: UserPreferences\) => \{[\s\S]*?\}, \[\]\);/, `const saveToFirestore = useCallback(async (payload: UserPreferences) => {
    // Only Google Sheets sync now
    scheduleSheetsBackgroundSync();
  }, []);`);

// Strip out the snapshot listener
content = content.replace(/let unsubscribeListener: \(\(\) => void\) \| null = null;[\s\S]*?return \(\) => \{[\s\S]*?if \(unsubscribeListener\) \{[\s\S]*?\}\s*\};/m, `// Firestore snapshot listener removed.`);

fs.writeFileSync('src/contexts/PreferencesContext.tsx', content);
