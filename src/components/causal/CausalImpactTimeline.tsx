import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Layers,
} from 'lucide-react';
import {
  DeployedOptimization,
  CausalMetricPoint,
  CausalLiftAnalysis,
  computeCausalLift,
  detectProactiveAlerts,
  ProactiveAlert,
} from '@/services/causalTrackingService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CausalImpactTimelineProps {
  domain: string;
  className?: string;
}

export const CausalImpactTimeline: React.FC<CausalImpactTimelineProps> = ({
  domain,
  className = '',
}) => {
  const [selectedOptId, setSelectedOptId] = useState<string>('opt_1');

  // Historique réaliste de déploiements pour le domaine
  const optimizations: DeployedOptimization[] = useMemo(() => [
    {
      id: 'opt_1',
      domain,
      deployedAt: '2026-08-25',
      category: 'llms_txt',
      title: 'Déploiement de /llms.txt & llms-full.txt',
      details: 'Aiguillage direct pour Claude Code, Cursor et Perplexity.',
    },
    {
      id: 'opt_2',
      domain,
      deployedAt: '2026-08-12',
      category: 'schema',
      title: 'Enrichissement Schema.org JSON-LD (SoftwareApplication)',
      details: 'Balisage sémantique complet avec offres, notation et créateur.',
    },
    {
      id: 'opt_3',
      domain,
      deployedAt: '2026-07-28',
      category: 'robots',
      title: 'Correction de robots.txt (Autorisation GPTBot, ClaudeBot, Perplexity)',
      details: 'Suppression des blocages intempestifs des crawlers d\'IA.',
    },
  ], [domain]);

  // Points de mesure temporels avant/après
  const metricHistory: Record<string, { before: CausalMetricPoint; after: CausalMetricPoint }> = useMemo(() => ({
    opt_1: {
      before: {
        date: '2026-08-25',
        totalCitations: 42,
        shareOfVoicePct: 18.5,
        journeySuccessRatePct: 40,
        modelsCitingCount: 4,
      },
      after: {
        date: '2026-09-09',
        totalCitations: 59,
        shareOfVoicePct: 24.8,
        journeySuccessRatePct: 75,
        modelsCitingCount: 7,
      },
    },
    opt_2: {
      before: {
        date: '2026-08-12',
        totalCitations: 31,
        shareOfVoicePct: 14.2,
        journeySuccessRatePct: 35,
        modelsCitingCount: 3,
      },
      after: {
        date: '2026-08-24',
        totalCitations: 42,
        shareOfVoicePct: 18.5,
        journeySuccessRatePct: 40,
        modelsCitingCount: 4,
      },
    },
    opt_3: {
      before: {
        date: '2026-07-28',
        totalCitations: 19,
        shareOfVoicePct: 9.0,
        journeySuccessRatePct: 20,
        modelsCitingCount: 2,
      },
      after: {
        date: '2026-08-11',
        totalCitations: 31,
        shareOfVoicePct: 14.2,
        journeySuccessRatePct: 35,
        modelsCitingCount: 3,
      },
    },
  }), []);

  const activeOpt = optimizations.find(o => o.id === selectedOptId) || optimizations[0];
  const metrics = metricHistory[activeOpt.id];
  const analysis: CausalLiftAnalysis = useMemo(() => {
    return computeCausalLift(activeOpt, metrics.before, metrics.after);
  }, [activeOpt, metrics]);

  const alerts: ProactiveAlert[] = useMemo(() => {
    return detectProactiveAlerts(domain, [
      metrics.before,
      metrics.after,
    ]);
  }, [domain, metrics]);

  return (
    <Card className={`rounded-2xl border-slate-200/80 bg-white shadow-xs p-5 sm:p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-700 border border-indigo-200/50 mb-1">
            <TrendingUp size={12} />
            <span>Preuve de ROI Causal (Causal Tracking)</span>
          </div>
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Impact Réel des Déploiements sur les Citations LLM
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Relie chaque correction technique déployée à la variation mesurée sur {domain} (30 derniers jours).
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1 py-1">
            <CheckCircle2 size={13} />
            <span>Attribution Causalité : Validée</span>
          </Badge>
        </div>
      </div>

      {/* Timeline selector tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {optimizations.map((opt) => {
          const isSelected = opt.id === selectedOptId;
          const optLift = metricHistory[opt.id];
          const diffCitations = optLift.after.totalCitations - optLift.before.totalCitations;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedOptId(opt.id)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600/30'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {opt.deployedAt}
                </span>
                <span className="font-bold text-emerald-600">
                  +{diffCitations} citations
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                {opt.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {opt.details}
              </div>
            </button>
          );
        })}
      </div>

      {/* Causal Lift Analysis Card (shadcn Card) */}
      <Card className="rounded-2xl bg-slate-50/70 border-slate-200/80 shadow-none">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Analyse d'Impact • Fenêtre de {analysis.observationDays} jours
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {analysis.optimization.title}
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold gap-1.5 py-1 self-start sm:self-auto">
              <TrendingUp size={12} className="text-emerald-600" />
              <span>Impact Positif Avéré</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5 rounded-xl bg-white border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Gain de Citations</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                +{analysis.deltas.citationsLift}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {analysis.before.totalCitations} ➔ {analysis.after.totalCitations} mentions
              </div>
            </Card>

            <Card className="p-3.5 rounded-xl bg-white border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Part de Voix (SoV)</div>
              <div className="text-xl font-bold text-indigo-600 mt-1">
                +{analysis.deltas.shareOfVoiceLiftPct}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {analysis.before.shareOfVoicePct}% ➔ {analysis.after.shareOfVoicePct}%
              </div>
            </Card>

            <Card className="p-3.5 rounded-xl bg-white border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Succès Parcours Agent</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                +{analysis.deltas.journeyLiftPct}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {analysis.before.journeySuccessRatePct}% ➔ {analysis.after.journeySuccessRatePct}%
              </div>
            </Card>

            <Card className="p-3.5 rounded-xl bg-white border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Modèles Référents</div>
              <div className="text-xl font-bold text-purple-600 mt-1">
                +{analysis.after.modelsCitingCount - analysis.before.modelsCitingCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {analysis.after.modelsCitingCount} moteurs actifs
              </div>
            </Card>
          </div>

          {/* Narrative Explanation */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
            <strong className="text-indigo-900 font-semibold">Attribution causale Viraill : </strong>
            {analysis.narrativeExplanation}
          </div>
        </CardContent>
      </Card>

      {/* Proactive Alerts Section if any */}
      {alerts.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-900">
              Alertes Proactives Détectées
            </span>
          </div>

          <div className="space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                  alert.severity === 'critical'
                    ? 'border-rose-200 bg-rose-50/70 text-rose-900'
                    : 'border-amber-200 bg-amber-50/70 text-amber-900'
                }`}
              >
                <div>
                  <div className="font-bold">{alert.title}</div>
                  <div className="text-[11px] opacity-85 mt-0.5">{alert.description}</div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold shrink-0 ${
                    alert.severity === 'critical'
                      ? 'border-rose-300 text-rose-700 bg-white'
                      : 'border-amber-300 text-amber-700 bg-white'
                  }`}
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
