import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  CreditCard, 
  Crown, 
  RefreshCw, 
  X, 
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PaymentError {
  title: string;
  message: string;
  code: string;
  details?: any;
}

interface ErrorHandlerProps {
  error: PaymentError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  onUpgrade?: () => void;
  showAsDialog?: boolean;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onDismiss,
  onRetry,
  onUpgrade,
  showAsDialog = false
}) => {
  if (!error) return null;

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'QUOTA_EXCEEDED':
        return <Crown className="h-5 w-5" />;
      case 'PAYMENT_FAILED':
        return <CreditCard className="h-5 w-5" />;
      case 'UNAUTHORIZED':
        return <Shield className="h-5 w-5" />;
      case 'SERVER_ERROR':
        return <Zap className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getErrorColor = (code: string) => {
    switch (code) {
      case 'QUOTA_EXCEEDED':
        return 'border-purple-200 bg-purple-50 text-purple-800';
      case 'PAYMENT_FAILED':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'UNAUTHORIZED':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'SERVER_ERROR':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getErrorActions = (code: string) => {
    switch (code) {
      case 'QUOTA_EXCEEDED':
        return (
          <div className="flex gap-2 mt-3">
            {onUpgrade && (
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                Voir les plans
              </Button>
            )}
            {onDismiss && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onDismiss}
              >
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            )}
          </div>
        );
      
      case 'PAYMENT_FAILED':
        return (
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button 
                size="sm" 
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
            <Link to="/help">
              <Button 
                size="sm" 
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Aide
              </Button>
            </Link>
            {onDismiss && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onDismiss}
              >
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            )}
          </div>
        );
      
      case 'UNAUTHORIZED':
        return (
          <div className="flex gap-2 mt-3">
            <Link to="/login">
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Se connecter
              </Button>
            </Link>
            {onDismiss && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onDismiss}
              >
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            )}
          </div>
        );
      
      case 'SERVER_ERROR':
        return (
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button 
                size="sm" 
                onClick={onRetry}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
            <Link to="/help">
              <Button 
                size="sm" 
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Support
              </Button>
            </Link>
            {onDismiss && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onDismiss}
              >
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            )}
          </div>
        );
      
      default:
        return (
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button 
                size="sm" 
                onClick={onRetry}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
            {onDismiss && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onDismiss}
              >
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            )}
          </div>
        );
    }
  };

  const ErrorContent = () => (
    <div className={`p-4 rounded-lg border ${getErrorColor(error.code)}`}>
      <div className="flex items-start gap-3">
        {getErrorIcon(error.code)}
        <div className="flex-1">
          <h4 className="font-semibold mb-1">
            {error.title}
          </h4>
          <p className="text-sm mb-3">
            {error.message}
          </p>
          {getErrorActions(error.code)}
        </div>
      </div>
    </div>
  );

  if (showAsDialog) {
    return (
      <Dialog open={!!error} onOpenChange={() => onDismiss?.()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getErrorIcon(error.code)}
              {error.title}
            </DialogTitle>
            <DialogDescription>
              {error.message}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {getErrorActions(error.code)}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <ErrorContent />;
};

// Hook pour créer des erreurs typées
export const createPaymentError = (
  code: string,
  message: string,
  details?: any
): PaymentError => {
  const errorTitles: Record<string, string> = {
    QUOTA_EXCEEDED: 'Limite d\'usage atteinte',
    PAYMENT_FAILED: 'Échec du paiement',
    UNAUTHORIZED: 'Session expirée',
    SERVER_ERROR: 'Erreur serveur',
    UNKNOWN_ERROR: 'Erreur inattendue',
  };

  return {
    title: errorTitles[code] || 'Erreur',
    message,
    code,
    details,
  };
};

// Hook pour gérer les erreurs API
export const handleApiError = (error: any): PaymentError => {
  if (error.response?.status === 403) {
    return createPaymentError(
      'QUOTA_EXCEEDED',
      error.response.data?.detail?.message || 'Fonctionnalité non autorisée',
      error.response.data?.detail
    );
  }
  
  if (error.response?.status === 401) {
    return createPaymentError(
      'UNAUTHORIZED',
      'Session expirée. Veuillez vous reconnecter.'
    );
  }
  
  if (error.response?.status === 500) {
    return createPaymentError(
      'SERVER_ERROR',
      'Erreur serveur. Veuillez réessayer plus tard.'
    );
  }
  
  if (error.response?.status === 402) {
    return createPaymentError(
      'PAYMENT_FAILED',
      'Échec du paiement. Veuillez vérifier vos informations de paiement.'
    );
  }
  
  return createPaymentError(
    'UNKNOWN_ERROR',
    error.message || 'Une erreur inattendue s\'est produite.'
  );
};

export default ErrorHandler;
