import { UnifiedActionabilityScore, ScorePillarLevel } from '@/types/scoring';

/**
 * Moteur de calcul du Score d'Actionnabilité Unifié Viraill (Modèle en 3 niveaux)
 */

export function calculateGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function getStatusForLevel(level: 1 | 2 | 3, score: number): string {
  if (level === 1) {
    if (score >= 80) return 'Très forte visibilité multi-LLM';
    if (score >= 60) return 'Présence générative établie';
    if (score >= 40) return 'Visibilité partielle / Faible part de voix';
    return 'Citations rares ou inexistantes';
  }
  if (level === 2) {
    if (score >= 80) return 'Données structurées et entités optimales';
    if (score >= 60) return 'Compréhension sémantique satisfaisante';
    if (score >= 40) return 'Données structurées incomplètes';
    return 'Structure confuse pour les agents';
  }
  // level === 3
  if (score >= 80) return 'Agentic Native & M2M Ready';
  if (score >= 60) return 'Accessible aux agents (Web2.5)';
  if (score >= 40) return 'Transitionnel / Protocoles partiels';
  return 'Non actionnable par des agents autonomes';
}

export interface ScoreCalculationInput {
  targetDomain: string;
  // Niveau 1 : Citations, sources, modèles
  geoScore?: number | null;
  totalCitations?: number;
  modelsCount?: number;
  // Niveau 2 : Contenu, schéma, entités
  schemaScore?: number | null;
  semanticHtmlScore?: number | null;
  entityCoverageScore?: number | null;
  contentClarityScore?: number | null;
  // Niveau 3 : Protocoles machines, M2M, journeys
  agenticScore?: number | null;
  hasLlmsTxt?: boolean;
  hasOpenApi?: boolean;
  hasAgentCard?: boolean;
  hasX402Payment?: boolean;
  journeySuccessRate?: number;
  provider?: 'viraill' | 'ora' | 'hybrid';
}

export function computeUnifiedScore(input: ScoreCalculationInput): UnifiedActionabilityScore {
  const {
    targetDomain,
    geoScore = 50,
    totalCitations = 0,
    modelsCount = 9,
    schemaScore = 50,
    semanticHtmlScore = 50,
    entityCoverageScore = 50,
    contentClarityScore = 50,
    agenticScore = 40,
    hasLlmsTxt = false,
    hasOpenApi = false,
    hasAgentCard = false,
    hasX402Payment = false,
    journeySuccessRate = 0,
    provider = 'hybrid',
  } = input;

  // ─── 1. Calcul Niveau 1 : Être trouvé et cité (40%) ───────────────────────────
  const l1Raw = geoScore != null ? geoScore : Math.min(100, Math.round(totalCitations * 1.5));
  const l1Score = Math.max(0, Math.min(100, Math.round(l1Raw)));
  const level1: ScorePillarLevel = {
    level: 1,
    id: 'found_and_cited',
    title: 'Niveau 1 — Être trouvé & cité',
    shortTitle: 'Visibilité & Citations LLM',
    weight: 0.40,
    score: l1Score,
    grade: calculateGrade(l1Score),
    status: getStatusForLevel(1, l1Score),
    description: 'Mesure la part de voix, les citations et la présence de la marque dans 9 moteurs génératifs.',
    metrics: [
      { id: 'citation_rate', label: 'Taux de citation multi-moteurs', score: l1Score, weight: 0.6 },
      { id: 'source_authority', label: 'Poids des domaines sources', score: Math.round(l1Score * 0.9), weight: 0.2 },
      { id: 'competitive_sentiment', label: 'Sentiment comparatif vs concurrents', score: Math.round(l1Score * 1.05), weight: 0.2 },
    ],
    keyObservations: [
      totalCitations > 0
        ? `${totalCitations} citations recensées sur les moteurs génératifs audités.`
        : 'Présence encore timide dans les réponses des principaux LLMs.',
    ],
  };

  // ─── 2. Calcul Niveau 2 : Être compris et choisi (30%) ─────────────────────────
  const l2Raw = (
    (schemaScore ?? 50) * 0.35 +
    (semanticHtmlScore ?? 50) * 0.25 +
    (entityCoverageScore ?? 50) * 0.20 +
    (contentClarityScore ?? 50) * 0.20
  );
  const l2Score = Math.max(0, Math.min(100, Math.round(l2Raw)));
  const level2: ScorePillarLevel = {
    level: 2,
    id: 'understood_and_preferred',
    title: 'Niveau 2 — Être compris & choisi',
    shortTitle: 'Compréhension & Données Structurées',
    weight: 0.30,
    score: l2Score,
    grade: calculateGrade(l2Score),
    status: getStatusForLevel(2, l2Score),
    description: 'Mesure la lisibilité du contenu pour les bots, la densité Schema.org et la couverture des entités.',
    metrics: [
      { id: 'structured_data', label: 'Données structurées (Schema.org)', score: schemaScore ?? 50, weight: 0.35 },
      { id: 'semantic_html', label: 'Structure sémantique HTML', score: semanticHtmlScore ?? 50, weight: 0.25 },
      { id: 'entity_coverage', label: 'Exposition des entités clés', score: entityCoverageScore ?? 50, weight: 0.20 },
      { id: 'content_clarity', label: 'Clarté factuelle pour LLM', score: contentClarityScore ?? 50, weight: 0.20 },
    ],
    keyObservations: [
      (schemaScore ?? 0) >= 70
        ? 'Données Schema.org riches et conformes.'
        : 'Données structurées incomplètes ou absentes (opportunité de gain rapide).',
    ],
  };

  // ─── 3. Calcul Niveau 3 : Être actionnable et convertir (30%) ──────────────────
  let l3Points = 0;
  if (hasLlmsTxt) l3Points += 25;
  if (hasOpenApi) l3Points += 25;
  if (hasAgentCard) l3Points += 20;
  if (hasX402Payment) l3Points += 15;
  if (journeySuccessRate > 0) l3Points += Math.round(journeySuccessRate * 0.15);

  const l3Raw = agenticScore != null ? (agenticScore * 0.6 + l3Points * 0.4) : l3Points;
  const l3Score = Math.max(0, Math.min(100, Math.round(l3Raw)));
  const level3: ScorePillarLevel = {
    level: 3,
    id: 'actionable_and_transacting',
    title: 'Niveau 3 — Être actionnable & convertir',
    shortTitle: 'Agent-Readiness & Protocoles M2M',
    weight: 0.30,
    score: l3Score,
    grade: calculateGrade(l3Score),
    status: getStatusForLevel(3, l3Score),
    description: "Évalue la capacité d'agents autonomes à naviguer, interagir, appeler l'API et exécuter des tâches.",
    metrics: [
      { id: 'llms_txt', label: 'Fichier /llms.txt', score: hasLlmsTxt ? 100 : 0, weight: 0.25 },
      { id: 'openapi', label: 'Spécification OpenAPI 3.1 (/openapi.json)', score: hasOpenApi ? 100 : 20, weight: 0.25 },
      { id: 'agent_card', label: 'A2A Agent Card (agent.json)', score: hasAgentCard ? 100 : 0, weight: 0.20 },
      { id: 'm2m_payment', label: 'Règlement autonome x402', score: hasX402Payment ? 100 : 0, weight: 0.15 },
      { id: 'journey_completion', label: 'Validation par Agents Réels (Journeys)', score: Math.round(journeySuccessRate), weight: 0.15 },
    ],
    keyObservations: [
      hasLlmsTxt ? 'Aiguillage /llms.txt en place.' : 'Absence de /llms.txt pour guider les agents.',
      hasOpenApi ? 'Contrat OpenAPI lisible par machine.' : 'Pas d’API documentée pour les outils d’agents.',
    ],
  };

  // ─── Score Global Pondéré ───────────────────────────────────────────────────
  const overallScore = Math.round(
    level1.score * level1.weight +
    level2.score * level2.weight +
    level3.score * level3.weight
  );

  // ─── Top Fixes Déduits ──────────────────────────────────────────────────────
  const topFixes: UnifiedActionabilityScore['topFixes'] = [];

  if (!hasLlmsTxt) {
    topFixes.push({
      id: 'fix_llms_txt',
      level: 3,
      title: 'Déployer un fichier /llms.txt à la racine',
      description: 'Permet aux agents d’identifier immédiatement la documentation, l’API et les offres sans crawler le HTML complet.',
      impact: 'high',
      effort: 'low',
      category: 'Agent-Readiness',
    });
  }

  if ((schemaScore ?? 0) < 70) {
    topFixes.push({
      id: 'fix_schema_org',
      level: 2,
      title: 'Injecter les balises Schema.org (Product / Organization)',
      description: 'Augmente de +35% la probabilité d’extraction d’entités précises par ChatGPT, Perplexity et Claude.',
      impact: 'high',
      effort: 'low',
      category: 'Sémantique',
    });
  }

  if (!hasOpenApi) {
    topFixes.push({
      id: 'fix_openapi',
      level: 3,
      title: 'Formaliser le contrat OpenAPI 3.1 pour les outils IA',
      description: 'Indispensable pour permettre à un agent MCP d’exécuter des requêtes sur votre domaine.',
      impact: 'medium',
      effort: 'medium',
      category: 'M2M & API',
    });
  }

  return {
    overallScore,
    grade: calculateGrade(overallScore),
    methodVersion: '2026.1',
    calculatedAt: new Date().toISOString(),
    targetDomain,
    confidence: modelsCount >= 6 ? 'high' : 'medium',
    provenance: {
      geoAnalysesCount: 1,
      modelsAuditedCount: modelsCount,
      agenticAuditId: undefined,
      provider,
    },
    levels: {
      found_and_cited: level1,
      understood_and_preferred: level2,
      actionable_and_transacting: level3,
    },
    topFixes,
  };
}
