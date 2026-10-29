/**
 * Bank Statement Parsers for OFX, CAMT.053 (ISO 20022 XML), and Bank CSV Formats
 * Supports Portuguese & European Banking Formats (CGD, Millennium bcp, Santander, Novo Banco, BPI, Revolut, Wise, etc.)
 */

export interface ParsedBankTransaction {
  tipo: 'Despesa' | 'Receita';
  data: string; // YYYY-MM-DD
  origemEntidade: string;
  valor: number;
  categoria: string;
  metodoPagamento: string;
  recorrente: string; // 'Sim' | 'Não'
  descricao: string;
  [key: string]: any;
}

export interface BankParseResult {
  formatName: string;
  bankName?: string;
  columns: string[];
  data: Record<string, any>[];
  autoMappings: {
    entityField: string;
    amountField: string;
    dateField: string;
    categoryField: string;
    descriptionField: string;
    methodField: string;
    recurringField: string;
    typeField: string;
  };
}

/**
 * Parse OFX (Open Financial Exchange) format
 */
export function parseOFXStatement(ofxText: string, fileName: string): BankParseResult {
  const rows: Record<string, any>[] = [];

  // Identify bank name if available
  let bankName = 'OFX Bancário';
  const orgMatch = ofxText.match(/<ORG>(.*?)(<|\r|\n)/i) || ofxText.match(/<FI>(.*?)(<|\r|\n)/i);
  if (orgMatch && orgMatch[1].trim()) {
    bankName = orgMatch[1].trim();
  }

  // Regex to extract all <STMTTRN> blocks (handles SGML or XML style)
  const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>|$))/gi;
  let match;

  const getTagValue = (block: string, tag: string): string => {
    // Match <TAG>value</TAG> or <TAG>value
    const regex = new RegExp(`<${tag}>(.*?)(?:<\\/${tag}>|<|\\r|\\n|$)`, 'i');
    const m = block.match(regex);
    return m ? m[1].trim() : '';
  };

  while ((match = trnRegex.exec(ofxText)) !== null) {
    const block = match[1];
    if (!block.trim()) continue;

    const trnType = getTagValue(block, 'TRNTYPE').toUpperCase();
    const dtPostedRaw = getTagValue(block, 'DTPOSTED');
    const trnAmtRaw = getTagValue(block, 'TRNAMT');
    const fitId = getTagValue(block, 'FITID');
    const name = getTagValue(block, 'NAME') || getTagValue(block, 'PAYEE');
    const memo = getTagValue(block, 'MEMO');

    // Parse date (OFX YYYYMMDDHHMMSS or YYYYMMDD)
    let dateStr = '';
    if (dtPostedRaw && dtPostedRaw.length >= 8) {
      const y = dtPostedRaw.substring(0, 4);
      const m = dtPostedRaw.substring(4, 6);
      const d = dtPostedRaw.substring(6, 8);
      dateStr = `${y}-${m}-${d}`;
    }

    // Parse Amount
    const amtNum = parseFloat(trnAmtRaw.replace(',', '.')) || 0;
    const isCredit = trnType === 'CREDIT' || trnType === 'DEP' || trnType === 'DIRECTDEP' || amtNum > 0;
    const tipo = isCredit ? 'Receita' : 'Despesa';
    const valorAbs = Math.abs(amtNum);

    // Entity & Description
    const entity = name || memo || `Movimento OFX ${fitId}`;
    const desc = memo && memo !== name ? `${memo} (Ref: ${fitId})` : (fitId ? `ID: ${fitId}` : `Extrato OFX ${fileName}`);

    // Payment method deduction
    let method = 'Transferência Bancária';
    if (trnType === 'POS' || trnType === 'ATM') method = 'Cartão de Débito';
    else if (trnType === 'DIRECTDEBIT') method = 'Débito Direto';
    else if (trnType === 'PAYMENT' || trnType === 'XFER') method = 'Transferência Bancária';

    rows.push({
      'Tipo de Movimento': tipo,
      'Data da Operação': dateStr,
      'Origem / Entidade': entity,
      'Montante (€)': valorAbs,
      'Categoria': '',
      'Método de Pagamento': method,
      'Recorrente': 'Não',
      'Descrição / Memo': desc,
      'ID Transação OFX': fitId,
      'Código TRNTYPE': trnType
    });
  }

  const columns = [
    'Tipo de Movimento',
    'Data da Operação',
    'Origem / Entidade',
    'Montante (€)',
    'Categoria',
    'Método de Pagamento',
    'Recorrente',
    'Descrição / Memo',
    'ID Transação OFX'
  ];

  return {
    formatName: 'OFX (Open Financial Exchange)',
    bankName,
    columns,
    data: rows,
    autoMappings: {
      entityField: 'Origem / Entidade',
      amountField: 'Montante (€)',
      dateField: 'Data da Operação',
      categoryField: 'Categoria',
      descriptionField: 'Descrição / Memo',
      methodField: 'Método de Pagamento',
      recurringField: 'Recorrente',
      typeField: 'Tipo de Movimento'
    }
  };
}

/**
 * Parse CAMT.053 ISO 20022 XML Bank Statement format
 */
export function parseCAMT053Statement(xmlText: string, fileName: string): BankParseResult {
  const rows: Record<string, any>[] = [];
  let bankName = 'SEPA CAMT.053';

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Extract bank/institution name if available in XML
    const grpHdrName = xmlDoc.querySelector('GrpHdr > MsgRcpt > Nm, GrpHdr > InitgPty > Nm, Stmt > Acct > Svcr > FinInstnId > Nm');
    if (grpHdrName && grpHdrName.textContent?.trim()) {
      bankName = grpHdrName.textContent.trim();
    }

    const ntryList = Array.from(xmlDoc.querySelectorAll('Ntry'));

    ntryList.forEach((ntry, idx) => {
      // Amount and Credit/Debit Indicator
      const amtEl = ntry.querySelector('Amt');
      const amtVal = amtEl ? parseFloat(amtEl.textContent || '0') : 0;
      const cdtDbtInd = ntry.querySelector('CdtDbtInd')?.textContent?.trim().toUpperCase() || '';

      const isCredit = cdtDbtInd === 'CRDT' || (amtVal > 0 && cdtDbtInd !== 'DBIT');
      const tipo = isCredit ? 'Receita' : 'Despesa';
      const valorAbs = Math.abs(amtVal);

      // Date
      const bookgDt = ntry.querySelector('BookgDt > Dt, ValDt > Dt, Dt')?.textContent?.trim() || '';
      let dateFormatted = '';
      if (bookgDt) {
        // XML ISO dates are YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
        dateFormatted = bookgDt.substring(0, 10);
      }

      // Related Parties (Debtor / Creditor)
      const dbtrNm = ntry.querySelector('RltdPties > Dbtr > Nm, TxDtls > RltdPties > Dbtr > Nm')?.textContent?.trim() || '';
      const cdtrNm = ntry.querySelector('RltdPties > Cdtr > Nm, TxDtls > RltdPties > Cdtr > Nm')?.textContent?.trim() || '';
      
      const ustrdInfo = Array.from(ntry.querySelectorAll('RmtInf > Ustrd, AddtlNtryInf, Purp > Prtry, NtryDtls > TxDtls > AddtlTxInf'))
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .join(' - ');

      let entity = isCredit ? (dbtrNm || cdtrNm || ustrdInfo || `Entidade #${idx + 1}`) : (cdtrNm || dbtrNm || ustrdInfo || `Entidade #${idx + 1}`);

      if (!entity || entity.length > 80) {
        entity = ustrdInfo ? ustrdInfo.substring(0, 60) : `Movimento CAMT #${idx + 1}`;
      }

      const desc = ustrdInfo || `Extrato CAMT.053 - ${fileName}`;

      rows.push({
        'Tipo de Movimento': tipo,
        'Data da Operação': dateFormatted,
        'Origem / Entidade': entity,
        'Montante (€)': valorAbs,
        'Categoria': '',
        'Método de Pagamento': 'Transferência SEPA',
        'Recorrente': 'Não',
        'Descrição / Informação': desc,
        'Indicador CdtDbt': cdtDbtInd
      });
    });
  } catch (err) {
    console.error('Erro ao processar ficheiro XML CAMT.053:', err);
  }

  const columns = [
    'Tipo de Movimento',
    'Data da Operação',
    'Origem / Entidade',
    'Montante (€)',
    'Categoria',
    'Método de Pagamento',
    'Recorrente',
    'Descrição / Informação'
  ];

  return {
    formatName: 'CAMT.053 (ISO 20022 SEPA XML)',
    bankName,
    columns,
    data: rows,
    autoMappings: {
      entityField: 'Origem / Entidade',
      amountField: 'Montante (€)',
      dateField: 'Data da Operação',
      categoryField: 'Categoria',
      descriptionField: 'Descrição / Informação',
      methodField: 'Método de Pagamento',
      recurringField: 'Recorrente',
      typeField: 'Tipo de Movimento'
    }
  };
}

/**
 * Detect specific Portuguese / International Bank CSV formats
 */
export function detectBankCSVFormat(columns: string[]): {
  isBankCSV: boolean;
  bankName: string;
  mappings?: BankParseResult['autoMappings'];
} {
  const lowerCols = columns.map(c => c.toLowerCase().trim());

  // 1. CGD (Caixa Geral de Depósitos)
  if (lowerCols.some(c => c.includes('data mov')) && lowerCols.some(c => c.includes('débito') || c.includes('debito')) && lowerCols.some(c => c.includes('crédito') || c.includes('credito'))) {
    return {
      isBankCSV: true,
      bankName: 'Caixa Geral de Depósitos (CGD)',
      mappings: {
        entityField: columns.find(c => c.toLowerCase().includes('descri')) || columns[0],
        amountField: columns.find(c => c.toLowerCase().includes('valor') || c.toLowerCase().includes('montante') || c.toLowerCase().includes('débito') || c.toLowerCase().includes('debito')) || columns[1],
        dateField: columns.find(c => c.toLowerCase().includes('data mov') || c.toLowerCase().includes('data')) || '',
        categoryField: '',
        descriptionField: columns.find(c => c.toLowerCase().includes('descri')) || '',
        methodField: '',
        recurringField: '',
        typeField: ''
      }
    };
  }

  // 2. Millennium bcp / ActivoBank
  if (lowerCols.some(c => c.includes('data lançamento') || c.includes('data lancamento')) && lowerCols.some(c => c.includes('montante') || c.includes('saldo'))) {
    return {
      isBankCSV: true,
      bankName: 'Millennium bcp / ActivoBank',
      mappings: {
        entityField: columns.find(c => c.toLowerCase().includes('descri')) || columns[0],
        amountField: columns.find(c => c.toLowerCase().includes('montante')) || columns[1],
        dateField: columns.find(c => c.toLowerCase().includes('data')) || '',
        categoryField: '',
        descriptionField: columns.find(c => c.toLowerCase().includes('descri')) || '',
        methodField: '',
        recurringField: '',
        typeField: ''
      }
    };
  }

  // 3. Santander Portugal
  if (lowerCols.some(c => c.includes('data de lançamento') || c.includes('data de lancamento')) || (lowerCols.some(c => c.includes('importe')) && lowerCols.some(c => c.includes('saldo')))) {
    return {
      isBankCSV: true,
      bankName: 'Banco Santander',
      mappings: {
        entityField: columns.find(c => c.toLowerCase().includes('descri')) || columns[0],
        amountField: columns.find(c => c.toLowerCase().includes('importe') || c.toLowerCase().includes('valor')) || columns[1],
        dateField: columns.find(c => c.toLowerCase().includes('data')) || '',
        categoryField: '',
        descriptionField: columns.find(c => c.toLowerCase().includes('descri')) || '',
        methodField: '',
        recurringField: '',
        typeField: ''
      }
    };
  }

  // 4. Revolut
  if (lowerCols.includes('started date') || lowerCols.includes('completed date') || (lowerCols.includes('product') && lowerCols.includes('fee'))) {
    return {
      isBankCSV: true,
      bankName: 'Revolut',
      mappings: {
        entityField: columns.find(c => c.toLowerCase() === 'description') || columns[0],
        amountField: columns.find(c => c.toLowerCase() === 'amount') || columns[1],
        dateField: columns.find(c => c.toLowerCase().includes('date')) || '',
        categoryField: '',
        descriptionField: columns.find(c => c.toLowerCase() === 'description') || '',
        methodField: '',
        recurringField: '',
        typeField: columns.find(c => c.toLowerCase() === 'type') || ''
      }
    };
  }

  // 5. Wise / TransferWise
  if (lowerCols.includes('transferwise id') || (lowerCols.includes('payment reference') && lowerCols.includes('running balance'))) {
    return {
      isBankCSV: true,
      bankName: 'Wise',
      mappings: {
        entityField: columns.find(c => c.toLowerCase() === 'description') || columns[0],
        amountField: columns.find(c => c.toLowerCase() === 'amount') || columns[1],
        dateField: columns.find(c => c.toLowerCase() === 'date') || '',
        categoryField: '',
        descriptionField: columns.find(c => c.toLowerCase().includes('reference')) || '',
        methodField: '',
        recurringField: '',
        typeField: ''
      }
    };
  }

  return { isBankCSV: false, bankName: 'Ficheiro Genérico' };
}
