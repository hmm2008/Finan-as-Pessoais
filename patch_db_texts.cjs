const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf-8');
  content = content.replace(/na Base de Dados e na/g, "e na");
  content = content.replace(/na Base de Dados,/g, "");
  content = content.replace(/na base de dados e na/g, "e na");
  content = content.replace(/Base de Dados e /g, "");
  content = content.replace(/na base de dados/g, "");
  content = content.replace(/Base de Dados na Nuvem \(Firestore\)/g, "Armazenamento na Cloud");
  content = content.replace(/Base de Dados/g, "Google Drive");
  content = content.replace(/base de dados/g, "Google Drive");
  fs.writeFileSync(path, content);
}

replaceFile('src/components/configuracoes/GoogleDriveSyncCard.tsx');
replaceFile('src/components/configuracoes/DangerZoneCard.tsx');
replaceFile('src/lib/googleSheetsDataService.ts');
replaceFile('src/views/RelatorioMensalImprimivelView.tsx');
