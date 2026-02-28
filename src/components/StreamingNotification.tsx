import React, { useEffect, useState } from 'react';
import { useStreaming, StreamEvent } from '@/contexts/StreamingContext';
import { cn } from '@/lib/utils';
import {
  X,
  Minimize2,
  Maximize2,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const LLM_ICONS: Record<string, string> = {
  'gpt-5': '/prompt-model-openai-for-light.svg',
  'gpt-4o': '/prompt-model-openai-for-light.svg',
  'gpt-4': '/prompt-model-openai-for-light.svg',
  'openai': '/prompt-model-openai-for-light.svg',
  'chatgpt': '/prompt-model-openai-for-light.svg',
  'claude-4-sonnet': '/prompt-model-claude.svg',
  'claude-3-sonnet': '/prompt-model-claude.svg',
  'claude': '/prompt-model-claude.svg',
  'anthropic': '/prompt-model-claude.svg',
  'gemini-2.5-pro': '/prompt-model-gemini.svg',
  'gemini-pro': '/prompt-model-gemini.svg',
  'gemini': '/prompt-model-gemini.svg',
  'mixtral-3.1': '/Mistral.png',
  'mixtral-8x7b': '/Mistral.png',
  'mistral': '/Mistral.png',
  'mixtral': '/Mistral.png',
  'sonar': '/prompt-model-perplexity.svg',
  'perplexity': '/prompt-model-perplexity.svg',
  'deepseek': '/prompt-model-deepseek.svg',
  'qwen': '/prompt-model-qwen.svg',
  'llama': '/prompt-model-llama.svg',
  'grok': '/prompt-model-grok.svg',
};

function getEventIcon(type: StreamEvent['type']) {
  switch (type) {
    case 'connecting':
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    case 'started':
      return <Zap className="h-3 w-3 text-yellow-500" />;
    case 'module_completed':
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case 'llm_completed':
      return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    case 'analysis_completed':
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    case 'error':
      return <XCircle className="h-3 w-3 text-red-500" />;
    default:
      return <Loader2 className="h-3 w-3 animate-spin text-slate-400" />;
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(start: Date, end?: Date): string {
  const duration = ((end?.getTime() || Date.now()) - start.getTime()) / 1000;
  if (duration < 60) return `${Math.round(duration)}s`;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.round(duration % 60);
  return `${minutes}m ${seconds}s`;
}

export function StreamingNotification() {
  const { sessions, activeSession, isMinimized, toggleMinimized, clearSession, setMinimized } = useStreaming();
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get the most relevant session to display
  const displaySession = activeSession || sessions[0];

  // Auto-hide after completion (after 10 seconds)
  useEffect(() => {
    if (displaySession?.status === 'completed') {
      const timer = setTimeout(() => {
        // Don't auto-hide if user is viewing
        if (!isMinimized) return;
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [displaySession?.status, isMinimized]);

  if (!displaySession) return null;

  const isActive = displaySession.status === 'connecting' || displaySession.status === 'streaming';
  const isCompleted = displaySession.status === 'completed';
  const isError = displaySession.status === 'error';

  const handleViewReport = () => {
    // Rafraîchir les données
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['llmo-reports'] });

    // Naviguer vers l'accueil si pas déjà dessus
    if (location.pathname !== '/') {
      navigate('/');
    }

    clearSession(displaySession.id);
  };

  const handleClose = () => {
    if (!isActive) {
      clearSession(displaySession.id);
    } else {
      setMinimized(true);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 transition-all duration-300 ease-out",
        "bg-white rounded-xl shadow-2xl border border-slate-200",
        "overflow-hidden",
        isMinimized ? "w-64" : "w-96"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between gap-3",
        isActive && "bg-gradient-to-r from-blue-50 to-indigo-50",
        isCompleted && "bg-gradient-to-r from-green-50 to-emerald-50",
        isError && "bg-gradient-to-r from-red-50 to-rose-50"
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isActive && <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />}
          {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
          {isError && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {isActive && "Analyse en cours"}
              {isCompleted && "Analyse terminée"}
              {isError && "Erreur d'analyse"}
            </p>
            {!isMinimized && (
              <p className="text-xs text-slate-500 truncate">
                {new URL(displaySession.url).hostname}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-600"
            onClick={toggleMinimized}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-600"
            onClick={handleClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content - Hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Progress Bar */}
          {isActive && (
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span>
                  {displaySession.currentLLM ? (
                    <span className="flex items-center gap-1.5">
                      {LLM_ICONS[displaySession.currentLLM] && (
                        <img
                          src={LLM_ICONS[displaySession.currentLLM]}
                          alt=""
                          className="h-4 w-4"
                        />
                      )}
                      {displaySession.currentLLM}
                    </span>
                  ) : (
                    "Initialisation..."
                  )}
                </span>
                <span className="font-medium">
                  {displaySession.totalModules > 0
                    ? `${Math.round((displaySession.completedModules / displaySession.totalModules) * 100)}%`
                    : formatDuration(displaySession.startedAt)
                  }
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${displaySession.totalModules > 0
                      ? (displaySession.completedModules / displaySession.totalModules) * 100
                      : 10}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Events Log */}
          <div className="max-h-48 overflow-y-auto">
            <div className="px-4 py-2 space-y-1.5">
              {displaySession.events.slice(-8).map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-start gap-2 text-xs",
                    event.type === 'error' && "text-red-600"
                  )}
                >
                  <span className="mt-0.5 shrink-0">{getEventIcon(event.type)}</span>
                  <span className="flex-1 text-slate-600">{event.message}</span>
                  <span className="text-slate-400 shrink-0 tabular-nums">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          {(isCompleted || isError) && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  Durée: {formatDuration(displaySession.startedAt, displaySession.completedAt)}
                </span>
                {isCompleted && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={handleViewReport}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir les rapports
                  </Button>
                )}
                {isError && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => clearSession(displaySession.id)}
                  >
                    Fermer
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* History Toggle */}
          {sessions.length > 1 && (
            <div className="border-t border-slate-100">
              <button
                className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                onClick={() => setShowHistory(!showHistory)}
              >
                <span>{sessions.length - 1} autre(s) analyse(s)</span>
                {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showHistory && (
                <div className="px-4 pb-2 space-y-1">
                  {sessions.slice(1).map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-slate-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {session.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                        {session.status === 'error' && <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
                        <span className="truncate text-slate-600">
                          {new URL(session.url).hostname}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-slate-400 hover:text-slate-600"
                        onClick={() => clearSession(session.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Minimized State Extra Info */}
      {isMinimized && isActive && (
        <div className="px-4 py-2 border-t border-slate-100">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{
                width: `${displaySession.totalModules > 0
                  ? (displaySession.completedModules / displaySession.totalModules) * 100
                  : 10}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
