import { useState, useEffect, useCallback } from 'react';
import { onboardingService } from '@/services/onboardingService';
import { OnboardingStatus, CompleteStepRequest } from '@/types/onboarding';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface UseOnboardingReturn {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  shouldShowOnboarding: boolean;
  completeStep: (stepId: string, stepNumber: number, timeSpent: number) => Promise<void>;
  completeOnboarding: (stepsCompleted: string[], timeSpent: number) => Promise<void>;
  skipOnboarding: (reason?: 'user_choice' | 'timeout' | 'error') => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Charger l'état de l'onboarding
   */
  const loadStatus = useCallback(async () => {
    // Ne pas charger si l'utilisateur n'est pas authentifié
    if (!isAuthenticated || authLoading) {
      setIsLoading(false);
      setStatus(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const onboardingStatus = await onboardingService.getOnboardingStatus();
      setStatus(onboardingStatus);
    } catch (err: any) {
      // Si l'erreur est 401 (non authentifié), ne pas afficher d'erreur
      if (err?.message?.includes('401') || err?.message?.includes('Non authentifié')) {
        setStatus(null);
        setIsLoading(false);
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'onboarding';
      setError(errorMessage);
      // Ne pas afficher d'erreur toast pour éviter de perturber l'utilisateur
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  /**
   * Compléter une étape
   */
  const completeStep = useCallback(
    async (stepId: string, stepNumber: number, timeSpent: number) => {
      try {
        const request: CompleteStepRequest = {
          step_id: stepId,
          step_number: stepNumber,
          time_spent_seconds: timeSpent,
        };

        const response = await onboardingService.completeStep(request);
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                current_step: response.current_step,
                steps_completed: response.steps_completed,
              }
            : null
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'enregistrement de l'étape";
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  /**
   * Compléter tout l'onboarding
   */
  const completeOnboarding = useCallback(
    async (stepsCompleted: string[], timeSpent: number) => {
      try {
        const response = await onboardingService.completeOnboarding({
          skipped: false,
          time_spent_seconds: timeSpent,
          steps_completed: stepsCompleted,
        });

        setStatus((prev) =>
          prev
            ? {
                ...prev,
                completed: response.onboarding_completed,
                steps_completed: stepsCompleted,
              }
            : null
        );

        toast({
          title: 'Onboarding terminé',
          description: 'Vous êtes maintenant prêt à utiliser Viraill !',
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la finalisation de l'onboarding";
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  /**
   * Ignorer l'onboarding
   */
  const skipOnboarding = useCallback(
    async (reason: 'user_choice' | 'timeout' | 'error' = 'user_choice') => {
      try {
        const response = await onboardingService.skipOnboarding({ reason });
        
        // Marquer immédiatement comme complété pour fermer l'onboarding
        // Ne PAS recharger le statut immédiatement car le backend peut ne pas avoir
        // encore mis à jour completed: true dans le statut (il a juste mis onboarding_skipped: true)
        // Le OnboardingProvider s'occupera de mettre à jour user.onboarding_skipped via handleClose
        setStatus({
          completed: true, // Forcer completed à true pour fermer l'onboarding
          current_step: 0,
          steps_completed: [],
          can_skip: false,
          onboarding_version: '1.0',
        });
        
        // Ne PAS appeler loadStatus() immédiatement car il va écraser notre statut
        // Le OnboardingProvider mettra à jour user.onboarding_skipped via handleClose
        // Le statut sera rechargé au prochain montage ou refresh de page
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'ignorance de l'onboarding";
        // Même en cas d'erreur, marquer comme complété pour fermer
        setStatus({
          completed: true,
          current_step: 0,
          steps_completed: [],
          can_skip: false,
          onboarding_version: '1.0',
        });
      }
    },
    [toast]
  );

  /**
   * Recharger l'état
   */
  const refreshStatus = useCallback(async () => {
    await loadStatus();
  }, [loadStatus]);

  // Charger l'état au montage et quand l'authentification change
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadStatus();
    } else {
      setStatus(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, loadStatus]);

  // Déterminer si l'onboarding doit être affiché
  const shouldShowOnboarding =
    !isLoading &&
    status !== null &&
    !status.completed &&
    status.current_step > 0;

  return {
    status,
    isLoading,
    error,
    shouldShowOnboarding,
    completeStep,
    completeOnboarding,
    skipOnboarding,
    refreshStatus,
  };
}

