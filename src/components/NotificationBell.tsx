import { useState } from 'react';
import { Bell, Check, CheckCheck, Loader2, AlertCircle, Info, CheckCircle2, AlertTriangle, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const notificationIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  analysis: BarChart3,
};

const notificationColors = {
  info: 'text-blue-500 bg-blue-50',
  success: 'text-emerald-500 bg-emerald-50',
  warning: 'text-amber-500 bg-amber-50',
  error: 'text-red-500 bg-red-50',
  analysis: 'text-indigo-500 bg-indigo-50',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const {
    isConnected,
    notifications,
    runningAnalyses,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-slate-100"
        >
          <Bell className="h-5 w-5 text-slate-600" />

          {/* Badge nombre de non-lues */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Indicateur de connexion */}
          <span
            className={cn(
              'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white',
              isConnected ? 'bg-emerald-500' : 'bg-slate-300'
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 p-0 shadow-xl border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-slate-500 hover:text-slate-700 h-7 px-2"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Analyses en cours */}
        {runningAnalyses.length > 0 && (
          <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              <span className="text-sm font-medium text-indigo-900">
                {runningAnalyses.length} analyse{runningAnalyses.length > 1 ? 's' : ''} en cours
              </span>
            </div>
            <div className="space-y-1.5">
              {runningAnalyses.slice(0, 3).map((analysis) => (
                <div
                  key={analysis.analysis_id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-indigo-700 truncate max-w-[200px]">
                    {analysis.url}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white border-indigo-200 text-indigo-600">
                    {analysis.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des notifications */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Bell className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.notification_type] || Info;
                const colorClass = notificationColors[notification.notification_type] || notificationColors.info;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer relative',
                      !notification.is_read && 'bg-blue-50/50'
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {/* Icône */}
                      <div className={cn('flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center', colorClass)}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm',
                            notification.is_read ? 'text-slate-600' : 'text-slate-900 font-medium'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-slate-600 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
