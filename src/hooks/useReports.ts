import { useState, useEffect } from 'react';
import { fetchReport, listReports, startAnalysisStream, checkAnalysisStatus, type FullReportData, type ReportResponse } from '../lib/api';
import { usePayment } from '@/contexts/PaymentContext';

/**
 * Retourne l'ID du rapport le plus récent (priorité à la date la plus récente ou au plus grand ID numérique)
 */
export function getLatestReportId(reportsList: ReportResponse[] | null | undefined): string | null {
  if (!reportsList || reportsList.length === 0) return null;

  const sorted = [...reportsList].sort((a, b) => {
    // 1. Priorité à la date de création la plus récente
    if (a.createdAt && b.createdAt) {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (!isNaN(timeDiff) && timeDiff !== 0) return timeDiff;
    }
    // 2. Si pas de date ou dates identiques, priorité à l'ID numérique le plus grand
    const numA = Number(a.id);
    const numB = Number(b.id);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA;
    }
    // 3. Fallback comparaison alphabétique inverse
    return String(b.id).localeCompare(String(a.id));
  });

  return sorted[0]?.id ?? null;
}

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
      
      // Utiliser l'endpoint streaming POST /llmo/reports/stream pour lancer l'analyse LLMO
      const result = await startAnalysisStream(url);
      
      if (result) {
        // Ajouter un rapport en cours à la liste pour un retour visuel immédiat
        const statusValue = result.status === 'completed' || result.status === 'processing' || result.status === 'failed' 
          ? result.status 
          : 'processing';
        const newReport: ReportResponse = {
          id: result.reportId,
          url,
          status: statusValue,
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
      const message = err instanceof Error ? err.message : 'Erreur lors du lancement de l\'analyse';
      setError(message);
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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const reportData = await fetchReport(reportId);
      
      if (reportData) {
        setReport(reportData);
      } else {
        setError('Aucune donnée retournée par le serveur');
        setReport(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du rapport';
      setError(errorMessage);
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