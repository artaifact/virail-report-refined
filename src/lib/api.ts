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
    position?: number | null;
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

export interface CrawlOptimizerResult {
  score: {
    overall: number;
    breakdown: {
      structured_data: number;
      semantic_html: number;
      entity_coverage: number;
      content_clarity: number;
      meta_completeness: number;
    };
  };
  platform: string;
  schemas_added: string[];
  enrichments_applied: string[];
  existing_schemas: any[];
  missing_schemas: string[];
  recommendations: Array<{ message: string; details?: string; priority: 'high' | 'medium' | 'low' }>;
  entity_coverage: Record<string, boolean>;
  structured_data_coverage: { existing: string[]; recommended: string[] };
  llms_txt: string;
  llms_full_txt?: string;
  robots_txt: string;
  schemas: any[];
  html?: string;
  processing_time_ms?: number;
}

/**
 * Récupère l'optimisation complète d'une page (schemas, llms.txt, etc.)
 * Essaie d'abord de récupérer une analyse stockée (GET), puis lance l'optimisation (POST) si aucune n'existe.
 */
export async function fetchPageOptimization(url: string): Promise<any | null> {
  try {
    // 1. Essayer de récupérer une analyse déjà stockée/cachée
    const cached = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/optimize?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (cached.ok) {
      const data = await cached.json();
      if (data && (data.schemas || data.llms_txt || data.score || data.metadata)) return data;
    }
  } catch {
    // GET non supporté ou erreur, on continue avec POST
  }
  try {
    // 2. Fallback : lancer l'optimisation
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
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
  crawl_optimizer?: CrawlOptimizerResult | null;
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
      crawl_optimizer: rawData.crawl_optimizer || null,
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

interface LlmoJobsCreateResponse {
  job_id?: string;
  task_id?: string;
  analysis_id?: number | string;
  llmo_report_id?: number | string;
  report_id?: number | string;
  status?: string;
  latest_event?: {
    event?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
  events?: Array<{
    seq?: number;
    event?: string;
    timestamp?: string | null;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  error?: string | null;
  llmo_report?: {
    id?: number | string;
    get_url?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

const DEFAULT_CITATION_MODELS = [
  'gpt-4o',
  'claude-4-sonnet',
  'gemini-2.5-pro',
  'mistral-large',
  'sonar-pro',
  'deepseek-chat',
  'qwen-2.5-72b',
  'llama-3.1-70b',
  'grok-4',
];

function isCompletedStatus(status: unknown): boolean {
  if (typeof status !== 'string') return false;
  const s = status.toLowerCase();
  return s === 'completed' || s === 'success' || s === 'done' || s === 'finished';
}

function isFailedStatus(status: unknown): boolean {
  if (typeof status !== 'string') return false;
  const s = status.toLowerCase();
  return s === 'failed' || s === 'error' || s === 'cancelled' || s === 'canceled';
}

function extractReportIdFromJob(
  job?: LlmoJobsCreateResponse | null,
  fallback?: unknown
): string | null {
  const value =
    job?.llmo_report_id ??
    job?.llmo_report?.id ??
    job?.report_id ??
    job?.analysis_id ??
    fallback;
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function toPercentProgress(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  if (value <= 1) return Math.max(0, Math.min(100, value * 100));
  return Math.max(0, Math.min(100, value));
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getJobId(job: LlmoJobsCreateResponse): string {
  const id = job.job_id ?? job.task_id;
  if (!id) throw new Error('Réponse invalide: job_id/task_id manquant');
  return String(id);
}

function buildJobDetailUrl(jobId: string): string {
  return `${API_BASE_URL}/llmo/jobs/${encodeURIComponent(jobId)}?include_events=true&events_limit=50`;
}

async function getOnboardingAgencyName(): Promise<string> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/user/onboarding/account-data`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) return '';
    const data = await response.json();
    return typeof data?.agency_name === 'string' ? data.agency_name : '';
  } catch {
    return '';
  }
}

async function createLlmoJob(url: string): Promise<{ job: LlmoJobsCreateResponse; request: Record<string, unknown>; jobId: string }> {
  const citationBrandName = await getOnboardingAgencyName();
  const requestBody: Record<string, unknown> = {
    url,
    include_competitor_v1: true,
    include_competitor_v3: true,
    include_benchmark: true,
    include_llmo_analysis: true,
    include_citation: true,
    citation_brand_name: citationBrandName,
    citation_num_queries: 12,
    citation_models: DEFAULT_CITATION_MODELS,
    citation_include_history: true,
    citation_history_limit: 10,
    citation_use_semantic: true,
    citation_detection_v2_enabled: true,
    citation_web_search_enabled: true,
    include_evolution: true,
    include_crawl_optimizer: true,
    include_analyses: false,
  };

  const response = await fetchWithAuth(`${API_BASE_URL}/llmo/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const message = await getAnalysisErrorMessage(response, `Erreur HTTP: ${response.status}`);
    throw new Error(message);
  }

  const job = await response.json() as LlmoJobsCreateResponse;
  const jobId = getJobId(job);
  return { job, request: requestBody, jobId };
}

async function fetchJobDetail(jobId: string): Promise<LlmoJobsCreateResponse> {
  const response = await fetchWithAuth(buildJobDetailUrl(jobId), {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    const message = await getAnalysisErrorMessage(response, `Erreur HTTP job detail: ${response.status}`);
    throw new Error(message);
  }
  return await response.json() as LlmoJobsCreateResponse;
}

function formatJobEventMessage(eventName: string): string {
  const map: Record<string, string> = {
    analysis_started: 'Demarrage de l’analyse',
    content_fetched: 'Contenu recupere',
    llms_loaded: 'Modeles charges',
    module_completed: 'Un module LLM termine',
    llm_completed: 'Un LLM termine',
    competitor_analysis_started: 'Concurrence demarree',
    competitor_v1_completed: 'Concurrence V1 terminee',
    competitor_v3_completed: 'Concurrence V3 terminee',
    citation_analysis_started: 'Citation demarree',
    citation_analysis_completed: 'Citation terminee',
    crawl_optimizer_started: 'Crawl optimizer demarre',
    crawl_optimizer_progress: 'Crawl optimizer en cours',
    crawl_optimizer_completed: 'Crawl optimizer termine',
    audit_4_piliers_completed: 'Audit termine',
    evolution_started: 'Evolution demarree',
    evolution_completed: 'Evolution terminee',
    analysis_completed: 'Job termine',
    error: 'Echec du job',
  };
  return map[eventName] || eventName;
}

async function pollJobStatusUntilDone(
  jobId: string,
  options: { onStatus?: (data: LlmoJobsCreateResponse) => void; maxAttempts?: number } = {}
): Promise<LlmoJobsCreateResponse> {
  const { onStatus, maxAttempts = 720 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusData = await fetchJobDetail(jobId);
    onStatus?.(statusData);

    if (isFailedStatus(statusData.status)) {
      const message = (statusData.error as string) || 'Le job a echoue';
      throw new Error(message);
    }

    if (isCompletedStatus(statusData.status)) {
      return statusData;
    }

    // 2s pendant les 20 premieres secondes puis 5s
    const intervalMs = attempt < 10 ? 2000 : 5000;
    await sleep(intervalMs);
  }

  throw new Error('Timeout: le job n\'est pas terminé dans le délai imparti');
}

/**
 * Lance une analyse LLMO via POST /llmo/jobs puis suit les événements SSE via events_url.
 */
export async function startAnalysisStream(
  url: string,
  options: { onProgress?: (progress: StreamAnalysisProgress) => void } = {}
): Promise<{ reportId: string; status: string; metadata?: Record<string, unknown> } | null> {
  const { onProgress } = options;

  try {
    const { job, request, jobId } = await createLlmoJob(url);
    onProgress?.({ event: 'pending', data: job as Record<string, unknown> });

    const finalJob = await pollJobStatusUntilDone(jobId, {
      onStatus: (data) => {
        const latestEvent = data.latest_event?.event;
        if (latestEvent && typeof latestEvent === 'string') {
          onProgress?.({
            event: latestEvent,
            data: (data.latest_event?.data as Record<string, unknown>) || {},
          });
        } else {
          onProgress?.({
            event: String(data.status || 'running'),
            data: data as Record<string, unknown>,
          });
        }
      },
    });

    const reportId =
      extractReportIdFromJob(finalJob, extractReportIdFromJob(job, jobId)) ??
      `job-${Date.now()}`;

    return {
      reportId,
      status: 'completed',
      metadata: {
        job_id: jobId,
        job_created: job,
        job_final: finalJob,
        request,
      },
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    return null;
  }
}

/**
 * Lance une analyse LLMO via jobs avec intégration au contexte de streaming global.
 */
export async function startAnalysisStreamWithContext(
  url: string,
  streamingContext: StreamingContextInterface
): Promise<{ reportId: string; status: string; metadata?: Record<string, unknown> } | null> {
  const sessionId = streamingContext.startSession(url);

  try {
    const { job, request, jobId } = await createLlmoJob(url);
    streamingContext.updateSession(sessionId, { status: 'connecting', progress: 0 });
    streamingContext.addEvent(sessionId, {
      type: 'started',
      message: `Analyse demarree (job ${jobId})`,
      data: job as Record<string, unknown>,
    });

    let lastEventSeq: number | null = null;
    const finalJob = await pollJobStatusUntilDone(jobId, {
      onStatus: (data) => {
        const status = String(data.status || 'running').toLowerCase();
        if (status === 'pending') {
          streamingContext.updateSession(sessionId, { status: 'connecting' });
        } else {
          streamingContext.updateSession(sessionId, { status: 'streaming' });
        }

        const latestEventName = data.latest_event?.event;
        const latestEventData = (data.latest_event?.data as Record<string, unknown>) || {};
        const progressFromData = toPercentProgress((latestEventData as Record<string, unknown>)?.progress ?? (data as Record<string, unknown>)?.progress);
        if (progressFromData !== null) {
          streamingContext.updateSession(sessionId, { progress: progressFromData });
        }

        if (Array.isArray(data.events)) {
          const freshEvents = data.events
            .filter((evt) => typeof evt.seq === 'number' && (lastEventSeq === null || (evt.seq as number) > lastEventSeq))
            .sort((a, b) => Number(a.seq ?? 0) - Number(b.seq ?? 0));
          freshEvents.forEach((evt) => {
            const evtName = String(evt.event || 'running');
            const evtData = (evt.data as Record<string, unknown>) || {};
            const evtType =
              evtName === 'error' ? 'error' :
              evtName === 'analysis_completed' ? 'analysis_completed' :
              evtName === 'llm_completed' ? 'llm_completed' :
              'module_completed';
            const message = formatJobEventMessage(evtName);
            streamingContext.addEvent(sessionId, { type: evtType, message, data: evtData });
          });
          if (freshEvents.length > 0) {
            lastEventSeq = Number(freshEvents[freshEvents.length - 1].seq ?? lastEventSeq ?? 0);
          }
        } else if (latestEventName && typeof latestEventName === 'string') {
          const evtType =
            latestEventName === 'error' ? 'error' :
            latestEventName === 'analysis_completed' ? 'analysis_completed' :
            latestEventName === 'llm_completed' ? 'llm_completed' :
            'module_completed';
          streamingContext.addEvent(sessionId, {
            type: evtType,
            message: formatJobEventMessage(latestEventName),
            data: latestEventData,
          });
        }

        if (isFailedStatus(data.status)) {
          streamingContext.failSession(sessionId, String(data.error || 'Le job a echoue'));
        }
      },
    });

    const reportId =
      extractReportIdFromJob(finalJob, extractReportIdFromJob(job, jobId)) ??
      `job-${Date.now()}`;

    streamingContext.completeSession(sessionId, reportId);
    return {
      reportId,
      status: 'completed',
      metadata: {
        job_id: jobId,
        job_created: job,
        job_final: finalJob,
        request,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      streamingContext.failSession(sessionId, error.message);
      throw error;
    }
    streamingContext.failSession(sessionId, 'Erreur inconnue');
    return null;
  }
}

/**
 * Lance une nouvelle analyse LLMO via le système de jobs asynchrones.
 */
export async function startAnalysis(url: string): Promise<{ reportId: string; status: string; metadata?: any } | null> {
  return startAnalysisStream(url);
}

/**
 * Lance une nouvelle analyse LLMO via le système de jobs asynchrones.
 */
export async function startAnalysisSequential(
  url: string,
  options: { model?: string } = {}
): Promise<{ reportId: string; status: string; optimizationResults?: any } | null> {
  return startAnalysisStream(url);
}

/**
 * Lance une nouvelle analyse LLMO via le système de jobs asynchrones.
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
  return startAnalysisStream(url);
}

/**
 * Lance une nouvelle analyse LLMO via le système de jobs asynchrones.
 */
export async function startAnalysisSimple(
  url: string,
  options: { model?: string } = {}
): Promise<{ reportId: string; status: string } | null> {
  return startAnalysisStream(url);
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
    const mappedReports: ReportResponse[] = data.reports.map((report: any) => {
      const rawStatus = String(report.status || '').toLowerCase();
      const isCompleted = rawStatus === 'success' || rawStatus === 'completed' || rawStatus === 'done' || rawStatus === 'finished';
      const isProcessing = rawStatus === 'processing' || rawStatus === 'running' || rawStatus === 'pending' || rawStatus === 'in_progress';
      const statusValue: 'completed' | 'processing' | 'failed' = isCompleted
        ? 'completed'
        : isProcessing
        ? 'processing'
        : 'failed';

      return {
        id: report.id.toString(),
        url: report.url,
        status: statusValue,
        createdAt: report.created_at,
        duration: report.duration ?? 0,
        rawData: '',
        metadata: {
          llmsUsed: report.metadata?.llmsUsed ?? [],
          totalAnalyses: report.metadata?.totalAnalyses ?? 0,
          completionRate: report.metadata?.completionRate ?? (isCompleted ? 100 : 0),
          score: report.score_produit_analyse,
          position: report.position_produit_analyse ?? null
        }
      };
    });

    // Trier les rapports du plus récent au plus ancien
    return mappedReports.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (!isNaN(timeDiff) && timeDiff !== 0) return timeDiff;
      }
      const numA = Number(a.id);
      const numB = Number(b.id);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA;
      }
      return String(b.id).localeCompare(String(a.id));
    });

  } catch (error) {
    throw error;
  }
}

/**
 * Lance une analyse personnalisée via le système de jobs asynchrones.
 */
export async function startCustomAnalysis(params: {
  url: string;
  min_score?: number;
  min_mentions?: number;
  include_raw?: boolean;
  include_competitor_analysis?: boolean;
}): Promise<{ reportId: string; status: string; data?: any } | null> {
  return startAnalysisStream(params.url);
}

/**
 * Fonction utilitaire pour choisir automatiquement la meilleure stratégie d'appels API
 */
// === BULK OPTIMIZATION ===

export interface BulkJobResponse {
  job_id: string;
}

export interface BulkJobProgress {
  job_id: string;
  status: 'discovering' | 'processing' | 'completed' | 'failed' | 'cancelled';
  phase: 'discovery' | 'processing' | 'aggregation' | 'completed';
  domain_url: string;
  discovery: { urls_found: number; sitemap_urls: number; crawled_urls: number };
  processing: { total: number; completed: number; failed: number };
  pages: BulkPageResult[];
  languages: string[] | null;
  avg_score: number | null;
  site_llms_txt: string | null;
  site_robots_txt: string | null;
  started_at: string | null;
  completed_at: string | null;
  elapsed_seconds: number;
}

export interface BulkPageResult {
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  score: number | null;
  language: string | null;
  page_type: string | null;
  schemas_added: string[] | null;
  processing_time_ms: number | null;
  error_message: string | null;
}

export interface BulkJobSummary {
  job_id: string;
  status: 'discovering' | 'processing' | 'completed' | 'failed' | 'cancelled';
  phase: 'discovery' | 'processing' | 'aggregation' | 'completed';
  domain_url: string;
  pages_total: number;
  pages_completed: number;
  pages_failed: number;
  avg_score: number | null;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Lance un job d'optimisation bulk sur un domaine entier
 */
export async function startBulkOptimization(params: {
  domain_url: string;
  llmo_report_id: number;
  max_pages?: number;
  concurrency?: number;
  crawler?: string;
}): Promise<BulkJobResponse | null> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/bulk/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        domain_url: params.domain_url,
        llmo_report_id: params.llmo_report_id,
        max_pages: params.max_pages ?? 500,
        concurrency: params.concurrency ?? 3,
        crawler: params.crawler ?? 'gptbot',
      }),
    });
    if (!response.ok) {
      const message = await getAnalysisErrorMessage(response, `Erreur HTTP: ${response.status}`);
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    return null;
  }
}

/**
 * Récupère la progression d'un job bulk
 */
export async function getBulkProgress(jobId: string): Promise<BulkJobProgress | null> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/bulk/${jobId}/progress`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/** Horodatage pour trier les jobs bulk (plus récent en premier). */
function bulkJobTimeMs(j: BulkJobSummary): number {
  const raw = j.started_at || j.completed_at;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Liste les jobs bulk de l'utilisateur (triés du plus récent au plus ancien,
 * pour que l’UI puisse utiliser jobs[0] comme dernière analyse).
 */
export async function listBulkJobs(): Promise<BulkJobSummary[]> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/bulk/jobs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return [];
    const jobs: BulkJobSummary[] = await response.json();
    if (!Array.isArray(jobs)) return [];
    return [...jobs].sort((a, b) => bulkJobTimeMs(b) - bulkJobTimeMs(a));
  } catch {
    return [];
  }
}

/**
 * Récupère les pages d'un job bulk (endpoint paginé dédié)
 */
export interface BulkPagesResponse {
  pages: BulkPageResult[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export async function getBulkPages(jobId: string, params?: {
  page?: number;
  per_page?: number;
  language?: string;
  status?: string;
  sort?: string;
}): Promise<BulkPagesResponse | null> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.language) query.set('language', params.language);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/bulk/${jobId}/pages${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[getBulkPages] response:', data);
    // Support both { pages: [...] } and direct array
    if (Array.isArray(data)) {
      return { pages: data, pagination: { page: 1, per_page: data.length, total: data.length, total_pages: 1 } };
    }
    if (data?.pages) return data;
    // Maybe { results: [...] } or other key
    const possibleKeys = Object.keys(data);
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        return { pages: data[key], pagination: { page: 1, per_page: data[key].length, total: data[key].length, total_pages: 1 } };
      }
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Récupère les résultats agrégés d'un job bulk
 */
export interface BulkResultsResponse {
  summary: {
    total_pages: number;
    completed: number;
    failed: number;
    avg_score: number | null;
    languages: string[] | null;
  };
  score_distribution: {
    excellent: number;
    good: number;
    needs_work: number;
    poor: number;
  };
  page_types: Record<string, number>;
  site_llms_txt: string | null;
  site_robots_txt: string | null;
}

export async function getBulkResults(jobId: string): Promise<BulkResultsResponse | null> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/bulk/${jobId}/results`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Annule un job bulk
 */
export async function cancelBulkJob(jobId: string): Promise<boolean> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/crawl-optimize/bulk/${jobId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function startOptimizedAnalysis(
  url: string,
  options: {
    strategy?: 'parallel' | 'sequential' | 'auto';
    includeMetadata?: boolean;
    optimizationLevel?: 'low' | 'medium' | 'high';
    model?: string;
  } = {}
): Promise<{ reportId: string; status: string; metadata?: any; optimizationResults?: any } | null> {
  return startAnalysisStream(url);
}


