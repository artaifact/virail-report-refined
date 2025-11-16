import { useState, useEffect, useCallback } from 'react';
import { 
  competitorAnalysisServiceV1, 
  CompetitorAnalysisV1, 
  CompetitorAnalysisSummaryV1, 
  AnalysisRequest,
  TaskStatus 
} from '@/services/competitorAnalysisServiceV1';

export interface UseCompetitiveAnalysisV1Return {
  // État des analyses
  analyses: CompetitorAnalysisSummaryV1[];
  selectedAnalysis: CompetitorAnalysisV1 | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  analyzeUrl: (request: AnalysisRequest) => Promise<CompetitorAnalysisV1>;
  analyzeUrlAsync: (request: AnalysisRequest) => Promise<CompetitorAnalysisV1>;
  selectAnalysis: (analysisId: number) => Promise<void>;
  refreshAnalyses: () => Promise<void>;
  
  // État des tâches asynchrones
  taskStatus: TaskStatus | null;
  isTaskRunning: boolean;
}

export const useCompetitiveAnalysisV1 = (): UseCompetitiveAnalysisV1Return => {
  const [analyses, setAnalyses] = useState<CompetitorAnalysisSummaryV1[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CompetitorAnalysisV1 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isTaskRunning, setIsTaskRunning] = useState(false);

  // Charger les analyses au montage du composant
  const loadAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await competitorAnalysisServiceV1.listAnalyses();
      setAnalyses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des analyses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Analyser une URL de manière synchrone
  const analyzeUrl = useCallback(async (request: AnalysisRequest): Promise<CompetitorAnalysisV1> => {
    try {
      setLoading(true);
      setError(null);
      const result = await competitorAnalysisServiceV1.analyzeSync(request);
      
      // Ajouter à la liste des analyses
      const summary: CompetitorAnalysisSummaryV1 = {
        analysis_id: result.analysis_id,
        url: result.url,
        title: result.title,
        description: result.description,
        stats: result.stats,
        created_at: result.created_at,
      };
      
      setAnalyses(prev => [summary, ...prev]);
      setSelectedAnalysis(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analyser une URL de manière asynchrone
  const analyzeUrlAsync = useCallback(async (request: AnalysisRequest): Promise<CompetitorAnalysisV1> => {
    try {
      setLoading(true);
      setError(null);
      setIsTaskRunning(true);
      
      // Lancer l'analyse asynchrone
      const { task_id } = await competitorAnalysisServiceV1.analyzeAsync(request);
      
      // Polling du statut
      const result = await competitorAnalysisServiceV1.pollTaskCompletion(task_id);
      
      // Ajouter à la liste des analyses
      const summary: CompetitorAnalysisSummaryV1 = {
        analysis_id: result.analysis_id,
        url: result.url,
        title: result.title,
        description: result.description,
        stats: result.stats,
        created_at: result.created_at,
      };
      
      setAnalyses(prev => [summary, ...prev]);
      setSelectedAnalysis(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse asynchrone';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setIsTaskRunning(false);
    }
  }, []);

  // Sélectionner une analyse
  const selectAnalysis = useCallback(async (analysisId: number) => {
    try {
      setLoading(true);
      setError(null);
      const analysis = await competitorAnalysisServiceV1.getAnalysis(analysisId);
      setSelectedAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'analyse');
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchir les analyses
  const refreshAnalyses = useCallback(async () => {
    await loadAnalyses();
  }, [loadAnalyses]);

  // Charger les analyses au montage
  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  return {
    analyses,
    selectedAnalysis,
    loading,
    error,
    analyzeUrl,
    analyzeUrlAsync,
    selectAnalysis,
    refreshAnalyses,
    taskStatus,
    isTaskRunning,
  };
};
