const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf-8');
  content = content.replace(/na Firebase/g, "na Google Drive");
  content = content.replace(/com a Firebase/g, "com a Google Drive");
  content = content.replace(/Firebase/g, "Google Drive");
  fs.writeFileSync(path, content);
}

replaceFile('src/components/configuracoes/PageTitlesCustomizer.tsx');
replaceFile('src/components/configuracoes/SidebarLabelsCustomizer.tsx');

// Also let's check for any other places with "a gravar na firebase"
