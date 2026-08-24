const fs = require('fs');
let content = fs.readFileSync('src/hooks/queries.ts', 'utf-8');
content = content.replace(/const user = auth\.currentUser;\s*if \(user\) \{[\s\S]*?\}\s*return saved;/gm, 'return saved;');
content = content.replace(/const user = auth\.currentUser;\s*if \(user\) \{[\s\S]*?\}\s*return updated;/gm, 'return updated;');
content = content.replace(/const user = auth\.currentUser;\s*if \(user\) \{[\s\S]*?\}\s*return id;/gm, 'return id;');
// also remove the imports from top just in case
content = content.replace(/import \{.*?\} from 'firebase\/firestore';\n/, '');
content = content.replace(/import \{ db.*?\} from '\.\.\/lib\/firebase';/, "import { auth } from '../lib/firebase';");

fs.writeFileSync('src/hooks/queries.ts', content);
