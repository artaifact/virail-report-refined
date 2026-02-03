import { useState, useCallback, useRef, useEffect } from 'react';

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  message: string;
}

interface UseRateLimitReturn {
  rateLimitState: RateLimitState;
  handleRateLimitError: (error: unknown) => boolean;
  resetRateLimit: () => void;
  isRateLimited: boolean;
}

/**
 * Hook pour gérer le rate limiting côté client
 * Gère automatiquement le décompte et l'affichage des messages d'erreur 429
 */
export function useRateLimit(): UseRateLimitReturn {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: 0,
    message: '',
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleRateLimitError = useCallback((error: unknown): boolean => {
    // Vérifier si c'est une erreur 429
    let is429 = false;
    let data: { error?: string; message?: string; retry_after?: number } = {};

    // Gestion des erreurs fetch Response
    if (error instanceof Response && error.status === 429) {
      is429 = true;
    }

    // Gestion des erreurs avec response (axios-like ou fetch wrapper)
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;

      // Check for response object with status
      if (err.response && typeof err.response === 'object') {
        const response = err.response as Record<string, unknown>;
        if (response.status === 429) {
          is429 = true;
          data = (response.data as typeof data) || {};
        }
      }

      // Check for direct status property
      if (err.status === 429) {
        is429 = true;
        data = err as typeof data;
      }
    }

    if (!is429) {
      return false;
    }

    const retryAfter = data.retry_after || 60;
    const message = data.message || 'Trop de requêtes. Veuillez réessayer plus tard.';

    setRateLimitState({
      isLimited: true,
      retryAfter,
      message,
    });

    // Décompte automatique
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setRateLimitState((prev) => {
        if (prev.retryAfter <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return { isLimited: false, retryAfter: 0, message: '' };
        }
        return { ...prev, retryAfter: prev.retryAfter - 1 };
      });
    }, 1000);

    return true;
  }, []);

  const resetRateLimit = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRateLimitState({ isLimited: false, retryAfter: 0, message: '' });
  }, []);

  return {
    rateLimitState,
    handleRateLimitError,
    resetRateLimit,
    isRateLimited: rateLimitState.isLimited,
  };
}
