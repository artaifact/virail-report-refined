import React from 'react';
import { cn } from '@/lib/utils';

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'A ameliorer';
  return 'Faible';
}

function getBarHex(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#EAB308';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

interface ScoreCardProps {
  title: string;
  score: number;
  description?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

export function ScoreCard({ title, score, description, icon, compact }: ScoreCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        {icon && <div className="flex-shrink-0 opacity-50">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className="text-sm font-bold text-foreground">{score}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="h-1 w-full rounded-full bg-secondary">
            <div
              className="h-1 rounded-full transition-all bg-foreground/20"
              style={{ width: `${score}%`, backgroundColor: getBarHex(score), opacity: 0.45 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-secondary" />
            <circle cx="24" cy="24" r="20" fill="none" stroke={getBarHex(score)} strokeWidth="4"
              strokeDasharray={`${(score / 100) * 125.6} 125.6`}
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{score}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">
            {getScoreLabel(score)}
          </span>
          {description && (
            <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
}
