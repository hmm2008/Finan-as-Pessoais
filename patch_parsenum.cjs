const fs = require('fs');
let code = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf8');

const target = `function parseNum(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/€/g, '').replace(/\\s/g, '').replace(',', '.').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}`;

const replacement = `function parseNum(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).replace(/€/g, '').replace(/\\s/g, '').trim();
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf('.') < str.lastIndexOf(',')) {
      str = str.replace(/\\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/lib/googleSheetsDataService.ts', code);
  console.log("Patched parseNum successfully!");
} else {
  console.log("parseNum target not found!");
}
