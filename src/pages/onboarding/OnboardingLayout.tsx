import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { OnboardingBreadcrumb } from '@/components/onboarding/OnboardingBreadcrumb';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuthContext } from '@/contexts/AuthContext';

const STEP_ROUTES: Record<number, string> = {
  1: '/onboarding/setup',
  2: '/onboarding/project',
  3: '/onboarding/topics',
  4: '/onboarding/prompts',
  5: '/onboarding/results',
  6: '/onboarding/plan',
};

const STEP_IDS: Record<number, string> = {
  1: 'setup',
  2: 'project',
  3: 'topics',
  4: 'prompts',
  5: 'results',
  6: 'plan',
};

export function OnboardingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, isLoading, refreshStatus } = useOnboarding();
  const { user } = useAuthContext();
  const [startTimes, setStartTimes] = useState<Record<number, number>>({});

  // Rediriger vers la bonne étape selon le statut
  useEffect(() => {
    if (isLoading || !status) return;

    // Si l'onboarding est complété, rediriger vers la page d'accueil
    if (status.completed) {
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      return;
    }

    // Déterminer l'étape actuelle depuis l'URL
    const currentPath = location.pathname;

    // Si on est sur /onboarding sans étape spécifique, rediriger vers l'étape courante
    if (currentPath === '/onboarding' || currentPath === '/onboarding/') {
      const targetStep = status.current_step || 1;
      const targetRoute = STEP_ROUTES[targetStep] || STEP_ROUTES[1];
      if (currentPath !== targetRoute) {
        console.log('📍 Redirecting from /onboarding to step', targetStep);
        navigate(targetRoute, { replace: true });
      }
      return;
    }

    // Note: On ne restreint PAS l'accès aux étapes pour éviter les problèmes de timing
    // L'utilisateur peut naviguer librement entre les étapes
    // Le backend validera les étapes lors de la soumission
  }, [status, isLoading, location.pathname, navigate]);

  // Enregistrer le temps de début pour chaque étape
  useEffect(() => {
    const currentPath = location.pathname;
    const stepNumber = Object.entries(STEP_ROUTES).find(
      ([_, path]) => path === currentPath
    )?.[0];

    if (stepNumber) {
      const step = parseInt(stepNumber);
      setStartTimes((prev) => {
        if (!prev[step]) {
          return { ...prev, [step]: Date.now() };
        }
        return prev;
      });
    }
  }, [location.pathname]);

  const handleStepNavigation = (stepNumber: number) => {
    const targetRoute = STEP_ROUTES[stepNumber];
    if (targetRoute && status?.steps_completed.includes(STEP_IDS[stepNumber])) {
      navigate(targetRoute);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600">Chargement de l'onboarding...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur a skip l'onboarding, rediriger vers la page d'accueil
  if (user?.onboarding_skipped) {
    return <Navigate to="/" replace />;
  }

  // Si l'onboarding est complété, ne rien afficher (la redirection est gérée par useEffect)
  if (!status || status.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  // Calculer l'étape actuelle depuis l'URL
  const getCurrentStepFromUrl = () => {
    const currentPath = location.pathname;
    const stepEntry = Object.entries(STEP_ROUTES).find(
      ([_, path]) => path === currentPath
    );
    return stepEntry ? parseInt(stepEntry[0]) : status.current_step;
  };

  const currentStepNumber = getCurrentStepFromUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <OnboardingBreadcrumb
        currentStep={currentStepNumber}
        stepsCompleted={status.steps_completed}
        onNavigate={handleStepNavigation}
      />
      <OnboardingProgress currentStep={currentStepNumber} totalSteps={6} />
      
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl py-8">
          <Outlet context={{ status, refreshStatus, startTimes }} />
        </div>
      </div>
    </div>
  );
}

