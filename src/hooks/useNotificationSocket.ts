import { useEffect, useRef, useState, useCallback } from 'react';
import { AuthService } from '@/services/authService';

// Types
export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error' | 'analysis';
  metadata?: Record<string, unknown>;
  timestamp: string;
  is_read: boolean;
}

export interface RunningAnalysis {
  analysis_id: string;
  session_id?: string;
  url: string;
  type: string;
  estimated_time?: number;
  status: string;
  started_at?: string;
}

interface ConnectionData {
  user_id: number;
  timestamp: string;
  running_analyses: RunningAnalysis[];
  active_tabs: number;
}

interface WebSocketMessage {
  type: string;
  data?: unknown;
  action?: string;
  timestamp?: string;
}

const getWsBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
};

export function useNotificationSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [runningAnalyses, setRunningAnalyses] = useState<RunningAnalysis[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      // Récupérer le token d'accès
      const token = await AuthService.getAccessToken();
      if (!token) {
        setConnectionError('Non authentifié');
        return;
      }

      const wsUrl = `${getWsBaseUrl()}/api/v1/notifications/ws`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        // Envoyer le token comme premier message après connexion
        // au lieu de l'exposer dans l'URL (logs serveur, historique navigateur)
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'authenticate', token }));
        }

        setIsConnected(true);
        setConnectionError(null);

        // Démarrer le heartbeat
        heartbeatInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch {
          // Ignorer les messages mal formés
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        cleanup();

        // Reconnexion automatique après 5 secondes
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.current.onerror = () => {
        setConnectionError('Erreur de connexion WebSocket');
      };

    } catch {
      setConnectionError('Impossible de se connecter');
    }
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_established': {
        const data = message.data as ConnectionData;
        setRunningAnalyses(data.running_analyses || []);
        break;
      }

      case 'notification': {
        const notification = message.data as Notification;
        setNotifications(prev => [notification, ...prev]);
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
        break;
      }

      case 'analysis_started': {
        const analysis = message.data as RunningAnalysis;
        setRunningAnalyses(prev => [...prev, analysis]);
        break;
      }

      case 'analysis_completed': {
        const data = message.data as { analysis_id: string; success: boolean };
        setRunningAnalyses(prev =>
          prev.filter(a => a.analysis_id !== data.analysis_id)
        );
        break;
      }

      case 'sync': {
        if (message.action === 'notification_read') {
          const data = message.data as { notification_id: number };
          setNotifications(prev =>
            prev.map(n => n.id === data.notification_id ? { ...n, is_read: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else if (message.action === 'all_read') {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
        }
        break;
      }

      case 'pong':
        // Heartbeat reçu, connexion active
        break;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, [cleanup]);

  const markAsRead = useCallback((notificationId: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
      // Mise à jour optimiste
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'mark_all_read' }));
      // Mise à jour optimiste
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, []);

  const getStatus = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'get_status' }));
    }
  }, []);

  // Connexion au montage
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    notifications,
    runningAnalyses,
    unreadCount,
    connectionError,
    markAsRead,
    markAllAsRead,
    getStatus,
    reconnect: connect,
  };
}
