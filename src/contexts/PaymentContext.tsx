import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Plan, UserPlan, PaymentMethod } from '@/types/payment';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { useAuthContext } from '@/contexts/AuthContext';

interface PaymentContextType {
  // État
  userPlan: UserPlan | null;
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  subscribeToPlan: (planId: string, paymentMethod: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  changePlan: (planId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  reactivateSubscription: () => Promise<boolean>;
  canUseFeature: (feature: 'analysis' | 'report') => { allowed: boolean; reason?: string };
  incrementUsage: (feature: 'analysis' | 'report') => void;
  refreshUserPlan: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | null>(null);

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuthContext();

  // Mapping helpers (backend -> front)
  const mapApiPlanToFrontPlan = useCallback((apiPlan: any): Plan => {
    const priority: Plan['priority'] = apiPlan.id === 'pro' ? 'high' : apiPlan.id === 'premium' ? 'medium' : 'low';
    const color = apiPlan.id === 'pro' ? 'gold' : apiPlan.id === 'premium' ? 'purple' : 'blue';
    return {
      id: apiPlan.id,
      name: apiPlan.name,
      price: apiPlan.price,
      currency: apiPlan.currency,
      interval: apiPlan.interval,
      features: apiPlan.features || [],
      maxAnalyses: typeof apiPlan.max_analyses === 'number' ? apiPlan.max_analyses : 0,
      maxReports: typeof apiPlan.max_reports === 'number' ? apiPlan.max_reports : 0,
      priority,
      color,
      popular: apiPlan.popular || false,
    } as Plan;
  }, []);

  const mapApiSubscriptionToUserPlan = useCallback((data: any, knownPlans: Plan[] = []): UserPlan | null => {
    if (!data || !data.subscription) return null;
    const sub = data.subscription;
    let plan = sub.plan ? mapApiPlanToFrontPlan(sub.plan) : null;
    if (!plan) {
      const planId = sub.plan_id || sub.planId;
      if (planId) {
        const found = knownPlans.find(p => p.id === planId);
        if (found) plan = found;
      }
    }
    if (!plan) {
      // Dernier recours: plan minimal depuis identifiants
      const planId = sub.plan_id || sub.planId || 'free';
      plan = {
        id: planId,
        name: planId === 'free' ? 'Free' : planId,
        price: 0,
        currency: 'EUR',
        interval: 'month',
        features: [],
        maxAnalyses: 0,
        maxReports: 0,
        priority: 'low',
        color: 'blue'
      } as Plan;
    }
    const usage = data.usage || null;
    return {
      currentPlan: plan,
      subscription: {
        id: sub.id,
        planId: sub.plan_id || sub.planId || plan.id,
        userId: sub.user_id || sub.userId || 'unknown',
        status: sub.status,
        startDate: sub.start_date || sub.startDate,
        endDate: sub.end_date || sub.endDate,
        autoRenew: sub.auto_renew ?? true,
        paymentMethod: { id: sub.payment_method?.id || 'pm_backend', type: sub.payment_method?.type || 'card' }
      },
      usage: usage ? {
        analysesUsed: usage.analyses_used ?? 0,
        reportsUsed: usage.reports_used ?? 0,
        periodStart: usage.period_start || new Date().toISOString(),
        periodEnd: usage.period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } : {
        analysesUsed: 0,
        reportsUsed: 0,
        periodStart: new Date().toISOString(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    } as UserPlan;
  }, [mapApiPlanToFrontPlan]);

  // Rafraîchir le plan utilisateur depuis l'API
  // knownPlans peut être passé directement pour éviter la closure périmée lors du chargement initial
  const refreshUserPlan = useCallback(async (knownPlans?: Plan[]) => {
    const activePlans = knownPlans ?? plans;
    try {
      const data = await apiService.getCurrentSubscription();
      // Si data est null, c'est que la session a expiré ou qu'il n'y a pas d'abonnement
      if (!data) {
        // Utiliser un plan gratuit par défaut silencieusement
        const free = activePlans.find(p => p.id === 'free') || {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: 'EUR',
          interval: 'month',
          features: [],
          maxAnalyses: 0,
          maxReports: 0,
          priority: 'low' as const,
          color: 'blue'
        };
        setUserPlan({
          currentPlan: free,
          subscription: {
            id: 'free_sub',
            planId: 'free',
            userId: 'guest',
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            autoRenew: false,
            paymentMethod: { id: 'free_pm', type: 'card' }
          },
          usage: {
            analysesUsed: 0,
            reportsUsed: 0,
            periodStart: new Date().toISOString(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        });
        return;
      }
      
      const mapped = mapApiSubscriptionToUserPlan(data, activePlans);
      if (mapped) {
        setUserPlan(mapped);
      } else {
        // Aucun abonnement côté backend: basculer sur un plan gratuit par défaut
        const free = activePlans.find(p => p.id === 'free') || {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: 'EUR',
          interval: 'month',
          features: [],
          maxAnalyses: 0,
          maxReports: 0,
          priority: 'low' as const,
          color: 'blue'
        };
        setUserPlan({
          currentPlan: free,
          subscription: {
            id: 'free_sub',
            planId: 'free',
            userId: 'guest',
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            autoRenew: false,
            paymentMethod: { id: 'free_pm', type: 'card' }
          },
          usage: {
            analysesUsed: 0,
            reportsUsed: 0,
            periodStart: new Date().toISOString(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        });
      }
    } catch (e: any) {
      // Si l'erreur est 401 (session expirée), ne pas afficher d'erreur
      // C'est normal et l'utilisateur sera redirigé vers la page de login si nécessaire
      if (e?.message?.includes('401') || e?.message?.includes('UNAUTHORIZED')) {
        // Utiliser un plan gratuit par défaut silencieusement
      } else {
      }
      // En cas d'erreur, afficher un plan gratuit par défaut
      const free = activePlans.find(p => p.id === 'free') || {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'EUR',
        interval: 'month',
        features: [],
        maxAnalyses: 0,
        maxReports: 0,
        priority: 'low' as const,
        color: 'blue'
      };
      setUserPlan({
        currentPlan: free,
        subscription: {
          id: 'free_sub',
          planId: 'free',
          userId: 'guest',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenew: false,
          paymentMethod: { id: 'free_pm', type: 'card' }
        },
        usage: {
          analysesUsed: 0,
          reportsUsed: 0,
          periodStart: new Date().toISOString(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      });
    }
  }, [mapApiSubscriptionToUserPlan, plans]);

  // Charger plans et abonnement au démarrage
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Charger les plans depuis l'API
        const resp = await apiService.getPlans();
        const mappedPlans = (resp?.plans || []).map(mapApiPlanToFrontPlan);
        setPlans(mappedPlans);
        
        // Charger l'abonnement utilisateur en passant mappedPlans directement
        // (évite la closure périmée où plans serait encore [])
        await refreshUserPlan(mappedPlans);
      } catch (e) {
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [mapApiPlanToFrontPlan]);

  // Réagir au changement d'authentification pour rafraîchir l'abonnement réel
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      refreshUserPlan().finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, refreshUserPlan]);

  const subscribeToPlan = useCallback(async (
    planId: string, 
    paymentMethod: Omit<PaymentMethod, 'id'>
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiService.createSubscription({
        plan_id: planId,
        auto_renew: true,
        payment_method: paymentMethod as any,
      });
      toast({
        title: "Abonnement activé ! 🎉",
        description: `Vous êtes maintenant abonné au plan ${plans.find(p => p.id === planId)?.name || planId}`,
      });
      await refreshUserPlan();
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur de paiement",
        description: error?.message || "Une erreur est survenue lors du paiement",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshUserPlan, plans]);

  const changePlan = useCallback(async (planId: string): Promise<boolean> => {
    // TODO: Implémenter côté backend un endpoint de changement de plan si nécessaire
    toast({ title: 'Bientôt disponible', description: 'Le changement de plan sera bientôt activé.', });
    return false;
  }, [toast]);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!userPlan?.subscription?.id) return false;
    setIsLoading(true);
    try {
      await apiService.cancelSubscription(userPlan.subscription.id, true);
      toast({
        title: "Abonnement annulé",
        description: "Votre abonnement a été annulé. Il restera actif jusqu'à la fin de la période.",
      });
      await refreshUserPlan();
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'annuler l'abonnement",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshUserPlan, userPlan?.subscription?.id]);

  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    // TODO: Implémenter côté backend
    toast({ title: 'Bientôt disponible', description: "La réactivation sera bientôt activée." });
    return false;
  }, [toast]);

  const canUseFeature = useCallback((feature: 'analysis' | 'report') => {
    // TODO: déplacer cette logique côté backend si nécessaire
    return { allowed: true } as any;
  }, []);

  const incrementUsage = useCallback((feature: 'analysis' | 'report') => {
    // TODO: brancher sur apiService.incrementUsage si nécessaire
    refreshUserPlan();
  }, [refreshUserPlan]);

  const value: PaymentContextType = useMemo(() => ({
    userPlan,
    plans,
    isLoading,
    error,
    subscribeToPlan,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    canUseFeature,
    incrementUsage,
    refreshUserPlan
  }), [userPlan, plans, isLoading, error, subscribeToPlan, changePlan, cancelSubscription, reactivateSubscription, canUseFeature, incrementUsage, refreshUserPlan]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
