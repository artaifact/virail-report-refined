import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

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
}) => {
  const circumference = 2 * Math.PI * 68; // r = 68
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  let color = '#f43f5e'; // Rouge
  let badgeVariant = 'destructive' as const;
  let label = 'Non Conforme (Disqualification)';
  let desc = 'Non découvrable ou inachetable par les agents autonomes. Risque d\'élimination silencieuse immédiate.';
  let Icon = AlertCircle;

  if (score >= 80) {
    color = '#10b981'; // Vert
    badgeVariant = 'default' as const;
    label = 'Agentic Native';
    desc = 'Architecture conforme : achetable, exécutable et recommandée par les agents autonomes.';
    Icon = ShieldCheck;
  } else if (score >= 50) {
    color = '#f59e0b'; // Jaune / Orange
    badgeVariant = 'secondary' as const;
    label = 'Agent-Friendly';
    desc = 'Lisibilité partielle. Risque d\'arbitrage négatif sur critères stricts de tarification ou de paiement M2M.';
    Icon = CheckCircle2;
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm font-sans">
      {/* Gauge SVG */}
      <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {score}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">/100</span>
        </div>
      </div>

      {/* Details & Alert */}
      <div className="flex-1 space-y-2.5 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <Badge
            variant={badgeVariant}
            className="px-2.5 py-1 text-xs font-medium tracking-wide flex items-center gap-1.5 rounded-lg border"
            style={{
              backgroundColor: score >= 80 ? 'rgba(16, 185, 129, 0.1)' : score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#e11d48',
              borderColor: score >= 80 ? 'rgba(16, 185, 129, 0.25)' : score >= 50 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(244, 63, 94, 0.25)',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Badge>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
            {targetUrl}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            GET v1/agentic/latest
          </span>
          {createdAt && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
              {new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {auditId && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
              #AUDIT-{auditId}
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          Score Global d'Éligibilité Machine-to-Machine
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
          {desc}
        </p>
      </div>
    </div>
  );
};
