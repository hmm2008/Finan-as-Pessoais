import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

export interface DriveSpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheets: string[];
  createdNow?: boolean;
}

let cachedAccessToken: string | null = null;

export function getCachedDriveToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  return localStorage.getItem('google_drive_access_token');
}

export function setCachedDriveToken(token: string | null) {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem('google_drive_access_token', token);
  } else {
    localStorage.removeItem('google_drive_access_token');
  }
}

/**
 * Connect to Google Drive by prompting OAuth popup for Drive.file and Spreadsheets scopes.
 */
export async function connectGoogleDrive(): Promise<{ accessToken: string; userEmail: string | null } | null> {
  try {
    const provider = new GoogleAuthProvider();
    DRIVE_SCOPES.forEach(scope => provider.addScope(scope));

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Não foi possível obter o Token de Acesso do Google Drive.');
    }

    setCachedDriveToken(token);
    return {
      accessToken: token,
      userEmail: result.user.email
    };
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      // User closed or dismissed the popup window - not a system error
      return null;
    }
    if (err.code === 'auth/popup-blocked') {
      throw new Error('A janela de autenticação foi bloqueada pelo navegador. Permita popups para continuar.');
    }
    throw err;
  }
}

/**
 * Searches for spreadsheet named "Finanças Pessoais" in Google Drive or creates it with required tabs.
 */
export async function findOrCreateFinanceSpreadsheet(accessToken: string): Promise<DriveSpreadsheetInfo> {
  // 1. Search if file already exists in Drive
  const query = encodeURIComponent("name='Finanças Pessoais' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    const detail = err.error?.message || `Status HTTP ${searchRes.status}`;
    if (searchRes.status === 401 || searchRes.status === 403) {
      setCachedDriveToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_auth_error'));
      }
      throw new Error('Sessão Google expirada ou sem permissões suficientes. Por favor, reconecte a sua conta Google.');
    }
    throw new Error(`Erro ao pesquisar ficheiro na Drive: ${detail}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existing = searchData.files[0];
    
    // Fetch spreadsheet sheets
    const sheetsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${existing.id}?fields=sheets.properties(sheetId,title)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    let sheets: string[] = [];
    if (sheetsRes.ok) {
      const sheetsData = await sheetsRes.json();
      const sheetList: any[] = sheetsData.sheets || [];
      sheets = sheetList.map((s: any) => s.properties?.title);

      // Migração: Se existir "Lixeira" mas não existir "Reciclagem", renomear.
      const lixeiraSheet = sheetList.find((s: any) => s.properties?.title === 'Lixeira');
      const reciclagemExists = sheets.includes('Reciclagem');

      if (lixeiraSheet && !reciclagemExists) {
        try {
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${existing.id}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requests: [{
                updateSheetProperties: {
                  properties: {
                    sheetId: lixeiraSheet.properties.sheetId,
                    title: 'Reciclagem'
                  },
                  fields: 'title'
                }
              }]
            })
          });
          // Update local sheets list
          sheets = sheets.map(t => t === 'Lixeira' ? 'Reciclagem' : t);
        } catch (e) {
          console.warn('Erro ao renomear Lixeira para Reciclagem:', e);
        }
      }
    }

    return {
      id: existing.id,
      name: existing.name,
      url: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
      sheets,
      createdNow: false
    };
  }

  // 2. File not found, create new Spreadsheet with structured tabs and headers
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'Finanças Pessoais'
      },
      sheets: [
        { properties: { title: 'Despesas' } },
        { properties: { title: 'Receitas_Pontuais' } },
        { properties: { title: 'Receitas_Fixas_Registadas' } },
        { properties: { title: 'Despesas_Fixas' } },
        { properties: { title: 'Receitas_Fixas' } },
        { properties: { title: 'Contas' } },
        { properties: { title: 'Patrimonio' } },
        { properties: { title: 'Veiculos' } },
        { properties: { title: 'Veiculos_Abastecimentos' } },
        { properties: { title: 'Veiculos_Tarefas' } },
        { properties: { title: 'Orcamentos' } },
        { properties: { title: 'Metas' } },
        { properties: { title: 'Reciclagem' } }
      ]
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    const detail = err.error?.message || `Status HTTP ${createRes.status}`;
    if (createRes.status === 401 || createRes.status === 403) {
      setCachedDriveToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_auth_error'));
      }
      throw new Error('Sessão Google expirada. Por favor, reconecte a sua conta Google.');
    }
    throw new Error(`Erro ao criar nova folha no Google Sheets: ${detail}`);
  }

  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;
  const spreadsheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Write Headers for each sheet
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Despesas!A1:I1', values: [["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Veículo", "Notas", "ID Fixo"]] },
          { range: 'Receitas_Pontuais!A1:H1', values: [["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas"]] },
          { range: 'Receitas_Fixas_Registadas!A1:H1', values: [["ID", "Data", "Entidade", "Categoria", "Valor (€)", "Método", "Notas", "ID Fixo"]] },
          { range: 'Despesas_Fixas!A1:J1', values: [["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Método", "Ativo", "Veículo", "Notas"]] },
          { range: 'Receitas_Fixas!A1:I1', values: [["ID", "Nome", "Entidade", "Categoria", "Valor (€)", "Dia Vencimento", "Frequência", "Ativo", "Notas"]] },
          { range: 'Contas!A1:F1', values: [["ID", "Nome", "Tipo", "IBAN", "Saldo (€)", "Ativa"]] },
          { range: 'Patrimonio!A1:J1', values: [["ID", "Nome", "Categoria / SubTipo", "Valor Atual (€)", "Valor Compra (€)", "Data Aquisição", "Rua", "Código Postal", "Localidade", "Notas"]] },
          { range: 'Veiculos!A1:E1', values: [["ID", "Marca", "Modelo", "Matrícula", "Ano"]] },
          { range: 'Veiculos_Abastecimentos!A1:I1', values: [["ID", "ID Viatura", "Data", "Litros", "Valor Total (€)", "Preço/L (€)", "Quilometragem (km)", "Posto / Local", "Notas"]] },
          { range: 'Veiculos_Tarefas!A1:M1', values: [["ID", "ID Viatura", "Título", "Tipo", "Custo (€)", "Estado", "Data Limite", "Data Conclusão", "Periodicidade", "Próx. Data Vencimento", "Próx. Custo (€)", "Documento", "Notas"]] },
          { range: 'Orcamentos!A1:D1', values: [["ID", "Categoria", "Limite (€)", "Mês"]] },
          { range: 'Metas!A1:E1', values: [["ID", "Nome", "Valor Alvo (€)", "Valor Atual (€)", "Data Limite"]] },
          { range: 'Reciclagem!A1:D1', values: [["ID", "Tipo", "Dados JSON", "Data Eliminação"]] }
        ]
      })
    });
  } catch (err) {
    console.warn('Erro ao inicializar cabeçalhos nas abas:', err);
  }

  const sheets = (createData.sheets || []).map((s: any) => s.properties?.title);

  return {
    id: spreadsheetId,
    name: 'Finanças Pessoais',
    url: spreadsheetUrl,
    sheets,
    createdNow: true
  };
}

/**
 * Applies professional styling and builds the dynamic "Dashboard_Calculos" tab with live formulas.
 */
export async function formatAndStyleFinanceSpreadsheet(accessToken: string, spreadsheetId: string): Promise<boolean> {
  // 1. Fetch spreadsheet metadata to get sheet IDs
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const errJson = await metaRes.json().catch(() => ({}));
    const detail = errJson.error?.message || `Status HTTP ${metaRes.status}`;
    if (metaRes.status === 401 || metaRes.status === 403) {
      setCachedDriveToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_auth_error'));
      }
      throw new Error('Sessão Google expirada ou sem permissão. Por favor, reconecte a conta Google.');
    }
    if (metaRes.status === 404) {
      throw new Error('Folha de cálculo não encontrada na Google Drive. Por favor, clique em "Localizar / Criar Folha de Cálculo na Drive".');
    }
    throw new Error(`Falha ao obter metadados da folha de cálculo: ${detail}`);
  }

  const metaData = await metaRes.json();
  const existingSheets: { sheetId: number; title: string }[] = (metaData.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title
  }));

  const requests: any[] = [];

  // Check if Dashboard_Calculos exists, if not create it
  let dashboardSheet = existingSheets.find(s => s.title === 'Dashboard_Calculos');
  if (!dashboardSheet) {
    const addSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Dashboard_Calculos',
                index: 0,
                tabColor: { red: 0.05, green: 0.5, blue: 0.3 }
              }
            }
          }
        ]
      })
    });
    if (addSheetRes.ok) {
      const addData = await addSheetRes.json();
      const newSheetId = addData.reply?.[0]?.addSheet?.properties?.sheetId || 0;
      existingSheets.unshift({ sheetId: newSheetId, title: 'Dashboard_Calculos' });
    }
  }

  // Freeze row 1 and style headers for each standard tab
  existingSheets.forEach(sheet => {
    // Freeze header row
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheet.sheetId,
          gridProperties: {
            frozenRowCount: 1
          }
        },
        fields: 'gridProperties.frozenRowCount'
      }
    });

    // Header styling (emerald green background, white bold text)
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheet.sheetId,
          startRowIndex: 0,
          endRowIndex: 1
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.03, green: 0.45, blue: 0.3 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE'
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
      }
    });
  });

  // Execute structural batchUpdate
  if (requests.length > 0) {
    try {
      const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
      if (!batchRes.ok) {
         console.warn('Aviso estrutural de aba:', await batchRes.text());
      }
    } catch (e) {
      console.warn('Aviso na atualização do Excel (estrutural):', e);
    }
  }

  // Determine user locale to provide valid formula injection as "USER_ENTERED"
  const locale = metaData.properties?.locale || 'pt_PT';
  const isPt = locale.includes('pt');
  
  // Use Portuguese function names and semicolons if in Portugal/Brazil, otherwise fallback to US format
  const sep = isPt ? ';' : ',';
  const fnSUM = isPt ? 'SOMA' : 'SUM';
  const fnSUMIF = isPt ? 'SOMASE' : 'SUMIF';

  // First clear entire Dashboard_Calculos sheet to remove old values/formulas
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'Dashboard_Calculos'!A1:Z1000")}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (clearErr) {
    console.warn('Erro ao esvaziar Dashboard_Calculos:', clearErr);
  }

  const dashboardValues = [
    ["PAINEL FINANCEIRO RESUMO - CÁLCULOS AUTOMÁTICOS", ""],
    ["Indicador", "Valor Calculado em Tempo Real"],
    ["Total de Receitas Pontuais (€)", `=${fnSUM}(Receitas_Pontuais!E2:E100000)`],
    ["Total de Receitas Fixas Registadas (€)", `=${fnSUM}(Receitas_Fixas_Registadas!E2:E100000)`],
    ["Total Geral de Receitas (€)", "=B3+B4"],
    ["Total de Despesas Registadas (€)", `=${fnSUM}(Despesas!E2:E100000)`],
    ["Saldo Líquido Registado (€)", "=B5-B6"],
    ["", ""],
    ["Compromissos Fixos Mensais Previstos (€)", `=${fnSUM}(Despesas_Fixas!E2:E100000)`],
    ["Rendimentos Fixos Mensais Previstos (€)", `=${fnSUM}(Receitas_Fixas!E2:E100000)`],
    ["Balanço Estimado de Fixos (€)", "=B10-B9"],
    ["", ""],
    ["Total Património Registado (€)", `=${fnSUM}(Patrimonio!D2:D100000)`],
    ["Saldo Total em Contas Bancárias (€)", `=${fnSUM}(Contas!E2:E100000)`],
    ["", ""],
    ["RESUMO DE RECEITAS POR CATEGORIA", "TOTAL (€)"],
    ["Salário / Ordenado", `=${fnSUMIF}(Receitas_Pontuais!D2:D100000${sep} "Salário"${sep} Receitas_Pontuais!E2:E100000) + ${fnSUMIF}(Receitas_Pontuais!D2:D100000${sep} "Ordenado"${sep} Receitas_Pontuais!E2:E100000) + ${fnSUMIF}(Receitas_Fixas_Registadas!D2:D100000${sep} "Salário"${sep} Receitas_Fixas_Registadas!E2:E100000) + ${fnSUMIF}(Receitas_Fixas_Registadas!D2:D100000${sep} "Ordenado"${sep} Receitas_Fixas_Registadas!E2:E100000)`],
    ["Pensões", `=${fnSUMIF}(Receitas_Pontuais!D2:D100000${sep} "Pensões"${sep} Receitas_Pontuais!E2:E100000) + ${fnSUMIF}(Receitas_Fixas_Registadas!D2:D100000${sep} "Pensões"${sep} Receitas_Fixas_Registadas!E2:E100000)`],
    ["Outros", `=${fnSUMIF}(Receitas_Pontuais!D2:D100000${sep} "Outros"${sep} Receitas_Pontuais!E2:E100000) + ${fnSUMIF}(Receitas_Fixas_Registadas!D2:D100000${sep} "Outros"${sep} Receitas_Fixas_Registadas!E2:E100000)`],
    ["", ""],
    ["RESUMO DE DESPESAS POR CATEGORIA", "TOTAL (€)"],
    ["Habitação", `=${fnSUMIF}(Despesas!D2:D100000${sep} "Habitação"${sep} Despesas!E2:E100000)`],
    ["Alimentação", `=${fnSUMIF}(Despesas!D2:D100000${sep} "Alimentação"${sep} Despesas!E2:E100000)`],
    ["Transportes & Veículos", `=${fnSUMIF}(Despesas!D2:D100000${sep} "Transportes"${sep} Despesas!E2:E100000) + ${fnSUMIF}(Despesas!D2:D100000${sep} "Veículo"${sep} Despesas!E2:E100000)`],
    ["Saúde", `=${fnSUMIF}(Despesas!D2:D100000${sep} "Saúde"${sep} Despesas!E2:E100000)`],
    ["Lazer & Restaurantes", `=${fnSUMIF}(Despesas!D2:D100000${sep} "Lazer"${sep} Despesas!E2:E100000) + ${fnSUMIF}(Despesas!D2:D100000${sep} "Restaurantes"${sep} Despesas!E2:E100000)`],
    ["Educação", `=${fnSUMIF}(Despesas!D2:D100000${sep} "Educação"${sep} Despesas!E2:E100000)`],
    ["Outros", `=${fnSUMIF}(Despesas!D2:D100000${sep} "Outros"${sep} Despesas!E2:E100000) + ${fnSUMIF}(Despesas!D2:D100000${sep} "Diversos"${sep} Despesas!E2:E100000)`]
  ];

  try {
    const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Dashboard_Calculos!A1:B' + dashboardValues.length, values: dashboardValues }
        ]
      })
    });
    
    if (!valRes.ok) {
       const txt = await valRes.text();
       console.error("Falha ao injetar fórmulas na aba Dashboard:", txt);
       throw new Error(`Google Sheets API recusou a fórmula: ${txt}`);
    }
  } catch (e) {
    console.error('Aviso no preenchimento do Dashboard_Calculos:', e);
    throw e; // We want the user to see the exact error if it fails now
  }

  return true;
}

/**
 * Tests connection and accessibility of a Google Spreadsheet ID.
 */
export async function testSpreadsheetHealth(accessToken: string, spreadsheetId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.status === 401 || res.status === 403) {
      setCachedDriveToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finanas_drive_auth_error'));
      }
    }
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches the modifiedTime metadata of a Google Drive file.
 */
export async function getSpreadsheetModifiedTime(accessToken: string, spreadsheetId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=modifiedTime`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setCachedDriveToken(null);
      }
      return null;
    }
    const data = await res.json();
    return data.modifiedTime || null;
  } catch (err) {
    console.error('Erro ao consultar modifiedTime na Drive:', err);
    return null;
  }
}

/**
 * Lists all revisions for a specific file in Google Drive.
 */
export async function listSpreadsheetRevisions(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/revisions?fields=revisions(id,modifiedTime,lastModifyingUser,publishAuto,published)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Erro ao listar versões: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  // Sort by modifiedTime descending (newest first)
  return (data.revisions || []).sort((a: any, b: any) => 
    new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
  );
}
