import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthService } from '@/services/authService';
import { onboardingService } from '@/services/onboardingService';
import type { OnboardingStatus } from '@/types/onboarding';

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
      // Ne pas vérifier pour les routes d'onboarding et la page de succès paiement
      if (location.pathname.startsWith('/onboarding') || location.pathname === '/success') {
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

  // Si on est sur une route d'onboarding ou la page de succès paiement, laisser passer
  if (location.pathname.startsWith('/onboarding') || location.pathname === '/success') {
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
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);

  // Vérifier le statut admin côté serveur (pas de confiance au localStorage)
  useEffect(() => {
    const verifyAdmin = async () => {
      if (!isAuthenticated || isLoading) return;
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/auth/me-bearer`);
        if (!response.ok) {
          // Fallback sur /auth/me
          const fallback = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/auth/me`);
          if (fallback.ok) {
            const data = await fallback.json();
            setAdminVerified(Boolean(data.is_admin || data.isAdmin));
          } else {
            setAdminVerified(false);
          }
        } else {
          const data = await response.json();
          setAdminVerified(Boolean(data.is_admin || data.isAdmin));
        }
      } catch {
        setAdminVerified(false);
      }
    };
    verifyAdmin();
  }, [isAuthenticated, isLoading]);

  if (isLoading || adminVerified === null) {
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

  if (!adminVerified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}