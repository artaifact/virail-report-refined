export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  maxAnalyses: number;
  maxReports: number;
  priority: 'low' | 'medium' | 'high';
  color: string;
  popular?: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  userId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  lastFour?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentDate: string;
  paymentMethod: PaymentMethod;
}

export interface UserPlan {
  currentPlan: Plan;
  subscription: Subscription;
  usage: {
    analysesUsed: number;
    reportsUsed: number;
    periodStart: string;
    periodEnd: string;
  };
}

// Plans prédéfinis
export const PLANS: Plan[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 29,
    currency: 'EUR',
    interval: 'month',
    features: [
      '10 analyses LLMO par mois',
      '5 rapports concurrentiels',
      'Support email',
      'Optimisations de base',
      'Historique 30 jours'
    ],
    maxAnalyses: 10,
    maxReports: 5,
    priority: 'low',
    color: 'blue'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 59,
    currency: 'EUR',
    interval: 'month',
    features: [
      '50 analyses LLMO par mois',
      '20 rapports concurrentiels',
      'Support prioritaire',
      'Optimisations avancées',
      'Historique illimité',
      'Exports PDF/Excel',
      'API access'
    ],
    maxAnalyses: 50,
    maxReports: 20,
    priority: 'medium',
    color: 'purple',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 129,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Analyses LLMO illimitées',
      'Rapports concurrentiels illimités',
      'Support téléphonique 24/7',
      'IA personnalisée',
      'Intégrations avancées',
      'Tableau de bord custom',
      'Formation dédiée',
      'Manager dédié'
    ],
    maxAnalyses: -1, // -1 = illimité
    maxReports: -1,
    priority: 'high',
    color: 'gold'
  }
];
