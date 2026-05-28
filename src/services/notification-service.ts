import api from '@/lib/api';

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  status: 'UNREAD' | 'READ';
  meta_data: Record<string, any> | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationService = {
  getNotifications(skip = 0, take = 30): Promise<{ data: NotificationsResponse }> {
    return api.get(`/notifications?skip=${skip}&take=${take}`);
  },

  markAsRead(id: string) {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return api.patch('/notifications/read-all');
  },

  registerPushToken(token: string, deviceType: 'WEB' | 'ANDROID' | 'IOS' = 'WEB') {
    return api.post('/notifications/push-token', { token, device_type: deviceType });
  },
};
