const fs = require('fs');
let content = fs.readFileSync('src/lib/googleSheetsDataService.ts', 'utf-8');

const searchBlock = `  // Parse Trash
  const trashRowsData = getRows(10);
  const parsedTrash = trashRowsData.map((row: any[], i: number) => {
    let dataObj = {};
    try { dataObj = JSON.parse(row[2]); } catch (e) {}
    return {
      id: row[0] || \`trash_\${i}\`,
      type: row[1] || '',
      data: dataObj,
      deletedAt: row[3] || '',
      createdAt: row[3] || ''
    };
  }).filter((t: any) => t.type);
  setLocalData('finanas_trash_items', parsedTrash);

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
    priority: Number(row[4]) || 0
  })).filter((r: any) => r.keyword);
  setLocalData('fin_categorization_rules', parsedCatRules);

  // Parse Notifications
  const notifRowsData = getRows(13);
  const parsedNotifs = notifRowsData.map((row: any[], i: number) => ({
    id: row[0] || \`notif_\${i}\`,
    title: row[1] || '',
    message: row[2] || '',
    createdAt: row[3] || '',
    read: row[4] === 'Sim',
    type: row[5] || ''
  })).filter((n: any) => n.title);
  setLocalData('finanas_notifications', parsedNotifs);

  // Parse Archives
  const archiveRowsData = getRows(14);
  const parsedArchives = archiveRowsData.map((row: any[], i: number) => {
    let dataObj = {};
    try { dataObj = JSON.parse(row[3]); } catch (e) {}
    return {
      id: row[0] || \`arch_\${i}\`,
      title: row[1] || '',
      createdAt: row[2] || '',
      data: dataObj,
      type: row[4] || ''
    };
  }).filter((a: any) => a.title);
  setLocalData('finanas_archives', parsedArchives);`;

const firstIndex = content.indexOf(searchBlock);
const lastIndex = content.lastIndexOf(searchBlock);

if (firstIndex !== lastIndex && firstIndex !== -1) {
  content = content.slice(0, lastIndex) + content.slice(lastIndex + searchBlock.length);
}

fs.writeFileSync('src/lib/googleSheetsDataService.ts', content);
