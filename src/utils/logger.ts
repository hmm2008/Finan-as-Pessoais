//
import { auth } from '../lib/firebase';

export interface AppLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  category: 'auth' | 'transaction' | 'system' | 'backup' | 'export' | 'vehicle' | 'goal';
  details: string;
  timestamp: string;
}

/**
 * Appends a log entry to localStorage and sends it to Firestore for persistence if authenticated.
 */
export async function logEvent(
  action: string,
  category: AppLog['category'],
  details: string
): Promise<AppLog> {
  const user = auth.currentUser;
  
  const logEntry: Omit<AppLog, 'id'> = {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    action,
    category,
    details,
    timestamp: new Date().toISOString()
  };

  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const completeLog: AppLog = { id, ...logEntry };

  // 1. Write to LocalStorage
  try {
    const raw = localStorage.getItem('fin_app_logs');
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift(completeLog);
    // Limit to last 500 logs locally
    if (logs.length > 500) logs.pop();
    localStorage.setItem('fin_app_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to log event locally', e);
  }

  // 2. Write to Firestore if connected (non-blocking)
  try {
//
      ...logEntry,
      id
    });
  } catch (e) {
    // Fail silently to prevent app from breaking due to offline/permission state
  }

  return completeLog;
}
