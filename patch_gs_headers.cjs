const fs = require('fs');
let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');

content = content.replace(
  /'Reciclagem': \["ID", "Tipo", "Dados JSON", "Data Eliminação"\][\s]*\};/,
  `'Reciclagem': ["ID", "Tipo", "Dados JSON", "Data Eliminação"],
    'Preferencias': ["Chave", "Dados JSON", "Atualizado Em"],
    'Regras_Categorizacao': ["ID", "Keyword", "Categoria", "Tipo", "Prioridade"],
    'Notificacoes': ["ID", "Título", "Mensagem", "Data", "Lida", "Tipo"],
    'Arquivo': ["ID", "Título", "Data", "Dados JSON", "Tipo"]
  };`
);

fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);
