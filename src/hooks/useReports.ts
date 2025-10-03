import { useState, useEffect } from 'react';
import { fetchReport, listReports, startAnalysis, startAnalysisSequential, checkAnalysisStatus, type FullReportData, type ReportResponse } from '../lib/api';
import { usePayment } from '@/contexts/PaymentContext';

/**
 * Hook pour gérer les rapports LLMO - NOTE: Ce hook est conservé pour la liste mais getReport est déprécié
 */
export function useReports() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { canUseFeature, incrementUsage } = usePayment();

  // Charger la liste des rapports au montage
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportsList = await listReports();
      setReports(reportsList);
    } catch (err) {
      setError('Erreur lors du chargement des rapports');
      console.error('Erreur loadReports:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAnalysis = async (url: string, useSequential: boolean = true, model: string = 'gpt-4o'): Promise<string | null> => {
    try {
      setError(null);
      
      // Vérifier les limites avant de créer l'analyse
      const canUse = canUseFeature('analysis');
      if (!canUse.allowed) {
        setError(canUse.reason || 'Limite d\'analyses atteinte');
        throw new Error(canUse.reason || 'Limite d\'analyses atteinte');
      }
      
      // Utiliser startAnalysisSequential par défaut pour inclure l'optimisation
      const result = useSequential 
        ? await startAnalysisSequential(url, { model })
        : await startAnalysis(url);
      
      if (result) {
        // Ajouter un rapport en cours à la liste pour un retour visuel immédiat
        const newReport: ReportResponse = {
          id: result.reportId,
          url,
          status: result.status || 'processing',
          createdAt: new Date().toISOString(),
          duration: 0,
          rawData: '',
          metadata: { 
            llmsUsed: [], 
            totalAnalyses: 0, 
            completionRate: 0,
            // Ajouter les nouvelles métadonnées si disponibles
            ...(result.metadata && { apiMetadata: result.metadata }),
            ...(result.optimizationResults && { optimizationData: result.optimizationResults })
          }
        };
        setReports(prev => [newReport, ...prev]);
        
        // Incrémenter l'usage après succès
        incrementUsage('analysis');
        
        // Polling pour rafraîchir la liste une fois l'analyse terminée
        const poll = setInterval(async () => {
          const status = await checkAnalysisStatus(result.reportId);
          if (status?.status === 'completed' || status?.status === 'failed') {
            clearInterval(poll);
            loadReports();
          }
        }, 5000); // Poll toutes les 5 secondes

        return result.reportId;
      }
      return null;
    } catch (err) {
      setError('Erreur lors du lancement de l\'analyse');
      console.error('Erreur createAnalysis:', err);
      throw err;
    }
  };

  return {
    reports,
    loading,
    error,
    loadReports,
    createAnalysis,
  };
}

/**
 * Hook pour gérer un rapport spécifique
 */
export function useReport(reportId: string | null) {
  const [report, setReport] = useState<FullReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!reportId) {
      setReport(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const reportData = await fetchReport(reportId);
      setReport(reportData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du rapport';
      setError(errorMessage);
      console.error('Erreur useReport:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const refresh = () => loadReport();

  return {
    report,
    loading,
    error,
    refresh
  };
}

/**
 * Hook pour gérer le statut d'une analyse en cours
 */
export function useAnalysisStatus(reportId: string, intervalMs: number = 2000) {
  const [status, setStatus] = useState<string>('unknown');
  const [progress, setProgress] = useState<number>(0);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!reportId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const statusData = await checkAnalysisStatus(reportId);
        if (statusData) {
          setStatus(statusData.status);
          setProgress(statusData.progress);
          
          // Arrêter le polling si terminé
          if (statusData.status === 'completed' || statusData.status === 'failed') {
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du statut:', err);
        setIsPolling(false);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [reportId, isPolling, intervalMs]);

  const startPolling = () => setIsPolling(true);
  const stopPolling = () => setIsPolling(false);

  return {
    status,
    progress,
    isPolling,
    startPolling,
    stopPolling
  };
} 