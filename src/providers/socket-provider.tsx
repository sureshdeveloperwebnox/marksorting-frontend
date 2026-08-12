'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { PushNotificationToast } from '@/components/notifications/push-notification-toast';

export interface AppNotification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  status: 'UNREAD' | 'READ';
  meta_data: Record<string, any> | null;
  created_at: string;
}

interface SocketContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const SocketContext = createContext<SocketContextValue>({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: ReactNode;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4010';

export function SocketProvider({ children }: SocketProviderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?take=30');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    fetchNotifications();

    const socket = io(`${BACKEND_URL}/notifications`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('notification', (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.custom(
        (toastId) => (
          <PushNotificationToast
            title={notification.title}
            message={notification.message}
            type={notification.type}
            createdAt={notification.created_at}
            onDismiss={() => toast.dismiss(toastId)}
          />
        ),
        { duration: 6000 },
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, fetchNotifications]);

  return (
    <SocketContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
