import { AuthService } from '@/services/authService';
import { ApiErrorResponse } from '@/types/api';

/**
 * Extrait le message d'erreur depuis une erreur API ou une exception
 */
export function getErrorMessage(error: unknown): string {
  // Gestion des erreurs fetch/Response
  if (error instanceof Response) {
    return `Erreur HTTP: ${error.status} ${error.statusText}`;
  }

  // Gestion des erreurs avec une réponse API
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Si c'est une erreur avec data de réponse API
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      const data = response.data as ApiErrorResponse | undefined;

      if (data) {
        if (typeof data.detail === 'string') {
          return data.detail;
        }

        if (Array.isArray(data.detail)) {
          return data.detail.map((e) => e.msg).join(', ');
        }

        if (data.message) {
          return data.message;
        }
      }
    }

    // Si l'erreur a un message direct
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur inattendue est survenue';
}

// Configuration pour le développement
const getApiBaseUrl = () => {
  // Si VITE_API_BASE_URL est défini, l'utiliser en priorité
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Sinon, utiliser le mode pour déterminer l'URL par défaut
  const mode = import.meta.env.MODE || import.meta.env.NODE_ENV || 'development';
  if (mode === 'production' || import.meta.env.PROD) {
    return 'https://api.viraill.com';
  }
  // Mode développement par défaut
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();



/**
 * Extrait le message d'erreur depuis une réponse API (ex: 403 USAGE_LIMIT_EXCEEDED)
 */
async function getAnalysisErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    const message = data?.detail?.message ?? data?.message;
    if (typeof message === 'string' && message) return message;
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Intercepteur pour ajouter automatiquement l'authentification aux requêtes
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Si l'URL est pour l'authentification, utiliser fetch normal
  if (url.includes('/auth/')) {
    return fetch(url, options);
  }

  // Pour les autres requêtes, utiliser l'intercepteur d'authentification
  return AuthService.makeAuthenticatedRequest(url, options);
}

export interface ReportResponse {
  id: string;
  url: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  duration: number;
  rawData: string;
  metadata: {
    llmsUsed: string[];
    totalAnalyses: number;
    completionRate: number;
    score?: number | null;
  };
}

export interface Report {
  id: number;
  url: string;
  status: string;
  report_path: string;
  report_filename: string;
  report_size: number;
  position_produit_analyse: number;
  score_produit_analyse: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisModule {
  [key: string]: any;
}

export interface Analysis {
  llm_name: string;
  statut: string;
  duree: number;
  erreurs_modules: string[];
  created_at: string;
  modules: {
    perception: AnalysisModule;
    audience: AnalysisModule;
    recommandation: AnalysisModule;
    valeur: AnalysisModule;
    semantique: AnalysisModule;
    audit_geo?: AnalysisModule;
    synthese: AnalysisModule;
  }
}

// Structure d'un concurrent identifié
export interface Competitor {
  name: string;
  url: string;
  urls: string[];
  average_score: number;
  mentions: number;
  sources: string[];
  score_details: Record<string, number>;
  favicon_url?: string;
}

// Résultat d'analyse mini-LLM pour un concurrent
export interface MiniLLMResult {
  competitor_name: string;
  competitor_url: string;
  llm_analysis: {
    analyse_resume: string;
    score_menace: number;
    status: string;
  };
  status: string;
}

// Scores détaillés pour une URL
export interface UrlScoreDetails {
  credibility_authority: {
    score: number;
    details: {
      sources_verifiables: number;
      certifications: number;
      avis_clients: number;
      historique_marque: number;
    };
  };
  structure_readability: {
    score: number;
    details: {
      hierarchie: number;
      formatage: number;
      lisibilite: number;
      longueur_optimale: number;
      multimedia: number;
    };
  };
  contextual_relevance: {
    score: number;
    details: {
      reponse_intention: number;
      personnalisation: number;
      actualite: number;
      langue_naturelle: number;
      localisation: number;
    };
  };
  technical_compatibility: {
    score: number;
    details: {
      donnees_structurees: number;
      meta_donnees: number;
      performances: number;
      compatibilite_mobile: number;
      securite: number;
    };
  };
  total_score: number;
  grade: string;
  primary_recommendations: string[];
}

// Résultats du benchmark
export interface BenchmarkResults {
  benchmark: {
    classement: Array<{ url: string; score: number }>;
    position_cible: number;
    ecarts_vs_cible: Array<{ url: string; score: number; ecart_vs_cible: number }>;
    comparaison?: string;
  };
  url_scores: Record<string, UrlScoreDetails | { url: string; error: string }>;
  raw_data?: Record<string, UrlScoreDetails | { url: string; error: string }>;
  summary?: string;
}

// Structure principale de l'analyse concurrentielle v1
export interface AnalyseConcurrentielleV1 {
  version: string;
  session_id: string | null;
  url: string;
  competitors: Competitor[];
  mini_llm_results: MiniLLMResult[];
  benchmark_results: BenchmarkResults;
  stats: {
    total_mentions: number;
    unique_competitors: number;
    models_used: string[];
  };
  created_at: string;
}

export interface AnalyseConcurrentielleV3 {
  version: string;
  analysis_id: number;
  url: string;
  status: string;
  consolidated_competitors: Array<{
    name: string;
    primary_url: string;
    all_urls: string[];
    average_score: number;
    models_count: number;
    global_rank: number;
    source_models: string[];
    favicon_url?: string;
  }>;
  global_stats: {
    total_models_executed: number;
    total_competitors_found: number;
    min_score: number;
    min_mentions: number;
  };
  created_at: string;
}

export interface EvolutionConcurrents {
  target_evolution: Array<{ session_id: number; date: string; score: number }>;
  target_trend: { direction: 'up' | 'down' | 'stable' | 'insufficient_data'; change: number };
  competitors: Record<string, {
    history: Array<{ session_id: number; date: string; score: number; rank: number }>;
    score_trend: 'up' | 'down' | 'stable';
    presence_rate: number;
  }>;
  new_competitors: Array<{ name: string; first_seen: string; rank: number }>;
  disappeared_competitors: Array<{ name: string; last_seen: string; rank: number }>;
}

export interface EvolutionCitations {
  global_evolution: Array<{ session_id: number; date: string; probability: number }>;
  global_trend: { direction: 'up' | 'down' | 'stable' | 'insufficient_data'; change: number };
  per_model: Record<string, Array<{ session_id: number; date: string; probability: number }>>;
  sentiment_evolution: Array<{ session_id: number; date: string; positive_rate: number; negative_rate: number }>;
  insights: string[];
}

export interface BenchmarkTechnique {
  status: string;
  target: {
    url: string;
    score_global: number;
    content_score: number;
    response_time_score: number;
    seo_score: number;
    load_time_ms: number;
    content_elements: {
      paragraphs: number;
      headings: number;
      links: number;
      images: number;
    };
    seo_elements: {
      title: string;
      description: string;
      structured_data: number;
    };
  };
  ranking: Array<{ url: string; score_global: number; [key: string]: any }>;
  target_position: number;
  total_sites: number;
  competitor_comparisons: Array<{ url: string; [key: string]: any }>;
  summary: Record<string, any>;
}

export interface FullReportData {
  report: Report;
  analyses: Analysis[];
  analyse_citation?: any;
  competitor_analysis?: any;
  analyse_concurrentielle_v1?: AnalyseConcurrentielleV1 | null;
  analyse_concurrentielle_v3?: AnalyseConcurrentielleV3 | null;
  materiality_matrix?: any;
  benchmark_technique?: BenchmarkTechnique | null;
  evolution_concurrents?: EvolutionConcurrents | null;
  evolution_citations?: EvolutionCitations | null;
}

/**
 * Récupère un rapport LLMO complet par ID
 */
export async function fetchReport(reportId: string): Promise<FullReportData | null> {
  try {
    const url = `${API_BASE_URL}/llmo/reports/${reportId}?include_evolution=true`;

    // Utiliser AuthService.makeAuthenticatedRequest comme dans LLMODashboard
    const response = await AuthService.makeAuthenticatedRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Erreur lors du chargement du rapport: ${response.status} ${response.statusText}`;

      // Gestion spécifique des erreurs courantes
      switch (response.status) {
        case 404:
          errorMessage = 'Rapport non trouvé. Il a peut-être été supprimé.';
          break;
        case 403:
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions pour voir ce rapport.';
          break;
        case 422:
          errorMessage = 'Erreur de traitement du rapport. Le contenu analysé peut être problématique.';
          break;
        case 429:
          errorMessage = 'Trop de requêtes. Veuillez patienter quelques instants.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Le service est temporairement indisponible.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service indisponible. Veuillez réessayer plus tard.';
          break;
      }

      throw new Error(errorMessage);
    }

    const rawData = await response.json();

    // Mapper la réponse API vers le format attendu par le frontend
    // L'API retourne { llmo_report: {...}, analyses: [...], analyse_concurrentielle_v1: {...} }
    // Le frontend attend { report: {...}, analyses: [...], analyse_concurrentielle_v1: {...} }
    const data: FullReportData = {
      report: rawData.llmo_report || rawData.report,
      analyses: rawData.analyses || [],
      analyse_citation: rawData.analyse_citation,
      competitor_analysis: rawData.competitor_analysis,
      analyse_concurrentielle_v1: rawData.analyse_concurrentielle_v1 || null,
      analyse_concurrentielle_v3: rawData.analyse_concurrentielle_v3 || null,
      materiality_matrix: rawData.materiality_matrix || null,
      benchmark_technique: rawData.benchmark_technique || null,
      evolution_concurrents: rawData.evolution_concurrents || null,
      evolution_citations: rawData.evolution_citations || null,
    };

    return data;

  } catch (error) {
    return null;
  }
}

export interface StreamAnalysisProgress {
  event: string;
  data: Record<string, unknown>;
}

export interface StreamingContextInterface {
  startSession: (url: string) => string;
  addEvent: (sessionId: string, event: { type: string; message: string; data?: Record<string, unknown> }) => void;
  updateSession: (sessionId: string, updates: Record<string, unknown>) => void;
  completeSession: (sessionId: string, reportId?: string) => void;
  failSession: (sessionId: string, error: string) => void;
}

/**
 * Lance une analyse LLMO via l'endpoint streaming POST /llmo/reports/stream.
 * Consomme les événements SSE (module_completed, llm_completed, analysis_completed, error).
 */
export async function startAnalysisStream(
  url: string,
  options: { onProgress?: (progress: StreamAnalysisProgress) => void } = {}
): Promise<{ reportId: string; status: string; metadata?: Record<string, unknown> } | null> {
  const { onProgress } = options;
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llmo/reports/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url, include_competitor_v1: true, include_citation: true }),
    });

    if (!response.ok) {
      const message = await getAnalysisErrorMessage(response, `Erreur HTTP: ${response.status}`);
      throw new Error(message);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Réponse sans corps (stream)');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result: { reportId: string; status: string; metadata?: Record<string, unknown> } | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const chunk of lines) {
        const eventMatch = chunk.match(/^event:\s*(.+)/m);
        const dataMatch = chunk.match(/^data:\s*(.+)/ms);
        const event = eventMatch ? eventMatch[1].trim() : 'message';
        let data: Record<string, unknown> = {};
        try {
          if (dataMatch) data = JSON.parse(dataMatch[1].trim()) as Record<string, unknown>;
        } catch {
          /* ignorer lignes data invalides */
        }

        onProgress?.({ event, data });

        if (event === 'error') {
          const msg = (data.message as string) ?? 'Erreur lors de l\'analyse';
          throw new Error(msg);
        }
        if (event === 'analysis_completed') {
          const reportId =
            (data.report_id as string) ??
            (data.report_filename as string) ??
            (data.id as string) ??
            `stream-${Date.now()}`;
          result = {
            reportId: String(reportId),
            status: 'completed',
            metadata: data as Record<string, unknown>,
          };
        }
      }
    }

    if (result) return result;
    throw new Error('Analyse terminée sans événement analysis_completed');
  } catch (error) {
    if (error instanceof Error) throw error;
    return null;
  }
}

/**
 * Lance une analyse LLMO via streaming avec intégration au contexte de streaming global.
 * Affiche les événements en temps réel dans le mini modal de notification.
 */
export async function startAnalysisStreamWithContext(
  url: string,
  streamingContext: StreamingContextInterface
): Promise<{ reportId: string; status: string; metadata?: Record<string, unknown> } | null> {
  const sessionId = streamingContext.startSession(url);

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llmo/reports/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url, include_competitor_v1: true, include_citation: true }),
    });

    if (!response.ok) {
      const message = await getAnalysisErrorMessage(response, `Erreur HTTP: ${response.status}`);
      streamingContext.failSession(sessionId, message);
      throw new Error(message);
    }

    // Mettre à jour le statut vers "streaming"
    streamingContext.updateSession(sessionId, { status: 'streaming' });
    streamingContext.addEvent(sessionId, {
      type: 'started',
      message: 'Analyse démarrée',
    });

    const reader = response.body?.getReader();
    if (!reader) {
      const error = 'Réponse sans corps (stream)';
      streamingContext.failSession(sessionId, error);
      throw new Error(error);
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result: { reportId: string; status: string; metadata?: Record<string, unknown> } | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const chunk of lines) {
        const eventMatch = chunk.match(/^event:\s*(.+)/m);
        const dataMatch = chunk.match(/^data:\s*(.+)/ms);
        const event = eventMatch ? eventMatch[1].trim() : 'message';
        let data: Record<string, unknown> = {};
        try {
          if (dataMatch) data = JSON.parse(dataMatch[1].trim()) as Record<string, unknown>;
        } catch {
          /* ignorer lignes data invalides */
        }

        // Traiter les événements et mettre à jour le contexte de streaming
        if (event === 'module_completed') {
          const moduleIndex = (data.module_index as number) ?? 0;
          const totalModules = (data.total_modules as number) ?? 0;
          const llmName = (data.llm_name as string) || 'LLM';

          streamingContext.updateSession(sessionId, {
            completedModules: moduleIndex + 1,
            totalModules,
            currentLLM: llmName,
            progress: totalModules > 0 ? ((moduleIndex + 1) / totalModules) * 100 : 0,
          });

          streamingContext.addEvent(sessionId, {
            type: 'module_completed',
            message: `${llmName} — ${Math.round(((moduleIndex + 1) / totalModules) * 100)}%`,
            data,
          });
        }

        if (event === 'llm_completed') {
          const llmName = (data.llm_name as string) || 'LLM';
          const durationSec = data.duration_sec as number | undefined;

          streamingContext.addEvent(sessionId, {
            type: 'llm_completed',
            message: durationSec
              ? `${llmName} terminé en ${durationSec.toFixed(1)}s`
              : `${llmName} terminé`,
            data,
          });
        }

        if (event === 'error') {
          const msg = (data.message as string) ?? 'Erreur lors de l\'analyse';
          streamingContext.failSession(sessionId, msg);
          throw new Error(msg);
        }

        if (event === 'analysis_completed') {
          const reportId =
            (data.report_id as string) ??
            (data.report_filename as string) ??
            (data.id as string) ??
            `stream-${Date.now()}`;

          result = {
            reportId: String(reportId),
            status: 'completed',
            metadata: data as Record<string, unknown>,
          };

          streamingContext.completeSession(sessionId, String(reportId));
        }
      }
    }

    if (result) return result;

    const error = 'Analyse terminée sans événement analysis_completed';
    streamingContext.failSession(sessionId, error);
    throw new Error(error);
  } catch (error) {
    if (error instanceof Error) {
      // Assurez-vous que la session est marquée comme échouée si ce n'est pas déjà fait
      streamingContext.failSession(sessionId, error.message);
      throw error;
    }
    streamingContext.failSession(sessionId, 'Erreur inconnue');
    return null;
  }
}

/**
 * Lance une nouvelle analyse LLMO avec deux appels API en parallèle pour optimiser les performances
 */
export async function startAnalysis(url: string): Promise<{ reportId: string; status: string; metadata?: any } | null> {
  try {

    // Faire deux appels API en parallèle pour optimiser les performances
    const [analysisResponse, metadataResponse] = await Promise.all([
      // Premier appel : Lancer l'analyse principale
      fetchWithAuth(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, include_competitor_v1: true, include_citation: true }),
      }),

      // Deuxième appel : Récupérer les métadonnées ou configurations
      fetchWithAuth(`${API_BASE_URL}/analyze/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          get_metadata: true,
          optimization_level: 'high'
        }),
      })
    ]);

    // Vérifier que les deux réponses sont OK
    if (!analysisResponse.ok) {
      const message = await getAnalysisErrorMessage(analysisResponse, `Erreur HTTP analyse: ${analysisResponse.status}`);
      throw new Error(message);
    }

    if (!metadataResponse.ok) {
    }

    // Traiter les réponses
    const analysisData = await analysisResponse.json();
    const metadataData = metadataResponse.ok ? await metadataResponse.json() : null;

    
    // Adapter la réponse selon le format de votre API
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing',
      metadata: metadataData || null
    };

    return result;
    
  } catch (error) {
    return null;
  }
}

/**
 * Lance une nouvelle analyse LLMO avec deux appels API séquentiels 
 * (le deuxième appel dépend du premier)
 */
export async function startAnalysisSequential(
  url: string, 
  options: { model?: string } = {}
): Promise<{ reportId: string; status: string; optimizationResults?: any } | null> {
  try {
    const { model = 'gpt-4o' } = options;

    // Premier appel : Lancer l'analyse principale
    const analysisResponse = await fetchWithAuth(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, include_competitor_v1: true, include_citation: true }),
    });

    if (!analysisResponse.ok) {
      const message = await getAnalysisErrorMessage(analysisResponse, `Erreur HTTP analyse: ${analysisResponse.status}`);
      throw new Error(message);
    }

    const analysisData = await analysisResponse.json();

    // Deuxième appel : Optimisation basée sur les résultats du premier
    let optimizationData = null;
    
    // Essayer plusieurs endpoints d'optimisation
    const optimizationEndpoints = [
      `${API_BASE_URL}/optimize`,
      `${API_BASE_URL}/analyze/optimize`, 
      `${API_BASE_URL}/analyze/enhance`
    ];
    
    for (const endpoint of optimizationEndpoints) {
      try {
        const optimizationResponse = await fetchWithAuth(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url,
            model,
            analysis_id: analysisData.id || analysisData.reportId || analysisData.analysis_id
          }),
        });

        if (optimizationResponse.ok) {
          optimizationData = await optimizationResponse.json();
          break;
        } else {
        }
      } catch (error) {
      }
    }
    
    if (!optimizationData) {
    }
    
    // Retourner les résultats combinés
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing',
      optimizationResults: optimizationData
    };

    return result;
    
  } catch (error) {
    return null;
  }
}

/**
 * Lance une nouvelle analyse sur le port 8001 avec les paramètres étendus
 */
export async function startAnalysisExtended(
  url: string,
  options: {
    min_score?: number;
    min_mentions?: number;
    models?: string[];
    include_raw?: boolean;
  } = {}
): Promise<{ reportId: string; status: string; data?: any } | null> {
  try {
    const {
      min_score = 0.3,
      min_mentions = 1,
      models = ['gpt-5', 'claude-4-sonnet', 'gemini-2.5-pro'],
      include_raw = false
    } = options;


    const analysisResponse = await fetchWithAuth(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        min_score,
        min_mentions,
        models,
        include_raw,
        include_competitor_v1: true,
        include_citation: true
      }),
    });

    if (!analysisResponse.ok) {
      const message = await getAnalysisErrorMessage(analysisResponse, `Erreur HTTP analyse étendue: ${analysisResponse.status}`);
      throw new Error(message);
    }

    const analysisData = await analysisResponse.json();
    
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing',
      data: analysisData
    };

    return result;
    
  } catch (error) {
    return null;
  }
}

/**
 * Lance une nouvelle analyse LLMO simple (sans optimisation)
 * Version de fallback si l'optimisation n'est pas disponible
 */
export async function startAnalysisSimple(
  url: string, 
  options: { model?: string } = {}
): Promise<{ reportId: string; status: string } | null> {
  try {
    const { model = 'gpt-4o' } = options;

    // Appel unique : Lancer l'analyse principale
    const analysisResponse = await fetchWithAuth(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        model,
        optimization_level: 'basic',
        include_competitor_v1: true,
        include_citation: true
      }),
    });

    if (!analysisResponse.ok) {
      const message = await getAnalysisErrorMessage(analysisResponse, `Erreur HTTP analyse: ${analysisResponse.status}`);
      throw new Error(message);
    }

    const analysisData = await analysisResponse.json();
    
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing'
    };

    return result;
    
  } catch (error) {
    return null;
  }
}

/**
 * Vérifie le statut d'une analyse en cours
 */
export async function checkAnalysisStatus(reportId: string): Promise<{ status: string; progress: number } | null> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llmo/reports/${reportId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      status: data.status || 'unknown',
      progress: data.progress || 0
    };
  } catch (error) {
    return null;
  }
}

/**
 * Liste tous les rapports disponibles depuis votre backend
 */
export async function listReports(): Promise<ReportResponse[]> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llmo/reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du chargement des rapports: ${response.status}`);
    }

    const data = await response.json();

    if (!data.reports || !Array.isArray(data.reports)) {
      return [];
    }

    // Mapper la réponse du backend au format ReportResponse
    return data.reports.map((report: any) => ({
      id: report.id.toString(),
      url: report.url,
      status: report.status === 'success' ? 'completed' : 'failed',
      createdAt: report.created_at,
      duration: report.duration ?? 0,
      rawData: '',
      metadata: {
        llmsUsed: report.metadata?.llmsUsed ?? [],
        totalAnalyses: report.metadata?.totalAnalyses ?? 0,
        completionRate: report.metadata?.completionRate ?? (report.status === 'success' ? 100 : 0),
        score: report.score_produit_analyse
      }
    }));

  } catch (error) {
    throw error;
  }
}

/**
 * Lance une analyse personnalisée avec les paramètres spécifiés par l'utilisateur
 */
export async function startCustomAnalysis(params: {
  url: string;
  min_score?: number;
  min_mentions?: number;
  include_raw?: boolean;
  include_competitor_analysis?: boolean;
}): Promise<{ reportId: string; status: string; data?: any } | null> {
  try {
    const payload = {
      url: params.url,
      min_score: params.min_score ?? 0.3,
      min_mentions: params.min_mentions ?? 1,
      include_raw: params.include_raw ?? false,
      include_competitor_analysis: params.include_competitor_analysis ?? true,
      include_competitor_v1: true,
      include_citation: true
    };


    const response = await fetchWithAuth(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await getAnalysisErrorMessage(response, `Erreur HTTP: ${response.status}`);
      throw new Error(message);
    }

    const data = await response.json();
    return {
      reportId: data.id || data.reportId || data.analysis_id || `analysis-${Date.now()}`,
      status: data.status || 'processing',
      data
    };
  } catch (error) {
    return null;
  }
}

/**
 * Fonction utilitaire pour choisir automatiquement la meilleure stratégie d'appels API
 */
export async function startOptimizedAnalysis(
  url: string, 
  options: {
    strategy?: 'parallel' | 'sequential' | 'auto';
    includeMetadata?: boolean;
    optimizationLevel?: 'low' | 'medium' | 'high';
    model?: string;
  } = {}
): Promise<{ reportId: string; status: string; metadata?: any; optimizationResults?: any } | null> {
  const { strategy = 'auto', includeMetadata = true, optimizationLevel = 'medium', model } = options;
  
  
  try {
    // Auto-sélection de la stratégie
    if (strategy === 'auto') {
      // Utiliser parallèle par défaut pour de meilleures performances
      // Sauf si on a besoin d'optimisations avancées
      if (optimizationLevel === 'high') {
        const result = await startAnalysisSequential(url, { model });
        if (result) return result;
        // Fallback vers simple si séquentiel échoue
        return await startAnalysisSimple(url, { model });
      } else {
        return await startAnalysis(url);
      }
    }
    
    // Stratégie manuelle
    if (strategy === 'sequential') {
      const result = await startAnalysisSequential(url, { model });
      if (result) return result;
      // Fallback vers simple si séquentiel échoue
      return await startAnalysisSimple(url, { model });
    }
    
    return await startAnalysis(url);
  } catch (error) {
    return await startAnalysisSimple(url, { model });
  }
}


