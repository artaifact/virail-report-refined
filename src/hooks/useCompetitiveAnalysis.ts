
import { useState, useCallback, useEffect } from 'react';
import { runCompetitiveAnalysis, getCompetitiveAnalyses, getCompetitiveAnalysisById, deleteCompetitiveAnalysis } from '@/services/competitiveAnalysisService';
import { usePayment } from '@/hooks/usePayment';
import { AuthService } from '@/services/authService';

// Fonction locale pour obtenir l'URL de l'API
const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  return 'https://api.viraill.com';
};

interface CompetitiveAnalysisState {
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  currentAnalysis: any;
  savedAnalyses: any[];
  error: string | null;
  progress: number;
}

export const useCompetitiveAnalysis = () => {
  const { canUseFeature, getFeatureLimits, usageLimits } = usePayment();

  const [state, setState] = useState<CompetitiveAnalysisState>({
    isAnalyzing: false,
    hasAnalysis: false,
    currentAnalysis: null,
    savedAnalyses: [],
    error: null,
    progress: 0
  });

  // Charger les analyses sauvegardées au démarrage
  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const loadSavedAnalyses = useCallback(async () => {
    try {
      const analyses = await getCompetitiveAnalyses();
      setState(prev => ({
        ...prev,
        savedAnalyses: analyses
      }));
    } catch (error) {
    }
  }, []);

  const startAnalysis = useCallback(async (url: string): Promise<any> => {
    let progressInterval: NodeJS.Timeout | null = null;

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      progress: 0
    }));

    try {
      // Vérifier si l'utilisateur est connecté
      const isAuthenticated = AuthService.isAuthenticated();

      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour lancer une analyse concurrentielle. Veuillez vous connecter et réessayer.');
      }


      // Vérifier que les quotas sont disponibles
      let attempts = 0;
      const maxAttempts = 3;

      while (!usageLimits && attempts < maxAttempts) {

        // Note: Les cookies access_token et refresh_token sont HttpOnly
        // donc ils ne sont pas lisibles depuis JavaScript côté frontend
        // La vérification d'authentification se fait via AuthService.isAuthenticated()

        // Re-vérifier l'authentification à chaque tentative
        const stillAuthenticated = AuthService.isAuthenticated();
        if (!stillAuthenticated) {
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!usageLimits) {

        // Essayer une dernière fois avec un appel direct à l'API
        try {
          const directResponse = await fetch(`${getApiBaseUrl()}/api/v1/usage/limits`, {
            method: 'GET',
            credentials: 'include'
          });

          if (directResponse.ok) {
            const directData = await directResponse.json();
            // Ne pas continuer car on ne peut pas modifier l'état ici
          } else {
          }
        } catch (directError) {
        }
      }


      // Vérifier que nous avons bien les données de quotas
      if (!usageLimits || !usageLimits.can_use_competitor_analysis) {

        // Diagnostic détaillé
       //   usageLimits: !!usageLimits,
       //   hasCompetitorAnalysis: !!(usageLimits?.can_use_competitor_analysis),
       //   competitorAnalysis: usageLimits?.can_use_competitor_analysis,
       //   allKeys: usageLimits ? Object.keys(usageLimits) : []
       // });

        // Essayer quand même
      }

      // Vérifier les quotas avant de lancer l'analyse
      const isAllowed = canUseFeature('competitor_analysis');
      const featureLimits = getFeatureLimits('competitor_analysis');

     //   isAllowed,
     //   type: typeof isAllowed,
     //   usageLimitsLoaded: !!usageLimits,
     //   featureLimits,
     //   rawUsageLimits: usageLimits
     // });

      // Vérification finale avec logique de secours
      const finalAllowed = isAllowed || (usageLimits?.can_use_competitor_analysis?.allowed === true);

      // SOLUTION TEMPORAIRE: Si on n'arrive pas à charger les quotas mais que l'API backend fonctionne,
      // on permet l'analyse et on laisse le backend gérer les quotas
      const bypassQuotaCheck = !usageLimits && !featureLimits;

      if (!finalAllowed && !bypassQuotaCheck) {
        const reason = featureLimits?.reason ||
                      (usageLimits?.can_use_competitor_analysis?.reason) ||
                      'Limite d\'analyses concurrentielles atteinte';
        throw new Error(reason);
      }

      if (bypassQuotaCheck) {
      } else {
      }

      // Simulation du progrès
      progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 15, 90)
        }));
      }, 300);

      const result = await runCompetitiveAnalysis(url);

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        hasAnalysis: true,
        currentAnalysis: result,
        progress: 100
      }));

      // Recharger les analyses sauvegardées après une nouvelle analyse
      await loadSavedAnalyses();

      return result;
    } catch (error) {
      // Nettoyer l'intervalle de progression
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'analyse';

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
        progress: 0
      }));

      throw error;
    }
  }, [canUseFeature, getFeatureLimits, usageLimits, loadSavedAnalyses]);

  const loadAnalysis = useCallback(async (id: string) => {
    try {
      const analysis = await getCompetitiveAnalysisById(id);
      if (analysis) {
        setState(prev => ({
          ...prev,
          currentAnalysis: analysis,
          hasAnalysis: true
        }));

        // Si les données enrichies manquent (mini_llm_results), tenter une récupération enrichie supplémentaire
        const hasMini = (analysis as any)?.mini_llm_results && Array.isArray((analysis as any).mini_llm_results);
        if (!hasMini) {
          try {
            const enriched = await getCompetitiveAnalysisById(id);
            if (enriched && (enriched as any).mini_llm_results) {
              setState(prev => ({
                ...prev,
                currentAnalysis: enriched,
                hasAnalysis: true
              }));
            }
          } catch (e) {
            // ignore
          }
        }
      }
      return analysis;
    } catch (error) {
      return null;
    }
  }, []);

  const deleteAnalysis = useCallback(async (id: string) => {
    try {
      await deleteCompetitiveAnalysis(id);
      setState(prev => ({
        ...prev,
        currentAnalysis: prev.currentAnalysis?.id === id ? null : prev.currentAnalysis,
        hasAnalysis: prev.currentAnalysis?.id === id ? false : prev.hasAnalysis
      }));
      // Recharger les analyses après suppression
      await loadSavedAnalyses();
    } catch (error) {
    }
  }, [loadSavedAnalyses]);

  const resetAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      hasAnalysis: false,
      currentAnalysis: null,
      error: null,
      progress: 0
    }));
  }, []);

  const refreshSavedAnalyses = useCallback(async () => {
    await loadSavedAnalyses();
  }, [loadSavedAnalyses]);

  return {
    ...state,
    startAnalysis,
    loadAnalysis,
    deleteAnalysis,
    resetAnalysis,
    refreshSavedAnalyses
  };
};
