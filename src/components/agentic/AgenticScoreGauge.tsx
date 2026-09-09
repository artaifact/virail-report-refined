import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AgenticScoreGaugeProps {
  score: number;
  targetUrl: string;
}

export const AgenticScoreGauge: React.FC<AgenticScoreGaugeProps> = ({ score, targetUrl }) => {
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
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-card border border-border/80 shadow-sm">
      {/* Gauge SVG */}
      <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/20"
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
          <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">
            {score}
          </span>
          <span className="text-xs text-muted-foreground font-semibold">/100</span>
        </div>
      </div>

      {/* Details & Alert */}
      <div className="flex-1 space-y-3 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <Badge
            variant={badgeVariant}
            className="px-3 py-1 text-xs font-semibold tracking-wide flex items-center gap-1.5"
            style={{
              backgroundColor: score >= 80 ? 'rgba(16, 185, 129, 0.15)' : score >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e',
              border: `1px solid ${score >= 80 ? 'rgba(16, 185, 129, 0.3)' : score >= 50 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
            {targetUrl}
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground">
          Score Global d'Éligibilité Machine-to-Machine
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
};
