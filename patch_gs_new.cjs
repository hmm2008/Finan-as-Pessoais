const fs = require('fs');
let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');

// I need to add the new missing sheets to exportAllDataToSheets as ranges that it reads for values to clear. Let's make sure clearRanges is correctly catching all sheets.
content = content.replace(
  /const clearRanges = allExistingSheets.map\(s => \{[\s\S]*?\}\);/,
  `const clearRanges = allExistingSheets.map(s => {
    if (s === 'Dashboard_Calculos' || s === 'Receitas' || s === 'Receitas_Fixas_Reg') {
      return \`'\${s}'!A1:Z100000\`;
    }
    return \`'\${s}'!A2:Z100000\`;
  });`
);
fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);
