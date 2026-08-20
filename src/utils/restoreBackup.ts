/**
 * Restores local application state from a parsed JSON backup payload.
 */
export function restoreBackup(backupContent: any): boolean {
  if (!backupContent || typeof backupContent !== 'object') {
    throw new Error('Formato de backup inválido.');
  }

  // Validate version / structure
  if (!backupContent.data || typeof backupContent.data !== 'object') {
    throw new Error('Conteúdo do ficheiro de cópia de segurança corrompido ou incompatível.');
  }

  const data = backupContent.data;

  // Restore keys safely
  Object.entries(data).forEach(([key, val]) => {
    try {
      if (val !== undefined && val !== null) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (e) {
      console.error(`Erro ao restaurar chave ${key}:`, e);
    }
  });

  return true;
}
