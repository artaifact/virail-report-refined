// Service utilisant l'authentification par cookies comme les autres services

// Interfaces basées sur votre nouvelle API
export interface CompetitorAnalysisRequest {
  url: string;
  min_score?: number;
  min_mentions?: number;
  models?: string[];
  include_raw?: boolean;
  include_benchmark?: boolean;
  include_llmo_analysis?: boolean;
}

export interface CompetitorModelInfo {
  provider: string;
  model_name: string;
  display_name: string;
  execution_time_ms: number;
  status: string;
  competitors_found: number;
  average_score: number;
  min_score: number;
  max_score: number;
  error_message: string | null;
}

export interface CompetitorItem {
  name: string;
  url: string;
  alternative_urls: string[];
  similarity_score: number;
  confidence_level: number;
  model_rank: number;
  reasoning: string;
  context_snippet: string | null;
  mentioned_features: string[];
  competitive_advantages: string[];
}

export interface ModelAnalysis {
  model_info: CompetitorModelInfo;
  competitors: CompetitorItem[];
}

export interface ConsolidatedCompetitor {
  name: string;
  primary_url: string;
  all_urls: string[];
  average_score: number;
  weighted_score: number;
  models_count: number;
  consensus_level: number;
  global_rank: number;
  model_scores: Record<string, number>;
  model_ranks: Record<string, number>;
  source_models: string[];
  llmo_analysis: {
    perception_score: number;
    audience_score: number;
    recommendation_score: number;
    value_prop_score: number;
    semantic_score: number;
    geo_total_score: number;
    geo_html_semantique: number;
    geo_donnees_structurees: number;
    geo_accessibilite_crawlers: number;
    geo_optimisation_contenu: number;
    geo_metadonnees_techniques: number;
    geo_conformite_standards: number;
    llmo_total_score: number;
    vs_target_rank: number | null;
    vs_target_score_diff: number | null;
    analysis_status: string;
  } | null;
  benchmark: any | null;
  common_features: string[];
  competitive_themes: string[];
}

export interface TopCompetitor {
  rank: number;
  name: string;
  score: number;
  gap_vs_you: number;
  status: string;
}

export interface TargetPositioning {
  overall_rank: number;
  total_competitors: number;
  market_position: string;
  target_llmo_score: number | string;
  target_geo_score: number | string;
  target_benchmark_score: number | string;
  target_global_score: number | string;
  model_rankings: Record<string, {
    rank: number;
    score: number;
    total_competitors: number;
  }>;
  competitive_advantages: string[];
  improvement_areas: string[];
  top_competitors: TopCompetitor[];
  trends_by_model?: Record<string, {
    count: number;
    delta_30d: number;
    insufficient_data: boolean;
    points: Array<{
      t: string;
      global_score: number;
      llmo_score: number;
      geo_score: number;
      benchmark_score: number;
    }>;
  }>;
}

export interface CompetitorAnalysisResponse {
  analysis_id: number;
  url: string;
  title: string;
  description: string;
  models_analysis: ModelAnalysis[];
  consolidated_competitors: ConsolidatedCompetitor[];
  target_positioning: TargetPositioning;
  global_stats: {
    total_models_executed: number;
    total_competitors_found: number;
    analysis_duration_ms: number;
    average_competitors_per_model: number;
  };
  analysis_metadata: {
    min_score: number;
    min_mentions: number;
    models_requested: string[];
    include_raw: boolean;
    include_benchmark: boolean;
    include_llmo_analysis: boolean;
    benchmark_competitors_count: number;
    llmo_analysis_count: number;
  };
  created_at: string;
}

export interface CompetitorAnalysisSummary {
  analysis_id: number;
  url: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  completed_at: string;
  total_models_executed: number;
  total_competitors_found: number;
}

// Configuration de l'API
const getApiBaseUrl = (): string => {
  // En développement, utiliser un chemin relatif pour profiter du proxy Vite et des cookies httpOnly
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return '';
  }
  return 'https://api.virail.studio';
};

/**
 * Démarrer une nouvelle analyse concurrentielle
 */
export const startCompetitorAnalysis = async (request: CompetitorAnalysisRequest): Promise<CompetitorAnalysisResponse> => {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    // Construire un payload complet (aligné avec Postman)
    const defaultPayload: Required<Omit<CompetitorAnalysisRequest, 'url'>> = {
      min_score: 0.3,
      min_mentions: 1,
      models: ['gpt-5', 'claude-4-sonnet', 'gemini-2.5-pro', 'mixtral-3.1', 'sonar'],
      include_raw: false,
      include_benchmark: true,
      include_llmo_analysis: true,
    };

    const payload = {
      ...defaultPayload,
      ...request,
      models: (request.models && request.models.length > 0) ? request.models : defaultPayload.models,
    };

    console.log('🚀 Lancement analyse concurrentielle (payload):', payload);

    const response = await fetch(`${API_BASE_URL}/api/v3/competitors/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Analyse concurrentielle créée:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    throw error;
  }
};

/**
 * Récupérer une analyse concurrentielle par ID
 */
export const getCompetitorAnalysisById = async (analysisId: number): Promise<CompetitorAnalysisResponse> => {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    console.log('🔍 Récupération analyse:', analysisId);
    
    const response = await fetch(`${API_BASE_URL}/api/v3/competitors/${analysisId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Analyse récupérée:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération:', error);
    throw error;
  }
};

/**
 * Lister toutes les analyses concurrentielles
 */
export const listCompetitorAnalyses = async (): Promise<CompetitorAnalysisSummary[]> => {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    console.log('📋 Récupération liste des analyses');
    
    const response = await fetch(`${API_BASE_URL}/api/v3/competitors/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Liste des analyses récupérée:', data);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la liste:', error);
    throw error;
  }
};

/**
 * Extraire le domaine d'une URL
 */
export const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
};

/**
 * Formatter un score pour l'affichage
 */
export const formatScore = (score: number): string => {
  if (score === 0 || score === null || score === undefined) {
    return 'N/A';
  }
  return `${Math.round(score * 100)}/100`;
};

/**
 * Obtenir la couleur d'un score
 */
export const getScoreColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Obtenir la couleur de fond d'un score
 */
export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 0.8) return 'bg-green-100';
  if (score >= 0.6) return 'bg-yellow-100';
  return 'bg-red-100';
};

/**
 * Formater la position sur le marché
 */
export const formatMarketPosition = (rank: number, total: number): string => {
  const percentage = (rank / total) * 100;
  
  if (percentage <= 20) return '🥇 Leader';
  if (percentage <= 40) return '📈 Acteur solide';
  if (percentage <= 60) return '⚡ En développement';
  if (percentage <= 80) return '🔄 À améliorer';
  return '🚀 Potentiel inexploité';
};