
import { useState, useCallback } from 'react';
import { analyzeWebsite, analyzeFile } from '@/services/analysisService';

interface AnalysisState {
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  analysisData: any;
  error: string | null;
  progress: number;
}

export const useAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    hasAnalysis: false,
    analysisData: null,
    error: null,
    progress: 0
  });

  const startAnalysis = useCallback(async (input: string | File) => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      progress: 0
    }));

    try {
      // Simulation du progrès
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 15, 90)
        }));
      }, 300);

      let result;
      if (typeof input === 'string') {
        result = await analyzeWebsite(input);
      } else {
        result = await analyzeFile(input);
      }

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        hasAnalysis: true,
        analysisData: result,
        progress: 100
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: 'Erreur lors de l\'analyse. Veuillez réessayer.',
        progress: 0
      }));
      throw error;
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      hasAnalysis: false,
      analysisData: null,
      error: null,
      progress: 0
    });
  }, []);

  return {
    ...state,
    startAnalysis,
    resetAnalysis
  };
};
