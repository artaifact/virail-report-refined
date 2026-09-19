import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Code2, 
  ShoppingCart, 
  CreditCard, 
  Network,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { AgenticPillar } from '@/services/agenticService';

interface AgenticPillarsViewProps {
  pillars: Record<string, AgenticPillar | undefined>;
}

const PILLAR_CONFIG: Record<string, { title: string; desc: string; icon: any }> = {
  crawl_doc: {
    title: "1. Ingestion & Documentation Machine",
    desc: "/llms.txt, route miroir .md, négociation Accept: text/markdown",
    icon: FileText,
  },
  json_interfaces: {
    title: "2. Contrats & Interfaces de Données",
    desc: "OpenAPI 3.1 publique typée, grille tarifaire /api/pricing.json",
    icon: Code2,
  },
  merchant_schema: {
    title: "3. Achetabilité Sémantique",
    desc: "Schema.org Product & Offer (JSON-LD) avec prix et devise",
    icon: ShoppingCart,
  },
  m2m_settlement: {
    title: "4. Règlement M2M (Protocole x402)",
    desc: "Handshake HTTP 402, rails de micro-paiement Base USDC (EIP-3009)",
    icon: CreditCard,
  },
  distribution_channels: {
    title: "5. Canaux de Distribution",
    desc: "Indexation sur les 8 registres et protocoles d'agents",
    icon: Network,
  },
};

export const AgenticPillarsView: React.FC<AgenticPillarsViewProps> = ({ pillars }) => {
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const togglePillar = (key: string) => {
    setExpandedPillars(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated: Record<string, boolean> = {};
    Object.keys(PILLAR_CONFIG).forEach(k => {
      updated[k] = nextState;
    });
    setExpandedPillars(updated);
  };

  // Compute total metrics across pillars
  const totalChecksCount = Object.keys(PILLAR_CONFIG).reduce((acc, key) => {
    return acc + (pillars[key]?.checks?.length ?? 0);
  }, 0);

  return (
    <div className="space-y-4 font-sans">
      {/* ─── Control Bar for Cognitive Load Reduction ────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border border-border/80 px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground">5 Piliers d'Éligibilité M2M</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{totalChecksCount} critères vérifiés au total</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleAll}
          className="text-xs font-medium gap-1.5 h-7 px-2.5 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{allExpanded ? 'Vue synthétique (recommandée)' : 'Déplier tous les critères'}</span>
        </Button>
      </div>

      {/* ─── The 5 Pillars Cards Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(PILLAR_CONFIG).map(([key, config]) => {
          const pillar = pillars[key] || { score: 0, max: 20, checks: [] };
          const Icon = config.icon;
          const pct = Math.min(100, Math.round((pillar.score / (pillar.max || 1)) * 100));
          const isExpanded = expandedPillars[key] ?? allExpanded;

          // Categorize checks
          const checks = pillar.checks || [];
          const okChecks = checks.filter(c => c.startsWith('✅') || c.includes('[OK]') || c.startsWith('+'));
          const warnChecks = checks.filter(c => c.startsWith('⚠️') || c.includes('[WARN]'));
          const failChecks = checks.filter(c => !okChecks.includes(c) && !warnChecks.includes(c));

          // First critical blocker for quick glance
          const firstBlocker = failChecks[0] || warnChecks[0];
          const cleanBlocker = firstBlocker 
            ? firstBlocker.replace(/^([✅❌⚠️]|\[OK\]|\[FAIL\]|\[WARN\])\s*/gu, '').trim()
            : null;

          let statusBadgeText = 'Non Conforme';
          let statusBadgeVariant: 'destructive' | 'secondary' | 'default' = 'destructive';
          let progressColor = 'bg-rose-500';

          if (pct >= 70) {
            statusBadgeText = 'Conforme';
            statusBadgeVariant = 'default';
            progressColor = 'bg-emerald-500';
          } else if (pct >= 35) {
            statusBadgeText = 'Partiel';
            statusBadgeVariant = 'secondary';
            progressColor = 'bg-amber-500';
          }

          return (
            <Card
              key={key}
              className="rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between p-4 space-y-3 transition-all hover:border-border/80"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-[13px] font-semibold text-foreground tracking-tight truncate">
                        {config.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug font-normal line-clamp-1">
                        {config.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/60">
                      {pillar.score} / {pillar.max} pts
                    </span>
                    <Badge variant={statusBadgeVariant} className="text-[9px] py-0 px-1.5 h-4 font-normal">
                      {statusBadgeText}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Glanceable Summary (When collapsed) */}
              {!isExpanded && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/40">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>{okChecks.length} validé{okChecks.length > 1 ? 's' : ''}</span>
                    </span>
                    {failChecks.length > 0 && (
                      <span className="flex items-center gap-1 text-rose-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                        <span>{failChecks.length} bloquant{failChecks.length > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>

                  {cleanBlocker && (
                    <p className="text-[10.5px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 truncate" title={cleanBlocker}>
                      ⚠️ {cleanBlocker}
                    </p>
                  )}
                </div>
              )}

              {/* Expanded Detailed Checks */}
              {isExpanded && (
                <div className="space-y-2 pt-2 border-t border-border animate-in fade-in-50 duration-200">
                  <ul className="space-y-1.5 text-xs text-muted-foreground font-normal">
                    {checks.map((chk, i) => {
                      const isOk = chk.startsWith('✅') || chk.includes('[OK]') || chk.startsWith('+');
                      const isWarn = chk.startsWith('⚠️') || chk.includes('[WARN]');
                      const cleanText = chk.replace(/^([✅❌⚠️]|\[OK\]|\[FAIL\]|\[WARN\])\s*/gu, '').trim();

                      return (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          {isOk ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : isWarn ? (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={isOk ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                            {cleanText}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Footer Toggle Button */}
              {checks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePillar(key)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground h-7 justify-between p-1.5 cursor-pointer mt-1 border-t border-border/40"
                >
                  <span>
                    {isExpanded 
                      ? 'Masquer les critères' 
                      : `Voir les ${checks.length} vérifications`}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
