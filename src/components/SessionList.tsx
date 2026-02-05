import React, { useState } from 'react';
import { useSessions, formatRelativeTime, formatSessionDate } from '@/hooks/useSessions';
import { Session } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  Globe,
  Clock,
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DeviceIcon: React.FC<{ type: Session['device_name']; className?: string }> = ({ type, className }) => {
  const iconClass = cn('w-8 h-8 text-gray-500', className);

  switch (type) {
    case 'mobile':
      return <Smartphone className={iconClass} />;
    case 'tablet':
      return <Tablet className={iconClass} />;
    case 'desktop':
      return <Monitor className={iconClass} />;
    default:
      return <HelpCircle className={iconClass} />;
  }
};

const getDeviceLabel = (type: Session['device_name']): string => {
  switch (type) {
    case 'mobile':
      return 'Mobile';
    case 'tablet':
      return 'Tablette';
    case 'desktop':
      return 'Ordinateur';
    default:
      return 'Appareil inconnu';
  }
};

interface SessionListProps {
  className?: string;
}

export const SessionList: React.FC<SessionListProps> = ({ className }) => {
  const { sessions, isLoading, error, revokeSession, revokeAllOther, fetchSessions } = useSessions();
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevoking('all');
    try {
      await revokeAllOther();
    } finally {
      setRevoking(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Aucune session active trouvée</p>
      </div>
    );
  }

  // Filtrer pour afficher la session actuelle + les 3 dernières sessions
  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions
    .filter((s) => !s.is_current)
    .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
    .slice(0, 3);

  const displayedSessions = currentSession
    ? [currentSession, ...otherSessions]
    : otherSessions;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sessions actives</h2>
          <p className="text-sm text-gray-500">
            {displayedSessions.length} session{displayedSessions.length > 1 ? 's' : ''} affichée{displayedSessions.length > 1 ? 's' : ''}
            {sessions.length > displayedSessions.length && (
              <span className="text-muted-foreground"> (sur {sessions.length} au total)</span>
            )}
          </p>
        </div>

        {otherSessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={revoking === 'all'}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {revoking === 'all' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Déconnexion...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnecter les autres
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Déconnecter toutes les autres sessions ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action déconnectera tous vos appareils sauf celui-ci.
                  Vous devrez vous reconnecter sur ces appareils.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRevokeAll}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Déconnecter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="space-y-4">
        {displayedSessions.map((session) => (
          <div
            key={session.session_id}
            className={cn(
              'p-4 rounded-lg border transition-colors',
              session.is_current
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                session.is_current ? 'bg-green-100' : 'bg-gray-100'
              )}>
                <DeviceIcon type={session.device_name} className={session.is_current ? 'text-green-600' : undefined} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">
                    {getDeviceLabel(session.device_name)}
                  </span>
                  {session.is_current && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      Session actuelle
                    </Badge>
                  )}
                </div>

                <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>IP: {session.ip}</span>
                    {session.location && <span className="text-gray-400">({session.location})</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Dernière activité: {formatRelativeTime(session.last_seen_at)}</span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Connecté le {formatSessionDate(session.created_at)}
                </p>

                {session.user_agent && (
                  <p className="mt-1 text-xs text-gray-400 truncate max-w-md" title={session.user_agent}>
                    {session.user_agent.length > 60
                      ? session.user_agent.substring(0, 60) + '...'
                      : session.user_agent}
                  </p>
                )}
              </div>

              {!session.is_current && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={revoking === session.session_id}
                      className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      {revoking === session.session_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Déconnecter cette session ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cet appareil sera déconnecté de votre compte.
                        Vous devrez vous reconnecter sur cet appareil pour y accéder à nouveau.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRevoke(session.session_id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Déconnecter
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionList;
