import { generateMonthArchivePDF, MonthArchiveSummary } from '../components/arquivo/utils/archivePDF';
import { auth } from '../lib/firebase';
//

export interface ArchiveEntity {
  id: string;
  name: string;
  month: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  size: string;
  createdAt: string;
  url: string;
}

/**
 * Generates month PDF, triggers download and creates an Archive document in LocalStorage and Firestore.
 */
export async function archivePDF(summary: MonthArchiveSummary): Promise<ArchiveEntity> {
  const { url, fileName, blob } = generateMonthArchivePDF(summary);

  // Trigger browser download
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();

  const archiveEntry: Omit<ArchiveEntity, 'id'> = {
    name: fileName,
    month: summary.month,
    totalIncome: summary.totalIncome,
    totalExpense: summary.totalExpense,
    netSavings: summary.netSavings,
    size: `${(blob.size / 1024).toFixed(1)} KB`,
    createdAt: new Date().toISOString(),
    url: url
  };

  // 1. Persist to LocalStorage
  const saved = localStorage.getItem('finanas_archives');
  const list = saved ? JSON.parse(saved) : [];
  const id = `archive_${Date.now()}`;
  const completeEntry: ArchiveEntity = { id, ...archiveEntry };
  list.unshift(completeEntry);
  localStorage.setItem('finanas_archives', JSON.stringify(list));

  // 2. Persist to Firestore if possible (non-blocking)
  try {
//
      ...archiveEntry,
      id
    });
  } catch (error) {
    console.warn('Could not archive to firestore, saved locally:', error);
  }

  return completeEntry;
}
