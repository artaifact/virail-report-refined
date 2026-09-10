import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiService, Subscription, UsageLimitsResponse } from '@/services/apiService';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  popular?: boolean;
}

export function usePayment() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageLimitsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthContext();
  const [isLoadingPaymentData, setIsLoadingPaymentData] = useState(false);

  const loadPaymentData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      if (isLoadingPaymentData) {
        return; // éviter les appels concurrents
      }
      setIsLoadingPaymentData(true);
      setLoading(true);
      setError(null);

      // Charger les plans
      const plansData = await apiService.getPlans();
      setPlans(plansData.plans || []);

      // Charger l'abonnement actuel
      try {
        const subscriptionData = await apiService.getCurrentSubscription();
        setSubscription(subscriptionData.subscription || null);
      } catch (err) {
        setSubscription(null);
      }

      // Charger l'utilisation
      try {
        const usageData = await apiService.getUsageLimits();
        setUsage(usageData);
      } catch (err) {
        setUsage(null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setIsLoadingPaymentData(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, [isAuthenticated]);

  const createCheckoutSession = async (planId: string) => {
    try {
      setLoading(true);
      const successUrl = `${window.location.origin}/payment-success`;
      const cancelUrl = `${window.location.origin}/`;
      const session = await apiService.createCheckoutSession(planId, successUrl, cancelUrl);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la session de paiement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription?.id) {
      throw new Error('Aucun abonnement à annuler');
    }
    try {
      setLoading(true);
      await apiService.cancelSubscription(subscription.id);
      // Recharger les données
      const subscriptionData = await apiService.getCurrentSubscription();
      if (subscriptionData) {
        setSubscription(subscriptionData.subscription || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation de l\'abonnement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculer le plan actuel basé sur l'abonnement
  const currentPlan = subscription?.plan || null;

  // Helper pour vérifier si une fonctionnalité peut être utilisée
  const canUseFeature = (featureType: 'analysis' | 'report' | 'competitor_analysis' | 'optimize'): boolean => {
    if (!usage) return false;
    const featureKey = `can_use_${featureType}` as keyof UsageLimitsResponse;
    const feature = usage[featureKey];
    return feature?.allowed === true;
  };

  // Helper pour obtenir les limites d'une fonctionnalité
  const getFeatureLimits = (featureType: 'analysis' | 'report' | 'competitor_analysis' | 'optimize') => {
    if (!usage) return null;
    const featureKey = `can_use_${featureType}` as keyof UsageLimitsResponse;
    return usage[featureKey] || null;
  };

  return {
    plans,
    subscription,
    usage,
    usageLimits: usage, // Alias pour compatibilité
    currentPlan,
    loading,
    error,
    createCheckoutSession,
    cancelSubscription,
    loadPaymentData,
    canUseFeature,
    getFeatureLimits,
  };
}