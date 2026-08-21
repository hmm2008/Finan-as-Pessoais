const fs = require('fs');
let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');
content = content.replace(/parsedExpenses\.forEach\([\s\S]*?parsedGoals\.forEach.*?$/m, `// Firestore mirroring removed.`);
fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);
