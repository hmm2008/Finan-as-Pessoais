const fs = require('fs');
let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');

// 1. Update REQUIRED_SHEETS
content = content.replace(/'Reciclagem'/, "'Reciclagem',\n    'Preferencias',\n    'Regras_Categorizacao',\n    'Notificacoes',\n    'Arquivo'");

// 2. In exportAllDataToSheets, gather the data
content = content.replace(
  /let trash = getLocalData\('fin_trash'\);/,
  `let trash = getLocalData('fin_trash');
  let userPrefsStr = localStorage.getItem('finanas_user_prefs');
  let userPrefs = userPrefsStr ? JSON.parse(userPrefsStr) : {};
  let categorizationRules = getLocalData('fin_categorization_rules');
  let notifications = getLocalData('finanas_notifications');
  let archives = getLocalData('finanas_archives');`
);

// 3. Create the rows
content = content.replace(
  /const trashRows = \[[\s\S]*?\];/,
  `const trashRows = [
    ["ID", "Tipo", "Dados JSON", "Data Eliminação"],
    ...trash.map((t: any) => [
      t.id || '',
      t.type || '',
      JSON.stringify(t.data || {}),
      t.deletedAt || t.createdAt || ''
    ])
  ];

  const prefsRows = [
    ["Chave", "Dados JSON", "Atualizado Em"],
    ["Preferencias", JSON.stringify(userPrefs || {}), userPrefs.updatedAt || '']
  ];

  const catRulesRows = [
    ["ID", "Keyword", "Categoria", "Tipo", "Prioridade"],
    ...categorizationRules.map((r: any) => [
      r.id || '',
      r.keyword || '',
      r.category || '',
      r.type || '',
      r.priority || 0
    ])
  ];

  const notifRows = [
    ["ID", "Título", "Mensagem", "Data", "Lida", "Tipo"],
    ...notifications.map((n: any) => [
      n.id || '',
      n.title || '',
      n.message || '',
      n.createdAt || '',
      n.read ? 'Sim' : 'Não',
      n.type || ''
    ])
  ];

  const archiveRows = [
    ["ID", "Título", "Data", "Dados JSON", "Tipo"],
    ...archives.map((a: any) => [
      a.id || '',
      a.title || '',
      a.createdAt || '',
      JSON.stringify(a.data || {}),
      a.type || ''
    ])
  ];`
);

// 4. Update the batchUpdate data array
content = content.replace(
  /\{ range: 'Reciclagem!A1:D', values: trashRows \}/,
  `{ range: 'Reciclagem!A1:D', values: trashRows },
      { range: 'Preferencias!A1:C', values: prefsRows },
      { range: 'Regras_Categorizacao!A1:E', values: catRulesRows },
      { range: 'Notificacoes!A1:F', values: notifRows },
      { range: 'Arquivo!A1:E', values: archiveRows }`
);

// 5. Update import ranges
content = content.replace(
  /'Reciclagem!A1:D1000'/,
  `'Reciclagem!A1:D1000',
    'Preferencias!A1:C5',
    'Regras_Categorizacao!A1:E1000',
    'Notificacoes!A1:F1000',
    'Arquivo!A1:E1000'`
);

// 6. Parse and save in importAllDataFromSheets
content = content.replace(
  /setLocalData\('finanas_trash_items', parsedTrash\);/,
  `setLocalData('finanas_trash_items', parsedTrash);

  // Parse Preferences
  const prefsRowsData = getRows(11);
  if (prefsRowsData.length > 0 && prefsRowsData[0][1]) {
    try {
      const prefsData = JSON.parse(prefsRowsData[0][1]);
      localStorage.setItem('finanas_user_prefs', JSON.stringify(prefsData));
    } catch (e) {
      console.warn('Erro ao parsear preferências', e);
    }
  }

  // Parse Categorization Rules
  const catRulesRowsData = getRows(12);
  const parsedCatRules = catRulesRowsData.map((row: any[], i: number) => ({
    id: row[0] || \`rule_\${i}\`,
    keyword: row[1] || '',
    category: row[2] || '',
    type: row[3] || '',
    priority: parseNum(row[4])
  })).filter((r: any) => r.keyword);
  setLocalData('fin_categorization_rules', parsedCatRules);

  // Parse Notifications
  const notifRowsData = getRows(13);
  const parsedNotifs = notifRowsData.map((row: any[], i: number) => ({
    id: row[0] || \`notif_\${i}\`,
    title: row[1] || '',
    message: row[2] || '',
    createdAt: row[3] || '',
    read: parseBool(row[4]),
    type: row[5] || ''
  })).filter((n: any) => n.title);
  setLocalData('finanas_notifications', parsedNotifs);

  // Parse Archives
  const archiveRowsData = getRows(14);
  const parsedArchives = archiveRowsData.map((row: any[], i: number) => {
    let dataObj = {};
    try {
      dataObj = JSON.parse(row[3]);
    } catch (e) {}
    return {
      id: row[0] || \`arch_\${i}\`,
      title: row[1] || '',
      createdAt: row[2] || '',
      data: dataObj,
      type: row[4] || ''
    };
  }).filter((a: any) => a.title);
  setLocalData('finanas_archives', parsedArchives);
`
);

// 7. Update allHeaders for clearAllSpreadsheetData
content = content.replace(
  /'Reciclagem': \["ID", "Tipo", "Dados JSON", "Data Eliminação"\]/,
  `'Reciclagem': ["ID", "Tipo", "Dados JSON", "Data Eliminação"],
    'Preferencias': ["Chave", "Dados JSON", "Atualizado Em"],
    'Regras_Categorizacao': ["ID", "Keyword", "Categoria", "Tipo", "Prioridade"],
    'Notificacoes': ["ID", "Título", "Mensagem", "Data", "Lida", "Tipo"],
    'Arquivo': ["ID", "Título", "Data", "Dados JSON", "Tipo"]`
);

fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);
