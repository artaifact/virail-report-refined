import { useState, useEffect } from 'react';
import { 
  TextualOptimizationData, 
  OptimizationRequest,
  startTextualOptimization,
  fetchOptimization,
  fetchOptimizationById,
  listOptimizations,
  listOptimizationsFromOptimize,
  checkOptimizationStatus,
  calculateImprovementScore
} from '@/services/textualOptimizationService';

interface UseTextualOptimizationReturn {
  // État des données
  optimizations: TextualOptimizationData[];
  currentOptimization: TextualOptimizationData | null;
  
  // État de chargement
  isLoading: boolean;
  isProcessing: boolean;
  
  // État d'erreur
  error: string | null;
  
  // Actions
  loadOptimizations: () => Promise<void>;
  loadOptimization: (id: string) => Promise<void>;
  createOptimization: (request: OptimizationRequest) => Promise<string | null>;
  clearError: () => void;
  clearCurrentOptimization: () => void;
  
  // Utilitaires
  getImprovementScore: (optimization: TextualOptimizationData) => number;
}

export const useTextualOptimization = (optimizationId?: string): UseTextualOptimizationReturn => {
  const [optimizations, setOptimizations] = useState<TextualOptimizationData[]>([]);
  const [currentOptimization, setCurrentOptimization] = useState<TextualOptimizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge toutes les optimisations
   */
  const loadOptimizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Chargement des optimisations depuis l\'API...');
      const data = await listOptimizations();
      console.log('📊 Données récupérées depuis l\'API:', data);
      
      setOptimizations(data);
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des optimisations');
      
      setOptimizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Charge une optimisation spécifique
   */
  const loadOptimization = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser la nouvelle fonction pour récupérer depuis l'API
      const data = await fetchOptimizationById(id);
      setCurrentOptimization(data);
      
      // Ajouter à la liste des optimisations si pas déjà présent
      setOptimizations(prev => {
        const exists = prev.some(opt => opt.id.toString() === id);
        if (!exists) {
          return [data, ...prev];
        }
        return prev;
      });
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement de l\'optimisation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'optimisation');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Crée une nouvelle optimisation
   */
  const createOptimization = async (request: OptimizationRequest): Promise<string | null> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await startTextualOptimization(request);
      
      if (result) {
        // Si l'optimisation est créée avec succès, on peut la charger
        if (result.status === 'completed') {
          await loadOptimization(result.optimizationId);
        } else {
          // Si elle est en cours, on peut surveiller son statut
          pollOptimizationStatus(result.optimizationId);
        }
        
        return result.optimizationId;
      }
      
      return null;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'optimisation');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Surveille le statut d'une optimisation en cours
   */
  const pollOptimizationStatus = async (optimizationId: string) => {
    const maxAttempts = 30; // 5 minutes max (30 * 10s)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const status = await checkOptimizationStatus(optimizationId);
        
        if (status?.status === 'completed') {
          await loadOptimization(optimizationId);
          setIsProcessing(false);
          return;
        }
        
        if (status?.status === 'failed') {
          setError('L\'optimisation a échoué');
          setIsProcessing(false);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Vérifier toutes les 10 secondes
        } else {
          setError('Timeout: l\'optimisation prend trop de temps');
          setIsProcessing(false);
        }
        
      } catch (err) {
        setError('Erreur lors de la vérification du statut');
        setIsProcessing(false);
      }
    };

    checkStatus();
  };

  /**
   * Efface l'erreur courante
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Efface l'optimisation courante
   */
  const clearCurrentOptimization = () => {
    setCurrentOptimization(null);
  };

  /**
   * Calcule le score d'amélioration pour une optimisation
   */
  const getImprovementScore = (optimization: TextualOptimizationData): number => {
    return calculateImprovementScore(optimization);
  };

  // Charger l'optimisation spécifique si un ID est fourni
  useEffect(() => {
    if (optimizationId) {
      console.log('🔄 Chargement de l\'optimisation spécifique:', optimizationId);
      loadOptimization(optimizationId);
    } else {
      loadOptimizations();
    }
  }, [optimizationId]);

  // Charger automatiquement la première optimisation si disponible (seulement si pas d'ID spécifique)
  useEffect(() => {
    if (!optimizationId && optimizations.length > 0 && !currentOptimization) {
      console.log('🔄 Chargement automatique de la première optimisation');
      loadOptimization(optimizations[0].id?.toString() || '');
    }
  }, [optimizations, currentOptimization, optimizationId]);

  return {
    // État des données
    optimizations,
    currentOptimization,
    
    // État de chargement
    isLoading,
    isProcessing,
    
    // État d'erreur
    error,
    
    // Actions
    loadOptimizations,
    loadOptimization,
    createOptimization,
    clearError,
    clearCurrentOptimization,
    
    // Utilitaires
    getImprovementScore
  };
};

/**
 * Hook simplifié pour une optimisation spécifique
 */
export const useOptimization = (optimizationId: string | null) => {
  const [optimization, setOptimization] = useState<TextualOptimizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!optimizationId) {
      setOptimization(null);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchOptimization(optimizationId);
        setOptimization(data);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [optimizationId]);

  return {
    optimization,
    isLoading,
    error,
    refetch: () => optimizationId && useOptimization(optimizationId)
  };
}; 