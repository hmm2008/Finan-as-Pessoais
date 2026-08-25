const fs = require('fs');
let code = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf8');

const target = `        if (needsRename || needsExpansion) {
          const updateProp: any = {
            sheetId,
            gridProperties: {
              rowCount: Math.max(currentRows, 1000),
              columnCount: Math.max(currentCols, 26)
            }
          };
          let fieldMask = 'gridProperties.rowCount,gridProperties.columnCount';
          if (needsRename) {
            updateProp.title = canonicalTarget;
            fieldMask = 'title,gridProperties.rowCount,gridProperties.columnCount';
          }

          structuralRequests.push({
            updateSheetProperties: {
              properties: updateProp,
              fields: fieldMask
            }
          });
        }`;

const replacement = `        if (needsRename) {
          structuralRequests.push({
            updateSheetProperties: {
              properties: {
                sheetId,
                title: canonicalTarget
              },
              fields: 'title'
            }
          });
        }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/lib/googleSheetsDataService.ts', code);
