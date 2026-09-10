/**
 * Définition canonique du système de score unifié Viraill (Modèle en 3 niveaux)
 * 1. Être trouvé et cité (Found & Cited) - 40%
 * 2. Être compris et choisi (Understood & Preferred) - 30%
 * 3. Être actionnable et convertir (Actionable & Transacting) - 30%
 */

export interface ScorePillarLevel {
  level: 1 | 2 | 3;
  id: 'found_and_cited' | 'understood_and_preferred' | 'actionable_and_transacting';
  title: string;
  shortTitle: string;
  weight: number; // ex: 0.40, 0.30, 0.30
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  status: string;
  description: string;
  metrics: Array<{
    id: string;
    label: string;
    score: number;
    weight: number;
    details?: string;
  }>;
  keyObservations: string[];
}

export interface UnifiedActionabilityScore {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  methodVersion: string; // ex: "2026.1"
  calculatedAt: string;
  targetDomain: string;
  confidence: 'high' | 'medium' | 'low';
  provenance: {
    geoAnalysesCount: number;
    modelsAuditedCount: number;
    agenticAuditId?: number | string;
    provider: 'viraill' | 'ora' | 'hybrid';
  };
  levels: {
    found_and_cited: ScorePillarLevel;
    understood_and_preferred: ScorePillarLevel;
    actionable_and_transacting: ScorePillarLevel;
  };
  topFixes: Array<{
    id: string;
    level: 1 | 2 | 3;
    title: string;
    description: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    category: string;
  }>;
}
