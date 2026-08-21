const fs = require('fs');
let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');

// Due to how search/replace worked, we have two blocks of "Parse Trash". We'll just regex replace the 2nd duplicate.
content = content.replace(/  \/\/ Parse Trash[\s\S]*?setLocalData\('finanas_archives', parsedArchives\);[\s\S]*?  \/\/ Parse Trash/, "  // Parse Trash");
fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);
