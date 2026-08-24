const fs = require('fs');

let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');
content = content.replace(/ & Firebase/g, "");
content = content.replace(/e Firebase\./g, "");
content = content.replace(/e Firebase/g, "");
content = content.replace(/and Firebase/g, "");
content = content.replace(/and Firebase\./g, "");
content = content.replace(/, and Firebase\./g, "");
content = content.replace(/A sincronizar e atualizar coleções no Firebase\.\.\./g, "A sincronizar coleções...");
content = content.replace(/Aviso na migração Firebase/g, "Aviso na migração");
content = content.replace(/Atualiza e reconcilia documentos na base de dados/g, "Atualiza e reconcilia documentos");
fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);

let welcome = fs.readFileSync('src/views/WelcomeView.tsx', 'utf-8');
welcome = welcome.replace(/Autenticação segura via Firebase/g, "Autenticação segura via Google");
welcome = welcome.replace(/na sua consola do Firebase/g, "na consola");
welcome = welcome.replace(/Firebase Console/g, "Painel");
fs.writeFileSync('src/views/WelcomeView.tsx', welcome);

