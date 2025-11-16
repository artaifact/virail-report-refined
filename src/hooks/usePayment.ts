import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface Usage {
  reports_used: number;
  reports_limit: number;
  reset_date: string;
}

export function usePayment() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
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
     //console.log('🔄 Chargement des plans...');
      const plansData = await apiService.getPlans();
     //console.log('✅ Plans chargés:', plansData);
      setPlans(plansData.plans || []);

      // Charger l'abonnement actuel
      try {
       //console.log('🔄 Chargement de l\'abonnement...');
        const subscriptionData = await apiService.getCurrentSubscription();
       //console.log('✅ Abonnement chargé:', subscriptionData);
        setSubscription(subscriptionData.subscription || null);
      } catch (err) {
       //console.log('❌ Aucun abonnement actif:', err);
        setSubscription(null);
      }

      // Charger l'utilisation
      try {
       //console.log('🔄 Chargement des quotas d\'usage...');
        const usageData = await apiService.getUsageLimits();
       //console.log('✅ Quotas d\'usage chargés:', usageData);
        setUsage(usageData);
      } catch (err) {
       //console.log('❌ Impossible de charger l\'utilisation:', err);
        setUsage(null);
      }

    } catch (err) {
      console.error('Erreur lors du chargement des données de paiement:', err);
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
      const session = await apiService.createCheckoutSession(planId);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la session de paiement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      await apiService.cancelSubscription();
      // Recharger les données
      const subscriptionData = await apiService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation de l\'abonnement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculer le plan actuel basé sur l'abonnement
  const currentPlan = subscription?.plan || null;

  return {
    plans,
    subscription,
    usage,
    currentPlan,
    loading,
    error,
    createCheckoutSession,
    cancelSubscription,
    loadPaymentData,
  };
}