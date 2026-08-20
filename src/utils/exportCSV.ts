import Papa from 'papaparse';

/**
 * Exports data array to a CSV file with configurable delimiter.
 */
export function exportCSV(data: any[], filename = 'export.csv', delimiter = ';') {
  if (!data || data.length === 0) return;

  const csvString = Papa.unparse(data, {
    delimiter: delimiter,
    header: true
  });

  // Create a blob and trigger download
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
