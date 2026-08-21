const fs = require('fs');
let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');
content = content.replace(/import \{ db, auth \} from '\.\/firebase';/, "import { auth } from './firebase';");
// Remove all setDoc, query, deleteDoc, getDocs related calls.
content = content.replace(/setDoc\(doc\(db.*?catch.*?\)\);/g, "/* db write removed */");
content = content.replace(/await setDoc\(doc\(db.*?catch.*?\)\);/g, "/* db write removed */");
content = content.replace(/const q = query\(collection\(db.*?;/g, "");
content = content.replace(/const q2 = query\(collection\(db.*?;/g, "");
content = content.replace(/const snap = await getDocs\(q\);/g, "const snap = { docs: [] };");
content = content.replace(/const snap2 = await getDocs\(q2\);/g, "const snap2 = { docs: [] };");
content = content.replace(/const docsToDelete = snap\.docs\.map.*?;/g, "");
content = content.replace(/const docsToDelete2 = snap2\.docs\.map.*?;/g, "");
content = content.replace(/await Promise\.all\(docsToDelete\);/g, "");
content = content.replace(/await Promise\.all\(docsToDelete2\);/g, "");

fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);
