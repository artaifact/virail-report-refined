import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListChecks, AlertCircle, ArrowUpRight } from 'lucide-react';
import type { FullReportData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PlanActionGeoOverviewProps {
  reportData: FullReportData | null;
}

export function PlanActionGeoOverview({ reportData }: PlanActionGeoOverviewProps) {
  if (!reportData?.analyses || reportData.analyses.length === 0) return null;

  const analysisWithGeoPlan = reportData.analyses
    .filter(
      (a) =>
        a.modules?.audit_geo?.plan_action_geo &&
        Array.isArray(a.modules.audit_geo.plan_action_geo) &&
        a.modules.audit_geo.plan_action_geo.length > 0
    )
    .sort(
      (a, b) =>
        (b.modules?.audit_geo?.plan_action_geo?.length || 0) -
        (a.modules?.audit_geo?.plan_action_geo?.length || 0)
    )[0];

  if (!analysisWithGeoPlan) return null;

  const auditGeo = analysisWithGeoPlan.modules.audit_geo;
  const rawPlan = auditGeo.plan_action_geo || [];
  const scoreGlobal = Math.round(auditGeo.score_global_geo ?? 0);

  const planItems = rawPlan.map((item: any) => {
    if (typeof item === 'string') {
      return { action: item, categorie: '', priorite: 'moyenne', impact: '', effort: 'moyen' };
    }
    return item as { action: string; categorie: string; priorite: string; impact: string; effort: string };
  });

  if (planItems.length === 0) return null;

  const highPriority = planItems.filter((i: any) => i.priorite?.toLowerCase() === 'haute').length;
  const medPriority = planItems.filter((i: any) => i.priorite?.toLowerCase() === 'moyenne').length;
  const lowPriority = planItems.filter((i: any) => i.priorite?.toLowerCase() === 'basse').length;

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Plan d'action GEO
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {planItems.length} actions identifiées pour améliorer votre visibilité IA
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            'text-xs font-bold px-3 py-1 rounded-full border',
            scoreGlobal >= 70
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : scoreGlobal >= 40
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-destructive/10 text-destructive border-destructive/30'
          )}
        >
          Score GEO : {scoreGlobal}/100
        </Badge>
      </CardHeader>

      {/* Résumé des priorités */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/30">
        <div className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-destructive">{highPriority}</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Priorité haute</div>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">{medPriority}</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Priorité moyenne</div>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{lowPriority}</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Priorité basse</div>
        </div>
      </div>

      {/* Liste des actions */}
      <CardContent className="p-4 sm:p-5 space-y-2.5">
        {planItems.map((item: any, idx: number) => {
          const pr = (item.priorite || '').toLowerCase();
          const ef = (item.effort || '').toLowerCase();

          return (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3 sm:p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-colors"
            >
              {/* Numéro */}
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                  pr === 'haute'
                    ? 'bg-destructive/15 text-destructive'
                    : pr === 'moyenne'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                )}
              >
                {idx + 1}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">{item.action}</p>
                {item.impact && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.impact}</p>
                )}
              </div>

              {/* Badges de priorité et effort */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 border-0 uppercase',
                    pr === 'haute'
                      ? 'bg-destructive/15 text-destructive'
                      : pr === 'moyenne'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {pr === 'haute' ? 'Haute' : pr === 'moyenne' ? 'Moyenne' : 'Basse'}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 border-0">
                  {ef === 'faible' ? 'Effort faible' : ef === 'moyen' ? 'Effort moyen' : 'Effort élevé'}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
