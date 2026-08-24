import * as XLSX from 'xlsx';

/**
 * Exports data array or object sheets to a .xlsx file.
 */
export function exportExcel(data: any[] | Record<string, any[]>, filename = 'export.xlsx') {
  const wb = XLSX.utils.book_new();

  if (Array.isArray(data)) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  } else {
    // Record of sheetName -> array
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // excel sheet limit is 31 chars
    });
  }

  XLSX.writeFile(wb, filename);
}
