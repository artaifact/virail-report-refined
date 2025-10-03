/**
 * Service API complet pour Virail Studio
 * Gestion des paiements, quotas et fonctionnalités protégées
 */

// Configuration
// En développement, utiliser les chemins relatifs pour profiter du proxy Vite (port 8081)
const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio');
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  max_analyses: number;
  max_reports: number;
  max_competitor_analyses: number;
  max_optimizations: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
  plan: Plan;
}

export interface UsageLimits {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  reason?: string;
}

export interface UsageLimitsResponse {
  can_use_analysis: UsageLimits;
  can_use_report: UsageLimits;
  can_use_competitor_analysis: UsageLimits;
  can_use_optimize: UsageLimits;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'bank_transfer';
  card_number?: string;
  exp_month?: string;
  exp_year?: string;
  cvc?: string;
  name?: string;
}

export interface SubscriptionCreateRequest {
  plan_id: string;
  auto_renew: boolean;
  payment_method: PaymentMethod;
}

export interface AnalysisRequest {
  url: string;
  output_name?: string;
}

export interface CompetitorAnalysisRequest {
  url: string;
  min_score?: number;
  min_mentions?: number;
}

export interface OptimizationRequest {
  url: string;
}

export interface UsageIncrementRequest {
  feature_type: 'analysis' | 'report' | 'competitor_analysis' | 'optimize';
}

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  /**
   * Méthode générique pour faire des requêtes API avec gestion d'erreurs
   */
  private async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    console.log(`🌐 apiService.request: ${options.method || 'GET'} ${this.baseURL}${endpoint}`);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        credentials: 'include', // Important pour les cookies JWT
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 apiService.request réponse: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ apiService.request erreur ${response.status}:`, errorText);

        const errorData = await response.json().catch(() => ({
          detail: { message: `Erreur HTTP: ${response.status}` }
        }));

        throw new Error(
          errorData.detail?.message ||
          errorData.detail ||
          `Erreur API: ${response.status}`
        );
      }

      const data = await response.json();
      console.log(`✅ apiService.request succès:`, data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Délai d\'attente dépassé');
        }
        throw error;
      }
      
      throw new Error('Erreur réseau inattendue');
    }
  }

  // ===== AUTHENTIFICATION =====

  /**
   * Créer un compte utilisateur
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Se connecter
   */
  async login(credentials: {
    username: string;
    password: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Récupérer le profil utilisateur via Bearer (incluant is_admin)
   */
  async getMeBearer(): Promise<{
    email: string;
    username: string;
    id: number;
    is_active: boolean;
    is_verified: boolean;
    is_admin: boolean;
    created_at: string;
  }> {
    // Utilise un chemin relatif pour rester en même origine et inclure les cookies httpOnly
    return this.request('/auth/me-bearer', { method: 'GET' });
  }

  /**
   * Se déconnecter
   */
  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // ===== PLANS ET ABONNEMENTS =====

  /**
   * Récupérer tous les plans disponibles
   */
  async getPlans(): Promise<{ plans: Plan[] }> {
    return this.request('/api/v1/plans/');
  }

  /**
   * Récupérer l'abonnement actuel de l'utilisateur
   */
  async getCurrentSubscription(): Promise<{
    subscription: Subscription | null;
    usage: {
      analyses_used: number;
      reports_used: number;
      competitor_analyses_used: number;
      optimizations_used: number;
      period_start: string;
      period_end: string;
    } | null;
  }> {
    return this.request('/api/v1/subscriptions/current');
  }

  /**
   * Créer un nouvel abonnement avec Stripe
   */
  async createSubscription(
    subscriptionData: SubscriptionCreateRequest
  ): Promise<{ subscription: Subscription; payment_intent?: any }> {
    return this.request('/api/v1/subscriptions/', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  /**
   * Activer un abonnement (pour tests)
   */
  async activateSubscription(subscriptionId: string): Promise<{ subscription: Subscription }> {
    return this.request(`/api/v1/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
    });
  }

  /**
   * Créer une Checkout Session Stripe
   */
  async createCheckoutSession(planId: string, successUrl: string, cancelUrl: string): Promise<{ 
    subscription: { 
      subscription: any; 
      checkout_url: string; 
      is_free: boolean; 
    }; 
    status: string; 
  }> {
    return this.request('/api/v1/subscriptions/', {
      method: 'POST',
      body: JSON.stringify({ 
        plan_id: planId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        auto_renew: true,
        payment_method: {
          type: "card",
          card_number: "4242424242424242",
          exp_month: "12",
          exp_year: "2030",
          cvc: "123",
          name: "Test User"
        }
      }),
    });
  }

  /**
   * Récupérer une Checkout Session
   */
  async getCheckoutSession(sessionId: string): Promise<{ session: any }> {
    return this.request(`/api/v1/subscriptions/checkout-session/${sessionId}`, {
      method: 'GET',
    });
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(
    subscriptionId: string, 
    cancelAtPeriodEnd: boolean = true
  ): Promise<{ subscription: Subscription }> {
    return this.request(`/api/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancel_at_period_end: cancelAtPeriodEnd }),
    });
  }

  // ===== QUOTAS ET USAGE =====

  /**
   * Récupérer les quotas d'usage actuels
   */
  async getUsageLimits(): Promise<UsageLimitsResponse> {
    console.log('🔄 apiService.getUsageLimits() appelé...');
    try {
      const result = await this.request('/api/v1/usage/limits');
      console.log('✅ apiService.getUsageLimits() succès:', result);
      return result;
    } catch (error) {
      console.error('❌ apiService.getUsageLimits() erreur:', error);
      throw error;
    }
  }

  /**
   * Incrémenter l'usage d'une fonctionnalité
   */
  async incrementUsage(featureType: UsageIncrementRequest['feature_type']): Promise<{
    new_usage: {
      analyses_used: number;
      reports_used: number;
      competitor_analyses_used: number;
      optimizations_used: number;
    };
  }> {
    return this.request('/api/v1/usage/increment', {
      method: 'POST',
      body: JSON.stringify({ feature_type: featureType }),
    });
  }

  /**
   * Récupérer l'historique d'usage
   */
  async getUsageHistory(months: number = 6): Promise<{
    history: Array<{
      month: string;
      analyses_used: number;
      reports_used: number;
      competitor_analyses_used: number;
      optimizations_used: number;
    }>;
  }> {
    return this.request(`/api/v1/usage/history?months=${months}`);
  }

  // ===== FONCTIONNALITÉS PROTÉGÉES =====

  /**
   * Analyser un site web
   */
  async analyzeWebsite(url: string, outputName?: string): Promise<{
    id: string;
    status: string;
    url: string;
    created_at: string;
  }> {
    try {
      return await this.request('/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url,
          output_name: outputName || `analysis_${Date.now()}`
        }),
      });
    } catch (error) {
      // Gestion spécifique des erreurs Playwright
      if (error instanceof Error) {
        if (error.message.includes('Page crashed') || error.message.includes('crashed')) {
          throw new Error(`Le site ${url} est incompatible avec notre analyseur. Essayez un autre site ou contactez le support.`);
        }
        if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
          throw new Error(`Le site ${url} met trop de temps à répondre. Essayez plus tard.`);
        }
        if (error.message.includes('net::ERR_BLOCKED_BY_CLIENT') || error.message.includes('blocked')) {
          throw new Error(`Le site ${url} bloque notre analyseur. Le site utilise probablement des protections anti-bot.`);
        }
        if (error.message.includes('net::ERR_NAME_NOT_RESOLVED') || error.message.includes('ENOTFOUND')) {
          throw new Error(`Le site ${url} n'est pas accessible ou n'existe pas.`);
        }
        if (error.message.includes('422') || error.message.includes('Unprocessable Entity')) {
          throw new Error(`Impossible d'analyser ${url}. Le contenu du site pose problème.`);
        }
      }
      throw error;
    }
  }

  /**
   * Analyser les concurrents
   */
  async analyzeCompetitors(
    url: string,
    options: { min_score?: number; min_mentions?: number } = {}
  ): Promise<{
    id: string;
    status: string;
    url: string;
    competitors: Array<{
      url: string;
      domain: string;
      score: number;
      mentions: number;
    }>;
    created_at: string;
  }> {
    try {
      return await this.request('/api/v3/competitors/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url,
          min_score: options.min_score || 0.3,
          min_mentions: options.min_mentions || 1,
        }),
      });
    } catch (error) {
      // Gestion spécifique des erreurs Playwright
      if (error instanceof Error) {
        if (error.message.includes('Page crashed') || error.message.includes('crashed')) {
          throw new Error(`Le site ${url} est incompatible avec notre analyseur. Essayez un autre site ou contactez le support.`);
        }
        if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
          throw new Error(`Le site ${url} met trop de temps à répondre. Essayez plus tard.`);
        }
        if (error.message.includes('net::ERR_BLOCKED_BY_CLIENT') || error.message.includes('blocked')) {
          throw new Error(`Le site ${url} bloque notre analyseur. Le site utilise probablement des protections anti-bot.`);
        }
        if (error.message.includes('net::ERR_NAME_NOT_RESOLVED') || error.message.includes('ENOTFOUND')) {
          throw new Error(`Le site ${url} n'est pas accessible ou n'existe pas.`);
        }
        if (error.message.includes('422') || error.message.includes('Unprocessable Entity')) {
          throw new Error(`Impossible d'analyser ${url}. Le contenu du site pose problème.`);
        }
      }
      throw error;
    }
  }

  /**
   * Optimiser un site web
   */
  async optimizeWebsite(url: string): Promise<{
    id: string;
    status: string;
    url: string;
    optimizations: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact_score: number;
    }>;
    created_at: string;
  }> {
    try {
      return await this.request('/optimize', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    } catch (error) {
      // Gestion spécifique des erreurs Playwright
      if (error instanceof Error) {
        if (error.message.includes('Page crashed') || error.message.includes('crashed')) {
          throw new Error(`Le site ${url} est incompatible avec notre analyseur. Essayez un autre site ou contactez le support.`);
        }
        if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
          throw new Error(`Le site ${url} met trop de temps à répondre. Essayez plus tard.`);
        }
        if (error.message.includes('net::ERR_BLOCKED_BY_CLIENT') || error.message.includes('blocked')) {
          throw new Error(`Le site ${url} bloque notre analyseur. Le site utilise probablement des protections anti-bot.`);
        }
        if (error.message.includes('net::ERR_NAME_NOT_RESOLVED') || error.message.includes('ENOTFOUND')) {
          throw new Error(`Le site ${url} n'est pas accessible ou n'existe pas.`);
        }
        if (error.message.includes('422') || error.message.includes('Unprocessable Entity')) {
          throw new Error(`Impossible d'analyser ${url}. Le contenu du site pose problème.`);
        }
      }
      throw error;
    }
  }

  // ===== RAPPORTS ET ANALYSES =====

  /**
   * Récupérer la liste des rapports
   */
  async listReports(): Promise<Array<{
    id: string;
    url: string;
    status: string;
    created_at: string;
    duration: number;
    metadata: any;
  }>> {
    return this.request('/api/v1/reports/');
  }

  /**
   * Récupérer un rapport spécifique
   */
  async getReport(reportId: string): Promise<{
    id: string;
    url: string;
    status: string;
    data: any;
    metadata: any;
    created_at: string;
    updated_at: string;
  }> {
    return this.request(`/api/v1/reports/${reportId}`);
  }

  /**
   * Vérifier le statut d'une analyse
   */
  async checkAnalysisStatus(analysisId: string): Promise<{
    id: string;
    status: string;
    progress: number;
    estimated_completion?: string;
  }> {
    return this.request(`/api/v1/analyses/${analysisId}/status`);
  }

  // ===== WAITLIST (ADMIN) =====

  /**
   * Lister les entrées de la waitlist (admin)
   */
  async listWaitlist(): Promise<Array<{ id: number; name: string; email: string; status: string; created_at: string; updated_at: string; notes?: string | null; contacted_at?: string | null; converted_at?: string | null }>> {
    // Utilise un chemin relatif pour rester en même origine et inclure les cookies httpOnly
    return this.request('/waitlist', { method: 'GET' });
  }

  /**
   * Récupérer une entrée de waitlist par id (admin)
   */
  async getWaitlistEntry(id: number): Promise<{ id: number; name: string; email: string; status: string; created_at: string; updated_at: string; notes?: string | null; contacted_at?: string | null; converted_at?: string | null }> {
    return this.request(`/waitlist/${id}`, { method: 'GET' });
  }

  /**
   * Récupérer le résumé des stats de la waitlist (admin)
   */
  async getWaitlistSummary(): Promise<{ total_entries: number; status_breakdown: Record<string, number>; recent_entries_7_days: number; last_updated: string }> {
    return this.request('/waitlist/stats/summary', { method: 'GET' });
  }

  // ===== UTILITAIRES =====

  /**
   * Vérifier la santé de l'API
   */
  async healthCheck(): Promise<{
    status: string;
    version: string;
    timestamp: string;
  }> {
    return this.request('/health');
  }

  /**
   * Obtenir les informations de l'utilisateur connecté
   */
  async getCurrentUser(): Promise<{
    id: string;
    username: string;
    email: string;
    created_at: string;
    last_login: string;
  }> {
    return this.request('/api/v1/users/me');
  }
}

// Instance singleton
export const apiService = new ApiService();
