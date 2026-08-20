import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedRow {
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  entity: string;
  notes?: string;
  method?: string;
}

/**
 * Parses a CSV file and returns a promise resolving to an array of ParsedRow.
 */
export function parseCSVFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data.map((row: any) => {
            // Try to resolve columns dynamically
            const amount = parseFloat(String(row.amount || row.valor || row.Amount || 0).replace(/[^\d.-]/g, ''));
            const type = String(row.type || row.tipo || '').toLowerCase().includes('rec') || amount > 0 ? 'income' : 'expense';
            const date = row.date || row.data || row.Date || new Date().toISOString().split('T')[0];
            const description = row.description || row.descricao || row.Description || row.entity || row.entidade || 'Transação Importada';
            const category = row.category || row.categoria || row.Category || 'Geral';
            const entity = row.entity || row.entidade || row.Entity || 'Desconhecido';
            const notes = row.notes || row.notas || row.Notes || '';
            const method = row.method || row.metodo || row.Method || 'Importado';

            return {
              date,
              amount: Math.abs(amount),
              type,
              description,
              category,
              entity,
              notes,
              method
            } as ParsedRow;
          });
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * Parses an Excel (.xlsx or .xls) file and returns a promise resolving to an array of ParsedRow.
 */
export function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Nenhum dado lido do ficheiro.'));
          return;
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const rows = json.map((row: any) => {
          const amount = parseFloat(String(row.amount || row.valor || row.Amount || row.Valor || 0).replace(/[^\d.-]/g, ''));
          const type = String(row.type || row.tipo || row.Tipo || '').toLowerCase().includes('rec') || amount > 0 ? 'income' : 'expense';
          const date = row.date || row.data || row.Data || row.Date || new Date().toISOString().split('T')[0];
          const description = row.description || row.descricao || row.Descricao || row.entity || row.entidade || 'Transação Importada';
          const category = row.category || row.categoria || row.Categoria || 'Geral';
          const entity = row.entity || row.entidade || row.Entidade || 'Desconhecido';
          const notes = row.notes || row.notas || row.Notas || '';
          const method = row.method || row.metodo || row.Metodo || 'Importado';

          return {
            date,
            amount: Math.abs(amount),
            type,
            description,
            category,
            entity,
            notes,
            method
          } as ParsedRow;
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
