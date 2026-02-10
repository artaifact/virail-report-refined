import React, { createContext, useContext, useEffect } from 'react';
import { useNotificationSocket, Notification, RunningAnalysis } from '@/hooks/useNotificationSocket';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface NotificationContextType {
  isConnected: boolean;
  notifications: Notification[];
  runningAnalyses: RunningAnalysis[];
  unreadCount: number;
  connectionError: string | null;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  reconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const { toast } = useToast();

  const {
    isConnected,
    notifications,
    runningAnalyses,
    unreadCount,
    connectionError,
    markAsRead,
    markAllAsRead,
    reconnect,
  } = useNotificationSocket();

  // Afficher un toast pour les nouvelles notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.is_read) {
        const variant = latest.notification_type === 'error' ? 'destructive' : 'default';
        toast({
          title: latest.title,
          description: latest.message,
          variant,
        });
      }
    }
  }, [notifications.length]);

  // Ne pas connecter si non authentifié
  if (!isAuthenticated) {
    return (
      <NotificationContext.Provider
        value={{
          isConnected: false,
          notifications: [],
          runningAnalyses: [],
          unreadCount: 0,
          connectionError: null,
          markAsRead: () => {},
          markAllAsRead: () => {},
          reconnect: () => {},
        }}
      >
        {children}
      </NotificationContext.Provider>
    );
  }

  return (
    <NotificationContext.Provider
      value={{
        isConnected,
        notifications,
        runningAnalyses,
        unreadCount,
        connectionError,
        markAsRead,
        markAllAsRead,
        reconnect,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
