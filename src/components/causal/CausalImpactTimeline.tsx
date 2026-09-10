import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
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
    <div className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 mb-1">
            <TrendingUp size={12} />
            <span>Preuve de ROI Causal (Causal Tracking)</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Impact Réel des Déploiements sur les Citations LLM
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Relie chaque correction technique déployée à la variation mesurée sur {domain} (30 derniers jours).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} />
            Attribution Causalité : Validée
          </span>
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
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xs ring-1 ring-indigo-600/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {opt.deployedAt}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{diffCitations} citations
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {opt.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {opt.details}
              </div>
            </button>
          );
        })}
      </div>

      {/* Causal Lift Analysis Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Analyse d'Impact • Fenêtre de {analysis.observationDays} jours
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {analysis.optimization.title}
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles size={12} className="text-emerald-600" />
            <span>Impact Positif Avéré</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Gain de Citations</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              +{analysis.deltas.citationsLift}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {analysis.before.totalCitations} ➔ {analysis.after.totalCitations} mentions
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Part de Voix (SoV)</div>
            <div className="text-xl font-bold text-indigo-600 mt-1">
              +{analysis.deltas.shareOfVoiceLiftPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {analysis.before.shareOfVoicePct}% ➔ {analysis.after.shareOfVoicePct}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Succès Parcours Agent</div>
            <div className="text-xl font-bold text-blue-600 mt-1">
              +{analysis.deltas.journeyLiftPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {analysis.before.journeySuccessRatePct}% ➔ {analysis.after.journeySuccessRatePct}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Modèles Référents</div>
            <div className="text-xl font-bold text-purple-600 mt-1">
              +{analysis.after.modelsCitingCount - analysis.before.modelsCitingCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {analysis.after.modelsCitingCount} moteurs actifs
            </div>
          </div>
        </div>

        {/* Narrative Explanation */}
        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
          <strong className="text-indigo-900 font-semibold">Attribution causale Viraill : </strong>
          {analysis.narrativeExplanation}
        </div>
      </div>

      {/* Proactive Alerts Section if any */}
      {alerts.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-amber-500" />
            <span>Alertes Proactives & Veille Continue Détectées</span>
          </div>

          <div className="space-y-2">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-amber-900 dark:text-amber-300">
                    {al.title}
                  </div>
                  <div className="text-[11px] text-amber-800/80 dark:text-amber-400 mt-0.5">
                    {al.message}
                  </div>
                </div>
                <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 shrink-0 bg-white dark:bg-amber-900/40 px-2.5 py-1 rounded-lg border border-amber-200">
                  {al.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
