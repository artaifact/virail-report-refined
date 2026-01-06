import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthService } from '@/services/authService';
import { onboardingService } from '@/services/onboardingService';
import { OnboardingStatus } from '@/types/onboarding';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Vérifier le statut d'onboarding (uniquement pour les routes non-onboarding)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Ne pas vérifier pour les routes d'onboarding
      if (location.pathname.startsWith('/onboarding')) {
        setIsCheckingOnboarding(false);
        return;
      }

      if (!isAuthenticated || isLoading) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        const status = await onboardingService.getOnboardingStatus();
        setOnboardingStatus(status);
      } catch (error) {
        // En cas d'erreur, on considère que l'onboarding n'est pas complété
        console.error('Erreur lors de la vérification du statut d\'onboarding:', error);
        setOnboardingStatus(null);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, isLoading, location.pathname]);

  if (isLoading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de connexion avec l'URL de redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si on est sur une route d'onboarding, laisser passer
  if (location.pathname.startsWith('/onboarding')) {
    return <>{children}</>;
  }

  // Si l'onboarding n'est pas complété et qu'on n'est pas déjà sur une route d'onboarding
  // Rediriger vers l'onboarding
  if (
    onboardingStatus &&
    !onboardingStatus.completed &&
    onboardingStatus.current_step > 0 &&
    !user?.onboarding_skipped
  ) {
    const stepRoutes: Record<number, string> = {
      1: '/onboarding/setup',
      2: '/onboarding/project',
      3: '/onboarding/topics',
      4: '/onboarding/prompts',
      5: '/onboarding/results',
      6: '/onboarding/plan',
    };
    const targetRoute = stepRoutes[onboardingStatus.current_step] || '/onboarding/setup';
    return <Navigate to={targetRoute} replace />;
  }

  return <>{children}</>;
} 

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Détection admin robuste: localStorage (AuthService) puis contexte
  const localUser = (AuthService.getUser && AuthService.getUser()) as any;
  const isAdmin = (localUser?.is_admin || localUser?.isAdmin) ?? ((user as any)?.is_admin || (user as any)?.isAdmin);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}