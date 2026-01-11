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

export interface LLMAnalysis {
  forces_principales: string[];
  faiblesses_principales: string[];
  positionnement: string;
  differenciateurs: string[];
  opportunites_differenciation: string[];
  score_menace: number;
  analyse_resume: string;
}

export interface MiniLLMResult {
  competitor_name: string;
  competitor_url: string;
  llm_analysis: LLMAnalysis;
  status: string;
}

export interface BenchmarkClassement {
  url: string;
  score: number;
  ecart_vs_cible?: number;
}

export interface YourPosition {
  rank: number;
  total_competitors: number;
  position_text: string;
  source: string;
  ecarts_vs_cible?: BenchmarkClassement[];
  classement?: BenchmarkClassement[];
}

export interface BenchmarkResults {
  error?: string;
  benchmark?: {
    classement: BenchmarkClassement[];
    position_cible: number;
    ecarts_vs_cible: Array<{
      url: string;
      score: number;
      ecart_vs_cible: number;
    }>;
    comparaison: string;
  };
  summary?: string;
  raw_data?: Record<string, any>;
}

export interface CompetitorAnalysisResponse {
  analysis_id: number;
  url: string;
  title: string;
  description: string;
  models_analysis: ModelAnalysis[];
  consolidated_competitors: ConsolidatedCompetitor[];
  mini_llm_results?: MiniLLMResult[];
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
  // Nouvelles données de l'API
  competitors?: Array<{
    name: string;
    url: string;
    urls?: string[];
    average_score: number;
    mentions: number;
    sources: string[];
    score_details?: Record<string, number>;
  }>;
  your_position?: YourPosition;
  benchmark_results?: BenchmarkResults;
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
  // Si VITE_API_BASE_URL est défini explicitement, toujours l'utiliser
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // En développement sans URL explicite, utiliser un chemin relatif pour profiter du proxy Vite
  const mode = import.meta.env.MODE || import.meta.env.NODE_ENV || 'development';
  if (mode === 'development' || import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
    return '';
  }
  
  // En production sans URL explicite, utiliser l'URL par défaut
  return 'https://api.viraill.com';
};

/**
 * Démarrer une nouvelle analyse concurrentielle
 */
export const startCompetitorAnalysis = async (request: CompetitorAnalysisRequest): Promise<CompetitorAnalysisResponse> => {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    // Construire un payload complet (aligné avec Postman)
    // Note: include_benchmark désactivé par défaut car le module structural_analyzer peut ne pas être disponible
    const defaultPayload: Required<Omit<CompetitorAnalysisRequest, 'url'>> = {
      min_score: 0.3,
      min_mentions: 1,
      models: ['gpt-5', 'claude-4-sonnet', 'gemini-2.5-pro', 'mixtral-3.1', 'sonar'],
      include_raw: false,
      include_benchmark: false, // Désactivé par défaut pour éviter l'erreur "No module named 'structural_analyzer'"
      include_llmo_analysis: true,
    };

    const payload = {
      ...defaultPayload,
      ...request,
      models: (request.models && request.models.length > 0) ? request.models : defaultPayload.models,
    };

    ////console.log('🚀 Lancement analyse concurrentielle (payload):', payload);

    const response = await fetch(`${API_BASE_URL}/api/v1/competitors/analyze`, {
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
    ////console.log('✅ Analyse concurrentielle créée:', data);
    
    // Logger un avertissement si le benchmark a échoué mais ne pas bloquer l'analyse
    if (data.benchmark_results?.error) {
      // console.warn('⚠️ Benchmark échoué (non bloquant):', data.benchmark_results.error);
    }
    
    return data;
  } catch (error) {
    // console.error('❌ Erreur lors de l\'analyse:', error);
    throw error;
  }
};

/**
 * Mapper les données de l'API vers le format CompetitorAnalysisResponse
 */
export const mapApiResponseToCompetitorAnalysisResponse = (apiData: any): CompetitorAnalysisResponse => {
  // Si le format est déjà le bon, le retourner tel quel
  if (apiData.consolidated_competitors && apiData.models_analysis && apiData.target_positioning) {
    return apiData;
  }

  // Mapper depuis le nouveau format de l'API
  const competitors = apiData.competitors || [];
  const stats = apiData.stats || {};
  const modelsUsed = stats.models_used || [];

  // Créer consolidated_competitors depuis competitors
  const consolidatedCompetitors: ConsolidatedCompetitor[] = competitors.map((comp: any, index: number) => ({
    name: comp.name || extractDomain(comp.url || ''),
    primary_url: comp.url || '',
    all_urls: comp.urls || [comp.url || ''],
    average_score: comp.average_score || 0,
    weighted_score: comp.average_score || 0,
    models_count: comp.sources?.length || 1,
    consensus_level: 1,
    global_rank: index + 1,
    model_scores: comp.score_details || {}, // Mapper score_details vers model_scores
    model_ranks: {},
    source_models: comp.sources || [],
    llmo_analysis: null,
    benchmark: null,
    common_features: [],
    competitive_themes: []
  }));

  // Fonction pour normaliser les noms de modèles
  const normalizeModelName = (modelName: string): { provider: string; name: string; display: string; allVariants: string[] } => {
    const lower = modelName.toLowerCase();
    
    // Mapping des variantes de noms de modèles
    const modelMappings: Record<string, { provider: string; name: string; display: string }> = {
      'gpt-5': { provider: 'openai', name: 'gpt-5', display: 'GPT-5' },
      'openai/gpt-5': { provider: 'openai', name: 'gpt-5', display: 'GPT-5' },
      'claude-4-sonnet': { provider: 'anthropic', name: 'claude-4-sonnet', display: 'Claude 4 Sonnet' },
      'anthropic/claude-4-sonnet': { provider: 'anthropic', name: 'claude-4-sonnet', display: 'Claude 4 Sonnet' },
      'claude-sonnet-4': { provider: 'anthropic', name: 'claude-4-sonnet', display: 'Claude 4 Sonnet' },
      'gemini-2.5-pro': { provider: 'google', name: 'gemini-2.5-pro', display: 'Gemini 2.5 Pro' },
      'google/gemini-2.5-pro': { provider: 'google', name: 'gemini-2.5-pro', display: 'Gemini 2.5 Pro' },
      'mixtral-3.1': { provider: 'mistralai', name: 'mixtral-3.1', display: 'Mistral 3.1' },
      'mistral-3.1': { provider: 'mistralai', name: 'mixtral-3.1', display: 'Mistral 3.1' },
      'mistralai/mistral-medium-3.1': { provider: 'mistralai', name: 'mixtral-3.1', display: 'Mistral 3.1' },
      'sonar': { provider: 'perplexity', name: 'sonar', display: 'Sonar' },
      'perplexity/sonar': { provider: 'perplexity', name: 'sonar', display: 'Sonar' }
    };

    // Chercher une correspondance exacte
    for (const [key, value] of Object.entries(modelMappings)) {
      if (lower === key.toLowerCase() || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        const variants = Object.keys(modelMappings).filter(k => 
          modelMappings[k].name === value.name
        );
        return { ...value, allVariants: variants };
      }
    }

    // Fallback: essayer de déduire depuis le format
    const parts = modelName.split('/');
    if (parts.length === 2) {
      return {
        provider: parts[0],
        name: parts[1],
        display: parts[1],
        allVariants: [modelName, parts[1]]
      };
    }

    return {
      provider: modelName.split('-')[0] || modelName,
      name: modelName,
      display: modelName,
      allVariants: [modelName]
    };
  };

  // Créer models_analysis depuis competitors et sources
  const modelsAnalysis: ModelAnalysis[] = modelsUsed.map((model: string) => {
    const normalized = normalizeModelName(model);
    const modelCompetitors = competitors.filter((comp: any) => {
      // Vérifier toutes les variantes possibles du nom du modèle
      const compSources = comp.sources || [];
      return normalized.allVariants.some(variant => 
        compSources.includes(variant) || 
        compSources.some((s: string) => s.toLowerCase().includes(variant.toLowerCase()) || variant.toLowerCase().includes(s.toLowerCase()))
      );
    });

    return {
      model_info: {
        provider: normalized.provider,
        model_name: normalized.name, // Utiliser le nom normalisé
        display_name: normalized.display,
        execution_time_ms: 0,
        status: 'completed',
        competitors_found: modelCompetitors.length,
        average_score: modelCompetitors.length > 0 
          ? modelCompetitors.reduce((sum: number, c: any) => sum + (c.average_score || 0), 0) / modelCompetitors.length
          : 0,
        min_score: modelCompetitors.length > 0
          ? Math.min(...modelCompetitors.map((c: any) => c.average_score || 0))
          : 0,
        max_score: modelCompetitors.length > 0
          ? Math.max(...modelCompetitors.map((c: any) => c.average_score || 0))
          : 0,
        error_message: null
      },
      competitors: modelCompetitors.map((comp: any) => ({
        name: comp.name || extractDomain(comp.url || ''),
        url: comp.url || '',
        alternative_urls: comp.urls?.filter((u: string) => u !== comp.url) || [],
        similarity_score: comp.average_score || 0,
        confidence_level: 1,
        model_rank: competitors.indexOf(comp) + 1,
        reasoning: '',
        context_snippet: null,
        mentioned_features: [],
        competitive_advantages: []
      }))
    };
  });

  // Calculer le positionnement cible (target_positioning)
  // Trier les concurrents par score décroissant et mettre à jour leurs rangs
  const sortedCompetitors = [...consolidatedCompetitors].sort((a, b) => b.average_score - a.average_score);
  sortedCompetitors.forEach((comp, idx) => {
    comp.global_rank = idx + 1;
  });

  // Calculer le score moyen des concurrents comme référence
  // Dans ce format, il n'y a pas de score utilisateur explicite, on utilise la moyenne
  const avgCompetitorScore = sortedCompetitors.length > 0
    ? sortedCompetitors.reduce((sum, c) => sum + c.average_score, 0) / sortedCompetitors.length
    : 0;
  const userScore = avgCompetitorScore;
  // Estimer le rang utilisateur basé sur le score moyen (positionné au milieu par défaut)
  const estimatedUserRank = Math.ceil(sortedCompetitors.length / 2);

  const targetPositioning: TargetPositioning = {
    overall_rank: estimatedUserRank || 1,
    total_competitors: sortedCompetitors.length,
    market_position: estimatedUserRank <= Math.ceil(sortedCompetitors.length * 0.2) ? 'Leader' : 
                      estimatedUserRank <= Math.ceil(sortedCompetitors.length * 0.4) ? 'Acteur solide' :
                      estimatedUserRank <= Math.ceil(sortedCompetitors.length * 0.6) ? 'En développement' : 'À améliorer',
    target_llmo_score: userScore,
    target_geo_score: userScore,
    target_benchmark_score: userScore,
    target_global_score: userScore,
    model_rankings: {},
    competitive_advantages: [],
    improvement_areas: [],
    top_competitors: sortedCompetitors.slice(0, 5).map((comp, idx) => ({
      rank: idx + 1,
      name: comp.name,
      score: comp.average_score,
      gap_vs_you: userScore - comp.average_score,
      status: 'active'
    }))
  };

  // Créer global_stats depuis stats
  const globalStats = {
    total_models_executed: modelsUsed.length,
    total_competitors_found: stats.unique_competitors || competitors.length,
    analysis_duration_ms: 0,
    average_competitors_per_model: modelsUsed.length > 0 
      ? (stats.total_mentions || competitors.length) / modelsUsed.length
      : 0
  };

  // Créer analysis_metadata
  // Détecter si le benchmark a été demandé mais a échoué
  const hasBenchmarkError = apiData.benchmark_results?.error;
  const benchmarkWasRequested = apiData.analysis_metadata?.include_benchmark !== undefined 
    ? apiData.analysis_metadata.include_benchmark 
    : !!apiData.benchmark_results; // Si benchmark_results existe, c'est qu'il a été demandé
    
  if (hasBenchmarkError) {
    console.warn('⚠️ Erreur de benchmark détectée (non bloquant):', hasBenchmarkError);
  }
  
  const analysisMetadata = {
    min_score: 0.3,
    min_mentions: 1,
    models_requested: modelsUsed,
    include_raw: false,
    include_benchmark: benchmarkWasRequested && !hasBenchmarkError, // Seulement true si demandé et réussi
    include_llmo_analysis: !!apiData.mini_llm_results && apiData.mini_llm_results.length > 0,
    benchmark_competitors_count: hasBenchmarkError ? 0 : (competitors.length || 0),
    llmo_analysis_count: apiData.mini_llm_results?.length || 0
  };

  // Utiliser your_position si disponible, sinon utiliser les données calculées
  const finalTargetPositioning: TargetPositioning = apiData.your_position ? {
    overall_rank: apiData.your_position.rank,
    total_competitors: apiData.your_position.total_competitors,
    market_position: apiData.your_position.rank <= Math.ceil(apiData.your_position.total_competitors * 0.2) ? 'Leader' : 
                      apiData.your_position.rank <= Math.ceil(apiData.your_position.total_competitors * 0.4) ? 'Acteur solide' :
                      apiData.your_position.rank <= Math.ceil(apiData.your_position.total_competitors * 0.6) ? 'En développement' : 'À améliorer',
    target_llmo_score: userScore,
    target_geo_score: userScore,
    target_benchmark_score: apiData.benchmark_results?.benchmark?.classement?.find((c: any) => c.url === apiData.url)?.score || userScore,
    target_global_score: apiData.benchmark_results?.benchmark?.classement?.find((c: any) => c.url === apiData.url)?.score || userScore,
    model_rankings: {},
    competitive_advantages: [],
    improvement_areas: [],
    top_competitors: (apiData.your_position?.classement ? 
      apiData.your_position.classement.slice(0, 5).map((entry: any, idx: number) => {
        const comp = competitors.find((c: any) => c.url === entry.url) || { name: extractDomain(entry.url), average_score: entry.score / 100 };
        return {
          rank: idx + 1,
          name: comp.name || extractDomain(entry.url || ''),
          score: entry.score / 100,
          gap_vs_you: entry.ecart_vs_cible ? entry.ecart_vs_cible / 100 : 0,
          status: 'active'
        };
      })
      : sortedCompetitors.slice(0, 5).map((comp, idx) => ({
        rank: idx + 1,
        name: comp.name,
        score: comp.average_score,
        gap_vs_you: userScore - comp.average_score,
        status: 'active'
      })))
  } : targetPositioning;

  return {
    analysis_id: apiData.analysis_id,
    url: apiData.url,
    title: apiData.title,
    description: apiData.description,
    models_analysis: modelsAnalysis,
    consolidated_competitors: sortedCompetitors, // Utiliser la version triée avec rangs mis à jour
    mini_llm_results: apiData.mini_llm_results || [],
    target_positioning: finalTargetPositioning,
    global_stats: globalStats,
    analysis_metadata: analysisMetadata,
    created_at: apiData.created_at,
    // Ajouter les nouvelles données de l'API
    competitors: competitors,
    your_position: apiData.your_position || undefined,
    benchmark_results: apiData.benchmark_results || undefined
  };
};

/**
 * Récupérer une analyse concurrentielle par ID
 */
export const getCompetitorAnalysisById = async (analysisId: number): Promise<CompetitorAnalysisResponse> => {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    ////console.log('🔍 Récupération analyse:', analysisId);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/competitors/analyses/${analysisId}`, {
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
    ////console.log('✅ Analyse récupérée:', data);
    
    // Logger un avertissement si le benchmark a échoué mais ne pas bloquer l'analyse
    if (data.benchmark_results?.error) {
      console.warn('⚠️ Erreur de benchmark dans l\'analyse existante (non bloquant):', data.benchmark_results.error);
    }
    
    // Mapper les données de l'API vers le format attendu
    return mapApiResponseToCompetitorAnalysisResponse(data);
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
    const response = await fetch(`${API_BASE_URL}/api/v1/competitors/analyses`, {
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
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
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