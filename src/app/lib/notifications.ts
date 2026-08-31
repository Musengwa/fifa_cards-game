import { API_BASE_URL, getAuthHeaders } from './supabase';

export interface AppNotification {
  id: string;
  userId: string;
  type: 'member_joined' | 'invite_sent' | string;
  message: string;
  read: boolean;
  createdAt: string;
  groupId?: string;
  toUserId?: string;
}

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch notifications');
  return data.notifications || [];
};

export const markNotificationRead = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update notification');
  }
};

export const markAllNotificationsRead = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update notifications');
  }
};
