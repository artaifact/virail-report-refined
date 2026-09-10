/**
 * Service de Suivi Causal (Causal Tracking Moat)
 * Relie les déploiements techniques aux variations effectives de citations LLM,
 * de part de voix et de taux de complétion d'agents.
 */

export interface DeployedOptimization {
  id: string;
  domain: string;
  deployedAt: string;
  category: 'schema' | 'llms_txt' | 'openapi' | 'content' | 'robots' | 'm2m';
  title: string;
  details: string;
}

export interface CausalMetricPoint {
  date: string;
  totalCitations: number;
  shareOfVoicePct: number;
  journeySuccessRatePct: number;
  modelsCitingCount: number;
}

export interface CausalLiftAnalysis {
  optimization: DeployedOptimization;
  observationDays: number;
  before: CausalMetricPoint;
  after: CausalMetricPoint;
  deltas: {
    citationsLift: number;
    shareOfVoiceLiftPct: number;
    journeyLiftPct: number;
  };
  causalVerdict: 'proven_positive' | 'neutral' | 'potential_regression' | 'insufficient_time';
  narrativeExplanation: string;
}

export interface ProactiveAlert {
  id: string;
  domain: string;
  type: 'citation_drop' | 'new_competitor' | 'emerging_source' | 'crawler_change' | 'agentic_regression';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  detectedAt: string;
  recommendedAction: string;
}

/**
 * Calcule l'attribution causale entre un déploiement technique et l'impact mesuré sur les LLMs
 */
export function computeCausalLift(
  optimization: DeployedOptimization,
  before: CausalMetricPoint,
  after: CausalMetricPoint
): CausalLiftAnalysis {
  const citationsLift = after.totalCitations - before.totalCitations;
  const shareOfVoiceLiftPct = Math.round((after.shareOfVoicePct - before.shareOfVoicePct) * 10) / 10;
  const journeyLiftPct = Math.round((after.journeySuccessRatePct - before.journeySuccessRatePct) * 10) / 10;

  const msDiff = Math.abs(new Date(after.date).getTime() - new Date(before.date).getTime());
  const observationDays = Math.round(msDiff / (1000 * 60 * 60 * 24)) || 14;

  let causalVerdict: CausalLiftAnalysis['causalVerdict'] = 'neutral';
  if (observationDays < 7) {
    causalVerdict = 'insufficient_time';
  } else if (citationsLift > 0 || shareOfVoiceLiftPct > 2) {
    causalVerdict = 'proven_positive';
  } else if (citationsLift < 0 && shareOfVoiceLiftPct < -2) {
    causalVerdict = 'potential_regression';
  }

  const narrative =
    causalVerdict === 'proven_positive'
      ? `L'application de "${optimization.title}" est corrélée à une progression de +${citationsLift} citations et +${shareOfVoiceLiftPct}% de part de voix sur ${observationDays} jours.`
      : causalVerdict === 'potential_regression'
      ? `Attention : Baisse constatée de ${citationsLift} citations après déploiement. Vérifiez les modifications récentes.`
      : `Période d'observation de ${observationDays} jours en cours. Stabilisation des métriques.`;

  return {
    optimization,
    observationDays,
    before,
    after,
    deltas: {
      citationsLift,
      shareOfVoiceLiftPct,
      journeyLiftPct,
    },
    causalVerdict,
    narrativeExplanation: narrative,
  };
}

/**
 * Analyse les variations de données et génère des alertes proactives
 */
export function detectProactiveAlerts(
  domain: string,
  history: CausalMetricPoint[],
  latestCompetitorNames: string[] = [],
  previousCompetitorNames: string[] = []
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  if (history.length < 2) return alerts;

  const prev = history[history.length - 2];
  const curr = history[history.length - 1];

  // 1. Alerte baisse subite de citation
  if (curr.totalCitations < prev.totalCitations * 0.8) {
    alerts.push({
      id: `alert_drop_${Date.now()}`,
      domain,
      type: 'citation_drop',
      severity: 'critical',
      title: 'Chute inhabituelle des citations',
      message: `Vos citations sont passées de ${prev.totalCitations} à ${curr.totalCitations} (-${Math.round((1 - curr.totalCitations / prev.totalCitations) * 100)}%).`,
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Vérifiez la disponibilité de vos pages clés et la conformité du robots.txt.',
    });
  }

  // 2. Alerte nouveau concurrent émergent
  const newComps = latestCompetitorNames.filter(c => !previousCompetitorNames.includes(c));
  if (newComps.length > 0) {
    alerts.push({
      id: `alert_comp_${Date.now()}`,
      domain,
      type: 'new_competitor',
      severity: 'warning',
      title: `Nouveau concurrent détecté : ${newComps[0]}`,
      message: `${newComps[0]} commence à être cité par les LLMs sur vos requêtes stratégiques.`,
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Consultez la matrice concurrentielle pour comparer vos sources et différenciateurs.',
    });
  }

  return alerts;
}
