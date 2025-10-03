import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  url?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, url }) => {
  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('incompatible avec notre analyseur')) {
      return 'incompatible';
    }
    if (errorMessage.includes('met trop de temps à répondre')) {
      return 'timeout';
    }
    if (errorMessage.includes('bloque notre analyseur')) {
      return 'blocked';
    }
    if (errorMessage.includes('n\'est pas accessible')) {
      return 'not_found';
    }
    if (errorMessage.includes('contenu du site pose problème')) {
      return 'content_issue';
    }
    if (errorMessage.includes('Rapport non trouvé')) {
      return 'report_not_found';
    }
    if (errorMessage.includes('Accès refusé')) {
      return 'access_denied';
    }
    if (errorMessage.includes('Trop de requêtes')) {
      return 'rate_limited';
    }
    if (errorMessage.includes('Erreur serveur') || errorMessage.includes('Service indisponible')) {
      return 'server_error';
    }
    return 'generic';
  };

  const getErrorDetails = (type: string) => {
    switch (type) {
      case 'incompatible':
        return {
          title: 'Site incompatible',
          description: 'Ce site utilise des technologies qui ne sont pas compatibles avec notre analyseur automatique.',
          suggestions: [
            'Essayez un autre site web',
            'Contactez notre support pour plus d\'informations',
            'Certains sites avec beaucoup de JavaScript complexe peuvent poser problème'
          ],
          severity: 'warning'
        };
      case 'timeout':
        return {
          title: 'Site trop lent',
          description: 'Le site met trop de temps à répondre.',
          suggestions: [
            'Réessayez plus tard',
            'Vérifiez que le site est accessible dans votre navigateur',
            'Certains sites peuvent être surchargés'
          ],
          severity: 'info'
        };
      case 'blocked':
        return {
          title: 'Site protégé',
          description: 'Le site bloque notre analyseur automatique.',
          suggestions: [
            'Ce site utilise probablement des protections anti-bot (Cloudflare, etc.)',
            'Essayez un autre site',
            'Contactez le propriétaire du site si possible'
          ],
          severity: 'warning'
        };
      case 'not_found':
        return {
          title: 'Site inaccessible',
          description: 'Le site n\'est pas accessible ou n\'existe pas.',
          suggestions: [
            'Vérifiez l\'URL',
            'Assurez-vous que le site est en ligne',
            'Réessayez avec http:// ou https://'
          ],
          severity: 'error'
        };
      case 'content_issue':
        return {
          title: 'Contenu problématique',
          description: 'Le contenu du site pose problème à notre analyseur.',
          suggestions: [
            'Le site contient peut-être du contenu protégé ou mal formaté',
            'Essayez avec un autre site',
            'Contactez notre support pour assistance'
          ],
          severity: 'warning'
        };
      case 'report_not_found':
        return {
          title: 'Rapport introuvable',
          description: 'Le rapport demandé n\'existe pas ou a été supprimé.',
          suggestions: [
            'Vérifiez l\'identifiant du rapport',
            'Actualisez la liste des rapports',
            'Le rapport a peut-être expiré'
          ],
          severity: 'info'
        };
      case 'access_denied':
        return {
          title: 'Accès refusé',
          description: 'Vous n\'avez pas les permissions pour accéder à cette ressource.',
          suggestions: [
            'Vérifiez vos droits d\'accès',
            'Connectez-vous avec un compte approprié',
            'Contactez l\'administrateur'
          ],
          severity: 'error'
        };
      case 'rate_limited':
        return {
          title: 'Trop de requêtes',
          description: 'Vous avez fait trop de requêtes récemment.',
          suggestions: [
            'Attendez quelques minutes',
            'Réduisez la fréquence de vos requêtes',
            'Passez à un plan supérieur pour plus de quotas'
          ],
          severity: 'info'
        };
      case 'server_error':
        return {
          title: 'Erreur serveur',
          description: 'Notre service rencontre des difficultés temporaires.',
          suggestions: [
            'Réessayez dans quelques instants',
            'Actualisez la page',
            'Contactez le support si le problème persiste'
          ],
          severity: 'error'
        };
      default:
        return {
          title: 'Erreur',
          description: 'Une erreur inattendue s\'est produite.',
          suggestions: [
            'Réessayez l\'opération',
            'Actualisez la page',
            'Contactez le support si le problème persiste'
          ],
          severity: 'error'
        };
    }
  };

  const errorType = getErrorType(error);
  const errorDetails = getErrorDetails(errorType);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getSeverityColor(errorDetails.severity) as any}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {errorDetails.title}
        {url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            className="h-auto p-1 ml-2"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{errorDetails.description}</p>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Suggestions :</p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            {errorDetails.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {onRetry && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Réessayer
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
