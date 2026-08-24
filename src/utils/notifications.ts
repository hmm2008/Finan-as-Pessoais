import { useNotifications, NotificationItem } from '../contexts/NotificationContext';

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

/**
 * Creates a standard notification object.
 */
export function createNotificationPayload(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'error' = 'info',
  link?: string
): Omit<NotificationItem, 'id' | 'createdAt' | 'read'> {
  return {
    title,
    message,
    type,
    link
  };
}

/**
 * Pushes a notification to standard local storage (useful for processes running outside React render tree).
 */
export function pushLocalStorageNotification(payload: ReturnType<typeof createNotificationPayload>) {
  try {
    const raw = localStorage.getItem('finanas_notifications');
    const currentList = raw ? JSON.parse(raw) : [];
    
    const newItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...payload,
      read: false,
      createdAt: new Date().toISOString()
    };

    currentList.unshift(newItem);
    localStorage.setItem('finanas_notifications', JSON.stringify(currentList));
  } catch (e) {
    console.error('Failed to append notification to local storage', e);
  }
}
