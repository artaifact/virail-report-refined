import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface StreamEvent {
  id: string;
  timestamp: Date;
  type: 'module_completed' | 'llm_completed' | 'analysis_completed' | 'error' | 'connecting' | 'started';
  message: string;
  data?: Record<string, unknown>;
}

export interface StreamingSession {
  id: string;
  url: string;
  status: 'connecting' | 'streaming' | 'completed' | 'error';
  progress: number;
  totalModules: number;
  completedModules: number;
  currentLLM: string | null;
  events: StreamEvent[];
  startedAt: Date;
  completedAt?: Date;
  reportId?: string;
  error?: string;
}

interface StreamingContextType {
  sessions: StreamingSession[];
  activeSession: StreamingSession | null;
  isMinimized: boolean;
  startSession: (url: string) => string;
  addEvent: (sessionId: string, event: Omit<StreamEvent, 'id' | 'timestamp'>) => void;
  updateSession: (sessionId: string, updates: Partial<StreamingSession>) => void;
  completeSession: (sessionId: string, reportId?: string) => void;
  failSession: (sessionId: string, error: string) => void;
  clearSession: (sessionId: string) => void;
  clearAllSessions: () => void;
  toggleMinimized: () => void;
  setMinimized: (minimized: boolean) => void;
}

const StreamingContext = createContext<StreamingContextType | undefined>(undefined);

export function StreamingProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<StreamingSession[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeSession = sessions.find(s => s.status === 'connecting' || s.status === 'streaming') || null;

  const startSession = useCallback((url: string): string => {
    const sessionId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: StreamingSession = {
      id: sessionId,
      url,
      status: 'connecting',
      progress: 0,
      totalModules: 0,
      completedModules: 0,
      currentLLM: null,
      events: [{
        id: `evt-${Date.now()}`,
        timestamp: new Date(),
        type: 'connecting',
        message: 'Connexion au serveur...'
      }],
      startedAt: new Date(),
    };

    setSessions(prev => [newSession, ...prev.slice(0, 4)]); // Keep max 5 sessions
    setIsMinimized(false);
    return sessionId;
  }, []);

  const addEvent = useCallback((sessionId: string, event: Omit<StreamEvent, 'id' | 'timestamp'>) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;

      const newEvent: StreamEvent = {
        ...event,
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date(),
      };

      return {
        ...session,
        events: [...session.events, newEvent].slice(-20), // Keep last 20 events
      };
    }));
  }, []);

  const updateSession = useCallback((sessionId: string, updates: Partial<StreamingSession>) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId ? { ...session, ...updates } : session
    ));
  }, []);

  const completeSession = useCallback((sessionId: string, reportId?: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        status: 'completed' as const,
        progress: 100,
        completedAt: new Date(),
        reportId,
        events: [...session.events, {
          id: `evt-${Date.now()}`,
          timestamp: new Date(),
          type: 'analysis_completed' as const,
          message: 'Analyse terminée avec succès',
        }],
      };
    }));
  }, []);

  const failSession = useCallback((sessionId: string, error: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        status: 'error' as const,
        error,
        completedAt: new Date(),
        events: [...session.events, {
          id: `evt-${Date.now()}`,
          timestamp: new Date(),
          type: 'error' as const,
          message: error,
        }],
      };
    }));
  }, []);

  const clearSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
  }, []);

  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  return (
    <StreamingContext.Provider value={{
      sessions,
      activeSession,
      isMinimized,
      startSession,
      addEvent,
      updateSession,
      completeSession,
      failSession,
      clearSession,
      clearAllSessions,
      toggleMinimized,
      setMinimized: setIsMinimized,
    }}>
      {children}
    </StreamingContext.Provider>
  );
}

export function useStreaming() {
  const context = useContext(StreamingContext);
  if (context === undefined) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
}
