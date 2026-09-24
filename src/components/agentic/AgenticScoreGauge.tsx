import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface AgenticScoreGaugeProps {
  score: number;
  targetUrl: string;
  auditId?: number;
  savedInDb?: boolean;
  createdAt?: string;
}

export const AgenticScoreGauge: React.FC<AgenticScoreGaugeProps> = ({
  score,
  targetUrl,
  createdAt,
}) => {
  const r = 24;
  const circumference = 2 * Math.PI * r; // ~150.8
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = '#f43f5e'; // Rose
  let label = 'Non Conforme';
  let badgeStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  let desc =
    "Non découvrable ou inachetable par les agents autonomes. Risque d'élimination silencieuse immédiate.";
  let Icon = AlertCircle;

  if (clampedScore >= 80) {
    color = '#10b981'; // Vert
    label = 'Conforme';
    badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    desc = 'Architecture conforme : achetable, exécutable et recommandée par les agents autonomes.';
    Icon = ShieldCheck;
  } else if (clampedScore >= 50) {
    color = '#f59e0b'; // Ambre
    label = 'Partiel';
    badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    desc =
      "Lisibilité partielle. Risque d'arbitrage négatif sur les critères de tarification ou de paiement M2M.";
    Icon = CheckCircle2;
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:p-4.5 rounded-xl bg-card border border-border shadow-xs">
      {/* Left: Balanced Circular Gauge + Title + InfoTooltip */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative w-14 h-14 sm:w-15 sm:h-15 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              className="text-muted/30"
            />
            <circle
              cx="30"
              cy="30"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-base sm:text-lg text-foreground tracking-tight">
            {clampedScore}
          </span>
        </div>

        <div className="flex items-center gap-2 truncate">
          <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight truncate">
            Éligibilité Machine (M2M)
          </span>
          <InfoTooltip
            title="Score Global d'Éligibilité Machine-to-Machine"
            description={desc}
          />
        </div>
      </div>

      {/* Right: Clean Status Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 ${badgeStyle}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </span>
      </div>
    </div>
  );
};
