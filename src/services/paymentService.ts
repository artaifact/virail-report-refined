import { Plan, PLANS, Subscription, Payment, UserPlan, PaymentMethod } from '@/types/payment';

// Clés de stockage local
const USER_PLAN_KEY = 'user_plan';
const PAYMENTS_HISTORY_KEY = 'payments_history';

/**
 * Service de paiement simulé
 * En production, ceci serait connecté à Stripe, PayPal, etc.
 */
export class PaymentService {
  
  /**
   * Obtenir tous les plans disponibles
   */
  static getPlans(): Plan[] {
    return PLANS;
  }

  /**
   * Obtenir un plan par ID
   */
  static getPlanById(planId: string): Plan | null {
    return PLANS.find(plan => plan.id === planId) || null;
  }

  /**
   * Obtenir le plan actuel de l'utilisateur
   */
  static getCurrentUserPlan(): UserPlan | null {
    try {
      const stored = localStorage.getItem(USER_PLAN_KEY);
      if (!stored) return null;
      
      const userPlan = JSON.parse(stored);
      // Vérifier si l'abonnement est encore valide
      const endDate = new Date(userPlan.subscription.endDate);
      const now = new Date();
      
      if (endDate < now && userPlan.subscription.status === 'active') {
        // Marquer comme expiré
        userPlan.subscription.status = 'inactive';
        localStorage.setItem(USER_PLAN_KEY, JSON.stringify(userPlan));
      }
      
      return userPlan;
    } catch {
      return null;
    }
  }

  /**
   * Simuler un paiement (faux système)
   */
  static async processPayment(
    planId: string,
    paymentMethod: Omit<PaymentMethod, 'id'>
  ): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    
    // Simuler le délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const plan = this.getPlanById(planId);
    if (!plan) {
      return { success: false, error: 'Plan non trouvé' };
    }

    // Simuler un échec de paiement parfois (10% de chance)
    if (Math.random() < 0.1) {
      return { success: false, error: 'Échec du paiement - Carte refusée' };
    }

    // Créer l'abonnement
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.interval === 'year' ? 12 : 1));

    const subscription: Subscription = {
      id: `sub_${Date.now()}`,
      planId: plan.id,
      userId: 'user_123', // En production, récupérer depuis le contexte d'auth
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      paymentMethod: {
        id: `pm_${Date.now()}`,
        ...paymentMethod
      }
    };

    // Créer l'enregistrement de paiement
    const payment: Payment = {
      id: `pay_${Date.now()}`,
      subscriptionId: subscription.id,
      amount: plan.price,
      currency: plan.currency,
      status: 'completed',
      paymentDate: now.toISOString(),
      paymentMethod: subscription.paymentMethod
    };

    // Créer le plan utilisateur
    const userPlan: UserPlan = {
      currentPlan: plan,
      subscription,
      usage: {
        analysesUsed: 0,
        reportsUsed: 0,
        periodStart: now.toISOString(),
        periodEnd: endDate.toISOString()
      }
    };

    // Sauvegarder
    localStorage.setItem(USER_PLAN_KEY, JSON.stringify(userPlan));
    this.addPaymentToHistory(payment);

    return { success: true, subscription };
  }

  /**
   * Changer de plan
   */
  static async changePlan(newPlanId: string): Promise<{ success: boolean; error?: string }> {
    const currentUserPlan = this.getCurrentUserPlan();
    if (!currentUserPlan) {
      return { success: false, error: 'Aucun abonnement actif trouvé' };
    }

    const newPlan = this.getPlanById(newPlanId);
    if (!newPlan) {
      return { success: false, error: 'Nouveau plan non trouvé' };
    }

    // Simuler le délai
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calculer le prorata (simulé)
    const proratedAmount = this.calculateProration(currentUserPlan.currentPlan, newPlan);

    // Mettre à jour le plan
    currentUserPlan.currentPlan = newPlan;
    currentUserPlan.subscription.planId = newPlan.id;

    // Si c'est un upgrade qui coûte plus cher, créer un paiement
    if (proratedAmount > 0) {
      const payment: Payment = {
        id: `pay_${Date.now()}`,
        subscriptionId: currentUserPlan.subscription.id,
        amount: proratedAmount,
        currency: newPlan.currency,
        status: 'completed',
        paymentDate: new Date().toISOString(),
        paymentMethod: currentUserPlan.subscription.paymentMethod
      };
      this.addPaymentToHistory(payment);
    }

    localStorage.setItem(USER_PLAN_KEY, JSON.stringify(currentUserPlan));
    return { success: true };
  }

  /**
   * Annuler l'abonnement
   */
  static async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    const currentUserPlan = this.getCurrentUserPlan();
    if (!currentUserPlan) {
      return { success: false, error: 'Aucun abonnement actif trouvé' };
    }

    // Simuler le délai
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Marquer comme annulé mais garder actif jusqu'à la fin de la période
    currentUserPlan.subscription.status = 'cancelled';
    currentUserPlan.subscription.autoRenew = false;

    localStorage.setItem(USER_PLAN_KEY, JSON.stringify(currentUserPlan));
    return { success: true };
  }

  /**
   * Réactiver l'abonnement
   */
  static async reactivateSubscription(): Promise<{ success: boolean; error?: string }> {
    const currentUserPlan = this.getCurrentUserPlan();
    if (!currentUserPlan) {
      return { success: false, error: 'Aucun abonnement trouvé' };
    }

    // Simuler le délai
    await new Promise(resolve => setTimeout(resolve, 1000));

    currentUserPlan.subscription.status = 'active';
    currentUserPlan.subscription.autoRenew = true;

    localStorage.setItem(USER_PLAN_KEY, JSON.stringify(currentUserPlan));
    return { success: true };
  }

  /**
   * Obtenir l'historique des paiements
   */
  static getPaymentsHistory(): Payment[] {
    try {
      const stored = localStorage.getItem(PAYMENTS_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Vérifier si l'utilisateur peut utiliser une fonctionnalité
   */
  static canUseFeature(feature: 'analysis' | 'report'): { allowed: boolean; reason?: string } {
    const userPlan = this.getCurrentUserPlan();
    
    if (!userPlan || userPlan.subscription.status !== 'active') {
      return { allowed: false, reason: 'Aucun abonnement actif' };
    }

    const { currentPlan, usage } = userPlan;

    if (feature === 'analysis') {
      if (currentPlan.maxAnalyses === -1) return { allowed: true }; // Illimité
      if (usage.analysesUsed >= currentPlan.maxAnalyses) {
        return { allowed: false, reason: 'Limite d\'analyses atteinte pour ce mois' };
      }
    }

    if (feature === 'report') {
      if (currentPlan.maxReports === -1) return { allowed: true }; // Illimité
      if (usage.reportsUsed >= currentPlan.maxReports) {
        return { allowed: false, reason: 'Limite de rapports atteinte pour ce mois' };
      }
    }

    return { allowed: true };
  }

  /**
   * Incrémenter l'usage d'une fonctionnalité
   */
  static incrementUsage(feature: 'analysis' | 'report'): void {
    const userPlan = this.getCurrentUserPlan();
    if (!userPlan) return;

    if (feature === 'analysis') {
      userPlan.usage.analysesUsed++;
    } else if (feature === 'report') {
      userPlan.usage.reportsUsed++;
    }

    localStorage.setItem(USER_PLAN_KEY, JSON.stringify(userPlan));
  }

  /**
   * Réinitialiser l'usage mensuel (à appeler au début de chaque mois)
   */
  static resetMonthlyUsage(): void {
    const userPlan = this.getCurrentUserPlan();
    if (!userPlan) return;

    const now = new Date();
    const nextPeriodEnd = new Date();
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    userPlan.usage = {
      analysesUsed: 0,
      reportsUsed: 0,
      periodStart: now.toISOString(),
      periodEnd: nextPeriodEnd.toISOString()
    };

    localStorage.setItem(USER_PLAN_KEY, JSON.stringify(userPlan));
  }

  // Méthodes privées

  private static addPaymentToHistory(payment: Payment): void {
    const history = this.getPaymentsHistory();
    history.unshift(payment); // Ajouter au début
    // Garder seulement les 50 derniers paiements
    if (history.length > 50) {
      history.splice(50);
    }
    localStorage.setItem(PAYMENTS_HISTORY_KEY, JSON.stringify(history));
  }

  private static calculateProration(currentPlan: Plan, newPlan: Plan): number {
    // Calcul simplifié du prorata
    const priceDiff = newPlan.price - currentPlan.price;
    // En production, ceci serait plus complexe (jours restants, etc.)
    return Math.max(0, priceDiff * 0.8); // 80% du différentiel
  }
}

// Plan gratuit par défaut
export const FREE_PLAN: Plan = {
  id: 'free',
  name: 'Gratuit',
  price: 0,
  currency: 'EUR',
  interval: 'month',
  features: [
    '3 analyses LLMO par mois',
    '1 rapport concurrentiel',
    'Support communauté',
    'Historique 7 jours'
  ],
  maxAnalyses: 3,
  maxReports: 1,
  priority: 'low',
  color: 'gray'
};
