const fs = require('fs');

const cleanFile = (file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/import \{.*db.*\} from '\.\.\/lib\/firebase';/, "import { auth } from '../lib/firebase';");
  // Simple strip for db usages
  content = content.replace(/setDoc\(doc\(db,.*?\).*?catch.*?;/g, "");
  content = content.replace(/deleteDoc\(doc\(db,.*?\).*?catch.*?;/g, "");
  content = content.replace(/getDocs\(query\(collection\(db,.*?\).*?\)/g, "Promise.resolve({ docs: [], forEach: () => {} })");
  fs.writeFileSync(file, content);
};

['src/utils/logger.ts', 'src/utils/cleanupDemoData.ts', 'src/utils/archivePDF.ts', 'src/views/ConfiguracoesView.tsx'].forEach(cleanFile);
