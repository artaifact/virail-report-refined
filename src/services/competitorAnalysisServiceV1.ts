import { AuthService } from './authService';

// Types pour l'API v1
export interface CompetitorInfo {
  name: string;
  url: string;
  urls: string[];
  average_score: number;
  mentions: number;
  sources: string[];
  score_details: Record<string, any>;
}

export interface CompetitorAnalysisV1 {
  analysis_id: number;
  url: string;
  title: string;
  description: string;
  competitors: CompetitorInfo[];
  stats: {
    total_mentions: number;
    unique_competitors: number;
    models_used: string[];
  };
  created_at: string;
}

export interface CompetitorAnalysisSummaryV1 {
  analysis_id: number;
  url: string;
  title: string;
  description: string;
  stats: {
    total_mentions: number;
    unique_competitors: number;
    models_used: string[];
  };
  created_at: string;
}

export interface TaskStatus {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  created_at: string;
  completed_at?: string;
  result?: CompetitorAnalysisV1;
}

export interface AnalysisRequest {
  url: string;
  min_score?: number;
  min_mentions?: number;
  include_raw?: boolean;
  models?: string[];
}

const API_BASE_URL = 'http://localhost:8000/api/v1/competitors';

class CompetitorAnalysisServiceV1 {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Analyse synchrone
  async analyzeSync(request: AnalysisRequest): Promise<CompetitorAnalysisV1> {
    return this.makeRequest<CompetitorAnalysisV1>('/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Analyse asynchrone
  async analyzeAsync(request: AnalysisRequest): Promise<{ task_id: string; status: string; message: string }> {
    return this.makeRequest<{ task_id: string; status: string; message: string }>('/analyze-async', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Statut d'une tâche
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    return this.makeRequest<TaskStatus>(`/task/${taskId}`);
  }

  // Liste des analyses
  async listAnalyses(skip: number = 0, limit: number = 20): Promise<CompetitorAnalysisSummaryV1[]> {
    return this.makeRequest<CompetitorAnalysisSummaryV1[]>(`/analyses?skip=${skip}&limit=${limit}`);
  }

  // Récupérer une analyse spécifique
  async getAnalysis(analysisId: number): Promise<CompetitorAnalysisV1> {
    return this.makeRequest<CompetitorAnalysisV1>(`/analyses/${analysisId}`);
  }

  // Résumé par session
  async getSummaryBySession(sessionId: number): Promise<any> {
    return this.makeRequest<any>(`/summary/${sessionId}`);
  }

  // Dernier résumé
  async getLatestSummary(): Promise<any> {
    return this.makeRequest<any>('/summary/latest');
  }

  // Tous les résumés
  async getAllSummaries(): Promise<any[]> {
    return this.makeRequest<any[]>('/summary');
  }

  // Résumé enrichi
  async getEnrichedSummary(sessionId: number): Promise<any> {
    return this.makeRequest<any>(`/summary/enriched/${sessionId}`);
  }

  // Tous les résumés enrichis
  async getAllEnrichedSummaries(url?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (url) {
      params.append('url', url);
    }

    return this.makeRequest<any[]>(`/summary/enriched?${params.toString()}`);
  }

  // Vérification de santé
  async healthCheck(): Promise<{ status: string; timestamp: string; services: any }> {
    return this.makeRequest<{ status: string; timestamp: string; services: any }>('/health');
  }

  // Polling pour les tâches asynchrones
  async pollTaskCompletion(taskId: string, maxAttempts: number = 30, intervalMs: number = 2000): Promise<CompetitorAnalysisV1> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getTaskStatus(taskId);
      
      if (status.status === 'completed') {
        if (!status.result) {
          throw new Error('Tâche terminée mais aucun résultat disponible');
        }
        return status.result;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'La tâche a échoué');
      }
      
      // Attendre avant le prochain poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Timeout: La tâche n\'a pas été terminée dans le délai imparti');
  }
}

export const competitorAnalysisServiceV1 = new CompetitorAnalysisServiceV1();

// Fonction utilitaire pour extraire le domaine d'une URL
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Fonction utilitaire pour formater le score
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

// Fonction utilitaire pour obtenir la couleur du score
export function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}
