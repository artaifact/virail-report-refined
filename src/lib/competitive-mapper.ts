/**
 * Mapper pour les données d'analyse concurrentielle
 * Transforme les données JSON brutes en structures utilisables par les composants React
 */

// Types pour l'analyse concurrentielle
export interface CompetitorScore {
  credibilite_autorite: string;
  structure_lisibilite: string;
  pertinence_contextuelle: string;
  compatibilite_technique: string;
  score_total: string;
  grade: string;
  ecart_avec_alan: number | string;
}

export interface DetailedComparison {
  avantage_alan: string;
  description: string;
  justification: string;
}

export interface CompetitiveAnalysisData {
  titre: string;
  introduction: string;
  tableau_comparatif: {
    alan: CompetitorScore;
    wakam: CompetitorScore;
    malakoff_humanis: CompetitorScore;
  };
  analyse_detaillee: {
    credibilite_autorite: {
      alan_vs_wakam: DetailedComparison;
      alan_vs_malakoff: DetailedComparison;
    };
    structure_lisibilite: {
      alan_vs_wakam: DetailedComparison;
      alan_vs_malakoff: DetailedComparison;
    };
    pertinence_contextuelle: {
      alan_vs_wakam: DetailedComparison;
      alan_vs_malakoff: DetailedComparison;
    };
    compatibilite_technique: {
      alan_vs_wakam: DetailedComparison;
      alan_vs_malakoff: DetailedComparison;
    };
  };
  analyse_swot: {
    forces: Array<{
      titre: string;
      score?: string;
      description: string;
    }>;
    faiblesses: Array<{
      titre: string;
      description: string;
    }>;
    opportunites: Array<{
      titre: string;
      description: string;
    }>;
    menaces: Array<{
      titre: string;
      description: string;
    }>;
  };
  recommandations_strategiques: Array<{
    titre: string;
    actions: string[];
  }>;
  conclusion: string;
}

// Types pour les composants React
export interface CompetitiveOverviewData {
  alanScore: number;
  bestCompetitorScore: number;
  worstCompetitorScore: number;
  alanRank: number;
  totalCompetitors: number;
  averageScore: number;
  alanAdvantage: number;
}

export interface MetricComparisonData {
  metric: string;
  alan: number;
  wakam: number;
  malakoff: number;
  alanAdvantage: {
    vs_wakam: string;
    vs_malakoff: string;
  };
  insights: {
    vs_wakam: DetailedComparison;
    vs_malakoff: DetailedComparison;
  };
}

export interface SWOTAnalysisData {
  forces: Array<{
    titre: string;
    score?: string;
    description: string;
  }>;
  faiblesses: Array<{
    titre: string;
    description: string;
  }>;
  opportunites: Array<{
    titre: string;
    description: string;
  }>;
  menaces: Array<{
    titre: string;
    description: string;
  }>;
}

export interface StrategicRecommendationsData {
  recommendations: Array<{
    titre: string;
    actions: string[];
  }>;
  conclusion: string;
}

/**
 * Fonction principale de mapping des données concurrentielles
 */
export function mapCompetitiveAnalysisData(jsonData: any): {
  overview: CompetitiveOverviewData;
  metricsComparison: MetricComparisonData[];
  swotAnalysis: SWOTAnalysisData;
  strategicRecommendations: StrategicRecommendationsData;
} {
  const data = jsonData as CompetitiveAnalysisData;
  
  return {
    overview: mapOverviewData(data),
    metricsComparison: mapMetricsData(data),
    swotAnalysis: mapSWOTData(data),
    strategicRecommendations: mapRecommendationsData(data)
  };
}

/**
 * Extraction des scores numériques depuis les chaînes de caractères
 */
function extractScore(scoreString: string): number {
  const match = scoreString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function extractTotalScore(scoreString: string): number {
  const match = scoreString.match(/(\d+)\/\d+/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Mapping des données de vue d'ensemble
 */
function mapOverviewData(data: CompetitiveAnalysisData): CompetitiveOverviewData {
  const alanScore = extractTotalScore(data.tableau_comparatif.alan.score_total);
  const wakamScore = extractTotalScore(data.tableau_comparatif.wakam.score_total);
  const malakoffScore = extractTotalScore(data.tableau_comparatif.malakoff_humanis.score_total);
  
  const competitors = [wakamScore, malakoffScore];
  const bestCompetitorScore = Math.max(...competitors);
  const worstCompetitorScore = Math.min(...competitors);
  const averageScore = (alanScore + wakamScore + malakoffScore) / 3;
  
  const sortedScores = [alanScore, wakamScore, malakoffScore].sort((a, b) => b - a);
  const alanRank = sortedScores.indexOf(alanScore) + 1;
  
  return {
    alanScore,
    bestCompetitorScore,
    worstCompetitorScore,
    alanRank,
    totalCompetitors: 3,
    averageScore: Math.round(averageScore),
    alanAdvantage: alanScore - bestCompetitorScore
  };
}

/**
 * Mapping des données de comparaison des métriques
 */
function mapMetricsData(data: CompetitiveAnalysisData): MetricComparisonData[] {
  const metrics = [
    {
      key: 'credibilite_autorite',
      label: 'Crédibilité & Autorité',
      detailKey: 'credibilite_autorite'
    },
    {
      key: 'structure_lisibilite',
      label: 'Structure & Lisibilité', 
      detailKey: 'structure_lisibilite'
    },
    {
      key: 'pertinence_contextuelle',
      label: 'Pertinence Contextuelle',
      detailKey: 'pertinence_contextuelle'
    },
    {
      key: 'compatibilite_technique',
      label: 'Compatibilité Technique',
      detailKey: 'compatibilite_technique'
    }
  ];

  return metrics.map(metric => ({
    metric: metric.label,
    alan: extractScore(data.tableau_comparatif.alan[metric.key as keyof CompetitorScore] as string),
    wakam: extractScore(data.tableau_comparatif.wakam[metric.key as keyof CompetitorScore] as string),
    malakoff: extractScore(data.tableau_comparatif.malakoff_humanis[metric.key as keyof CompetitorScore] as string),
    alanAdvantage: {
      vs_wakam: data.analyse_detaillee[metric.detailKey as keyof typeof data.analyse_detaillee]?.alan_vs_wakam?.avantage_alan || '+0 points',
      vs_malakoff: data.analyse_detaillee[metric.detailKey as keyof typeof data.analyse_detaillee]?.alan_vs_malakoff?.avantage_alan || '+0 points'
    },
    insights: {
      vs_wakam: data.analyse_detaillee[metric.detailKey as keyof typeof data.analyse_detaillee]?.alan_vs_wakam || {
        avantage_alan: '+0 points',
        description: '',
        justification: ''
      },
      vs_malakoff: data.analyse_detaillee[metric.detailKey as keyof typeof data.analyse_detaillee]?.alan_vs_malakoff || {
        avantage_alan: '+0 points',
        description: '',
        justification: ''
      }
    }
  }));
}

/**
 * Mapping des données SWOT
 */
function mapSWOTData(data: CompetitiveAnalysisData): SWOTAnalysisData {
  return {
    forces: data.analyse_swot.forces,
    faiblesses: data.analyse_swot.faiblesses,
    opportunites: data.analyse_swot.opportunites,
    menaces: data.analyse_swot.menaces
  };
}

/**
 * Mapping des recommandations stratégiques
 */
function mapRecommendationsData(data: CompetitiveAnalysisData): StrategicRecommendationsData {
  return {
    recommendations: data.recommandations_strategiques,
    conclusion: data.conclusion
  };
}

/**
 * Utilitaires pour les couleurs et styles basés sur les scores
 */
export function getScoreColor(score: number): string {
  if (score >= 18) return "text-green-600";
  if (score >= 15) return "text-blue-600";
  if (score >= 12) return "text-yellow-600";
  return "text-red-600";
}

export function getScoreBgColor(score: number): string {
  if (score >= 18) return "bg-green-100 text-green-800";
  if (score >= 15) return "bg-blue-100 text-blue-800";
  if (score >= 12) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getAdvantageColor(advantage: string): string {
  const points = parseInt(advantage.replace(/[^\d]/g, ''), 10);
  if (points >= 5) return "text-green-600 font-semibold";
  if (points >= 3) return "text-blue-600 font-medium";
  if (points >= 1) return "text-yellow-600";
  return "text-gray-600";
}

export function getRankColor(rank: number): string {
  if (rank === 1) return "text-green-600";
  if (rank === 2) return "text-blue-600";
  return "text-yellow-600";
} 