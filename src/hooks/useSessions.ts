import { useState, useCallback, useEffect } from 'react';
import { AuthService } from '@/services/authService';
import { getErrorMessage } from '@/lib/api';
import { Session } from '@/types/api';

interface UseSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllOther: () => Promise<void>;
  currentSession: Session | null;
}

/**
 * Hook pour gérer les sessions utilisateur
 * Permet de lister, révoquer une session, ou révoquer toutes les autres sessions
 */
export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rawSessions = await AuthService.getSessions();

      // Normaliser les données en format Session
      const normalizedSessions: Session[] = rawSessions.map((s) => ({
        session_id: s.id?.toString() || (s as any).session_id || '',
        device_name: detectDeviceType(s.user_agent || ''),
        ip: s.ip || 'IP inconnue',
        user_agent: s.user_agent || 'Navigateur inconnu',
        created_at: s.created_at || new Date().toISOString(),
        last_seen_at: s.last_active_at || s.created_at || new Date().toISOString(),
        revoked_at: (s as any).revoked_at,
        is_current: s.current || false,
        location: s.location,
      }));

      setSessions(normalizedSessions);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.PROD ? 'https://api.viraill.com' : 'http://localhost:8000');

      const response = await AuthService.makeAuthenticatedRequest(
        `${API_BASE_URL}/auth/sessions/${sessionId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la révocation de la session');
      }

      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, []);

  const revokeAllOther = useCallback(async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.PROD ? 'https://api.viraill.com' : 'http://localhost:8000');

      const response = await AuthService.makeAuthenticatedRequest(
        `${API_BASE_URL}/auth/sessions/all`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la révocation des sessions');
      }

      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const currentSession = sessions.find((s) => s.is_current) || null;

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    revokeSession,
    revokeAllOther,
    currentSession,
  };
}

/**
 * Détecte le type d'appareil basé sur le User-Agent
 */
function detectDeviceType(userAgent: string): Session['device_name'] {
  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return 'mobile';
  }

  if (/ipad|tablet|kindle|playbook/i.test(ua)) {
    return 'tablet';
  }

  if (/windows|macintosh|linux|ubuntu/i.test(ua)) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Formate une date relative (ex: "Il y a 5 min")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

/**
 * Formate une date complète
 */
export function formatSessionDate(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
