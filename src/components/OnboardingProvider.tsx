import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Onboarding } from '@/components/Onboarding';
import { OnboardingTour } from '@/components/OnboardingTour';
import { onboardingService } from '@/services/onboardingService';
import { apiService } from '@/services/apiService';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

/**
 * Provider qui gère l'affichage de l'onboarding
 * Affiche l'onboarding si l'utilisateur est authentifié et n'a pas complété l'onboarding
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { isAuthenticated, user, isLoading: authLoading, updateUser } = useAuthContext();
  const { status, isLoading: onboardingLoading, shouldShowOnboarding, refreshStatus, completeOnboarding, skipOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [useTourMode, setUseTourMode] = useState(false); // Mode tour guidé avec Driver.js

  // Vérifier si l'onboarding doit être affiché
  useEffect(() => {
    if (authLoading || onboardingLoading) {
      setShowOnboarding(false);
      return;
    }

    if (!isAuthenticated) {
      setShowOnboarding(false);
      return;
    }

    // PRIORITÉ 1: Si l'utilisateur a skip l'onboarding, NE JAMAIS l'afficher
    if (user?.onboarding_skipped) {
      //console.log('OnboardingProvider: User has skipped onboarding, not showing');
      setShowOnboarding(false);
      return;
    }

    // PRIORITÉ 2: Si l'utilisateur a complété l'onboarding, NE PAS l'afficher
    if (user?.onboarding_completed) {
      //console.log('OnboardingProvider: User has completed onboarding, not showing');
      setShowOnboarding(false);
      return;
    }

    // PRIORITÉ 3: Vérifier le statut depuis l'API
    if (status !== null) {
      // Ne PAS afficher si :
      // - Le statut est marqué comme complété (completed: true)
      // - Le current_step est 0 (pas d'onboarding en cours)
      // - L'utilisateur a skip l'onboarding (double vérification au cas où user n'est pas encore à jour)
      const shouldShow = 
        status.completed === false && 
        status.current_step > 0 &&
        !user?.onboarding_skipped; // Vérifier aussi ici au cas où user n'est pas encore mis à jour
      setShowOnboarding(shouldShow);
      return;
    }

    // PRIORITÉ 4: Si pas de statut mais utilisateur avec données d'onboarding
    if (user) {
      const shouldShow =
        !user.onboarding_completed &&
        !user.onboarding_skipped &&
        (user.onboarding_data === null || user.onboarding_data.current_step > 0);
      //console.log('OnboardingProvider: shouldShow from user data:', shouldShow, { user });
      setShowOnboarding(shouldShow);
      return;
    }

    // Par défaut, ne pas afficher
    setShowOnboarding(false);
  }, [isAuthenticated, user, authLoading, onboardingLoading, status]);

  /**
   * Gérer la fermeture de l'onboarding
   */
  const handleClose = async () => {
    //console.log('OnboardingProvider: handleClose called');
    // Fermer immédiatement - ne pas attendre
    setShowOnboarding(false);
    setUseTourMode(false);
    
    // Recharger les données utilisateur pour avoir onboarding_skipped à jour
    // C'est important car le Provider vérifie user.onboarding_skipped
    try {
      const userData = await apiService.getMeBearer();
      if (userData) {
        //console.log('OnboardingProvider: User data refreshed after close:', userData);
        // Mettre à jour l'utilisateur dans le contexte
        // Cela déclenchera le useEffect qui vérifie user.onboarding_skipped
        updateUser(userData as any);
      }
    } catch (error) {
      //console.warn('OnboardingProvider: Error refreshing user data:', error);
      // Même en cas d'erreur, on ne recharge pas le statut pour éviter
      // que l'onboarding se réaffiche
    }
    
    // NE PAS recharger le statut immédiatement car :
    // 1. Le backend peut ne pas avoir encore mis à jour completed: true
    // 2. Cela écraserait notre statut local qui a completed: true
    // Le statut sera rechargé au prochain chargement de page ou refresh
  };

  /**
   * Gérer la complétion du tour guidé
   */
  const handleTourComplete = async () => {
    //console.log('OnboardingProvider: Tour completed');
    setUseTourMode(false);
    setShowOnboarding(false);
    
    // Marquer l'onboarding comme complété
    try {
      const allStepsCompleted = ['welcome', 'dashboard', 'navigation', 'analysis-geo', 'analysis-competitor', 'limits'];
      await completeOnboarding(allStepsCompleted, 0);
      
      const userData = await apiService.getMeBearer();
      if (userData) {
        updateUser(userData as any);
      }
    } catch (error) {
      //console.warn('OnboardingProvider: Error completing tour:', error);
    }
  };

  /**
   * Gérer le skip du tour guidé
   */
  const handleTourSkip = async () => {
    //console.log('OnboardingProvider: Tour skipped');
    setUseTourMode(false);
    setShowOnboarding(false);
    
    // Marquer l'onboarding comme skip
    try {
      await skipOnboarding('user_choice');
      
      const userData = await apiService.getMeBearer();
      if (userData) {
        updateUser(userData as any);
      }
    } catch (error) {
      //console.warn('OnboardingProvider: Error skipping tour:', error);
    }
  };

  // Toujours utiliser le mode tour guidé avec Driver.js au début
  // Le modal sera utilisé uniquement pour les étapes nécessitant une saisie (URL, etc.)
  useEffect(() => {
    if (showOnboarding) {
      // Toujours utiliser le tour guidé pour la première présentation du site
      // Le modal sera utilisé uniquement si l'utilisateur a déjà complété le tour
      // et qu'il doit saisir des informations (URL pour les analyses)
      if (status && status.steps_completed.length === 0) {
        // Première visite : utiliser le tour guidé
        setUseTourMode(true);
      } else if (status && status.current_step >= 4 && status.steps_completed.includes('navigation')) {
        // Après le tour, utiliser le modal pour les étapes avec saisie
        setUseTourMode(false);
      } else {
        // Par défaut, utiliser le tour guidé
        setUseTourMode(true);
      }
    }
  }, [showOnboarding, status]);

  return (
    <>
      {children}
      {showOnboarding && useTourMode && (
        <OnboardingTour 
          enabled={true} 
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
      {showOnboarding && !useTourMode && (
        <Onboarding open={showOnboarding} onClose={handleClose} />
      )}
    </>
  );
}

