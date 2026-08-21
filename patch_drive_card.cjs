const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf-8');
  // Substituir textos visuais de Firebase para Google Drive / Local
  content = content.replace(/Local\/Firebase/g, "Local/Drive");
  content = content.replace(/Local \/ Firebase/g, "Local / Drive");
  content = content.replace(/localmente\/Firebase/g, "localmente");
  content = content.replace(/& Firebase/g, "& Local");
  content = content.replace(/Migrar Firebase/g, "Sincronizar Tudo");
  content = content.replace(/Firebase sincronizado/g, "Sincronizado");
  content = content.replace(/e Firebase/g, "e Local");
  fs.writeFileSync(path, content);
}

replaceFile('src/components/configuracoes/GoogleDriveSyncCard.tsx');
