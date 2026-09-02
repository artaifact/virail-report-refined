/**
 * Service pour gérer l'onboarding des utilisateurs
 */

import {
  OnboardingStatus,
  CompleteStepRequest,
  CompleteStepResponse,
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  SkipOnboardingRequest,
  SkipOnboardingResponse,
} from '@/types/onboarding';

// Configuration : en dev utiliser le chemin relatif (proxy Vite), sinon VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://api.viraill.com');

class OnboardingService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Méthode générique pour faire des requêtes API
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const method = (options.method || 'GET').toUpperCase();
      const isGetLike = method === 'GET' || method === 'HEAD';

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        credentials: 'include', // Important pour les cookies JWT
        headers: {
          ...(isGetLike ? {} : { 'Content-Type': 'application/json' }),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: { message: `Erreur HTTP: ${response.status}` },
        }));

        throw new Error(
          errorData.detail?.message ||
            errorData.detail ||
            `Erreur API: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur réseau inattendue');
    }
  }

  /**
   * Récupérer l'état de l'onboarding
   */
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/auth/user/onboarding-status', {
      method: 'GET',
    });
  }

  /**
   * Compléter une étape de l'onboarding
   */
  async completeStep(
    stepData: CompleteStepRequest
  ): Promise<CompleteStepResponse> {
    return this.request<CompleteStepResponse>(
      '/auth/user/onboarding/complete-step',
      {
        method: 'POST',
        body: JSON.stringify(stepData),
      }
    );
  }

  /**
   * Compléter tout l'onboarding
   */
  async completeOnboarding(
    data: CompleteOnboardingRequest
  ): Promise<CompleteOnboardingResponse> {
    return this.request<CompleteOnboardingResponse>(
      '/auth/user/onboarding/complete',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Ignorer l'onboarding
   */
  async skipOnboarding(
    data: SkipOnboardingRequest
  ): Promise<SkipOnboardingResponse> {
    return this.request<SkipOnboardingResponse>(
      '/auth/user/onboarding/skip',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Réinitialiser l'onboarding (Admin uniquement)
   */
  async resetOnboarding(userId: number | string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/auth/admin/users/${userId}/reset-onboarding`, {
      method: 'POST',
    });
  }

  /**
   * Récupérer les données de compte d'onboarding
   */
  async getAccountData(): Promise<{
    brand_name?: string;
    brand_url?: string;
    account_type?: string;
    agency_name?: string;
    agency_url?: string;
    location_country?: string;
    location_country_code?: string;
    sector?: string;
  }> {
    return this.request('/auth/user/onboarding/account-data', {
      method: 'GET',
    });
  }

  /**
   * Envoyer les données de compte d'onboarding
   */
  async saveAccountData(data: {
    account_type: 'agency' | 'in_house';
    agency_name?: string;
    agency_url?: string;
    brand_name?: string;
    brand_url?: string;
    location_country: string;
    location_country_code: string;
    onboarding_step: 'setup' | 'project' | 'topics' | 'prompts' | 'results' | 'plan';
  }): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.request('/auth/user/onboarding/account-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const onboardingService = new OnboardingService();

