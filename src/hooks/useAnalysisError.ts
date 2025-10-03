import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AnalysisError {
  type: 'playwright' | 'network' | 'content' | 'server' | 'quota' | 'unknown';
  message: string;
  originalError?: string;
  url?: string;
  retryable: boolean;
}

export const useAnalysisError = () => {
  const [currentError, setCurrentError] = useState<AnalysisError | null>(null);
  const { toast } = useToast();

  const parseError = useCallback((error: any, url?: string): AnalysisError => {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Erreurs Playwright spécifiques
    if (errorMessage.includes('Page crashed') || errorMessage.includes('crashed')) {
      return {
        type: 'playwright',
        message: `Le site ${url || 'demandé'} est incompatible avec notre analyseur. Essayez un autre site.`,
        originalError: errorMessage,
        url,
        retryable: false
      };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
      return {
        type: 'network',
        message: `Le site ${url || 'demandé'} met trop de temps à répondre. Essayez plus tard.`,
        originalError: errorMessage,
        url,
        retryable: true
      };
    }

    if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || errorMessage.includes('blocked')) {
      return {
        type: 'playwright',
        message: `Le site ${url || 'demandé'} bloque notre analyseur (protection anti-bot).`,
        originalError: errorMessage,
        url,
        retryable: false
      };
    }

    if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || errorMessage.includes('ENOTFOUND')) {
      return {
        type: 'network',
        message: `Le site ${url || 'demandé'} n'est pas accessible ou n'existe pas.`,
        originalError: errorMessage,
        url,
        retryable: true
      };
    }

    // Erreurs de contenu
    if (errorMessage.includes('422') || errorMessage.includes('Unprocessable Entity')) {
      return {
        type: 'content',
        message: `Impossible d'analyser ${url || 'ce site'}. Le contenu pose problème.`,
        originalError: errorMessage,
        url,
        retryable: false
      };
    }

    // Erreurs de quota
    if (errorMessage.includes('quota') || errorMessage.includes('limite') || errorMessage.includes('non autorisée')) {
      return {
        type: 'quota',
        message: 'Vous avez atteint votre limite d\'utilisation. Passez à un plan supérieur.',
        originalError: errorMessage,
        retryable: false
      };
    }

    // Erreurs serveur
    if (errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('502')) {
      return {
        type: 'server',
        message: 'Service temporairement indisponible. Réessayez plus tard.',
        originalError: errorMessage,
        retryable: true
      };
    }

    // Erreur inconnue
    return {
      type: 'unknown',
      message: errorMessage || 'Une erreur inattendue s\'est produite.',
      originalError: errorMessage,
      url,
      retryable: true
    };
  }, []);

  const handleError = useCallback((error: any, url?: string, showToast = true) => {
    const parsedError = parseError(error, url);
    setCurrentError(parsedError);

    if (showToast) {
      toast({
        title: getErrorTitle(parsedError.type),
        description: parsedError.message,
        variant: getErrorVariant(parsedError.type),
      });
    }

    console.error('Erreur d\'analyse:', parsedError);
    return parsedError;
  }, [parseError, toast]);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const retry = useCallback(() => {
    if (currentError?.retryable) {
      clearError();
      return true;
    }
    return false;
  }, [currentError, clearError]);

  return {
    currentError,
    handleError,
    clearError,
    retry,
    canRetry: currentError?.retryable || false
  };
};

// Fonctions utilitaires
const getErrorTitle = (type: AnalysisError['type']): string => {
  switch (type) {
    case 'playwright':
      return 'Site incompatible';
    case 'network':
      return 'Problème de réseau';
    case 'content':
      return 'Contenu problématique';
    case 'server':
      return 'Erreur serveur';
    case 'quota':
      return 'Limite atteinte';
    default:
      return 'Erreur';
  }
};

const getErrorVariant = (type: AnalysisError['type']): 'default' | 'destructive' => {
  switch (type) {
    case 'server':
    case 'network':
      return 'default';
    case 'playwright':
    case 'content':
    case 'quota':
    case 'unknown':
      return 'destructive';
    default:
      return 'destructive';
  }
};
