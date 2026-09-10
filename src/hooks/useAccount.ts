import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/services/authService';

// Configuration API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.viraill.com';
};

const API_BASE_URL = getApiBaseUrl();

// Types
export interface Subscription {
  id: string;
  plan_name: string;
  plan_price: number;
  currency: string;
  interval: 'month' | 'year';
  status: 'active' | 'inactive' | 'cancelled' | 'pending' | 'trialing';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  next_billing_date: string | null;
  trial_end?: string | null;
}

export interface UsageItem {
  feature: string;
  feature_label: string;
  used: number;
  limit: number; // -1 = illimité
  percentage: number;
  period_start: string;
  period_end: string;
  reset_date: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  amount: number;
  period?: {
    start: string;
    end: string;
  };
}

export interface StripeInvoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  currency: string;
  subtotal: number;
  tax: number | null;
  total: number;
  amount_paid: number;
  created: string;
  paid_at: string | null;
  pdf_url: string | null;
  hosted_invoice_url: string | null;
  line_items: InvoiceLineItem[];
  payment_info?: {
    type: string;
    brand: string;
    last4: string;
  } | null;
}

export interface BillingInfo {
  id?: number;
  user_id?: number;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_address: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  billing_state: string | null;
  billing_country: string | null;
  billing_country_code: string | null;
  vat_number: string | null;
  company_registration: string | null;
  tax_exempt: boolean;
  invoice_prefix: string | null;
  invoice_notes: string | null;
  preferred_currency: string;
  preferred_language: string;
}

export interface AccountDashboard {
  subscription: Subscription | null;
  has_subscription: boolean;
  usage: UsageItem[];
  payment_method: PaymentMethod | null;
  billing_info: BillingInfo | null;
  billing_info_complete: boolean;
  total_spent: number;
  member_since: string;
}

export interface StripeInvoicesResponse {
  invoices: StripeInvoice[];
  has_more: boolean;
  total_count?: number;
}

export interface UpcomingInvoice {
  subtotal: number;
  tax: number | null;
  total: number;
  currency: string;
  next_payment_attempt: string | null;
  line_items: InvoiceLineItem[];
}

// Fetch helper avec authentification
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  return AuthService.makeAuthenticatedRequest(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

// ==================== API Functions ====================

// Dashboard principal
async function fetchAccountDashboard(): Promise<AccountDashboard> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/account/dashboard`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement du dashboard');
  }
  return response.json();
}

// Factures Stripe
async function fetchStripeInvoices(limit = 10, startingAfter?: string): Promise<StripeInvoicesResponse> {
  let url = `${API_BASE_URL}/api/v1/account/stripe/invoices?limit=${limit}`;
  if (startingAfter) {
    url += `&starting_after=${startingAfter}`;
  }
  const response = await fetchWithAuth(url);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des factures');
  }
  return response.json();
}

// Détail d'une facture Stripe
async function fetchStripeInvoiceDetail(invoiceId: string): Promise<StripeInvoice> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/account/stripe/invoices/${invoiceId}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement de la facture');
  }
  return response.json();
}

// PDF d'une facture Stripe
async function fetchStripeInvoicePdf(invoiceId: string): Promise<{ pdf_url: string }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/account/stripe/invoices/${invoiceId}/pdf`);
  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement de la facture');
  }
  return response.json();
}

// Prochaine facture (preview)
async function fetchUpcomingInvoice(): Promise<UpcomingInvoice | null> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/account/stripe/upcoming-invoice`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Erreur lors du chargement de la prochaine facture');
  }
  return response.json();
}

// Moyens de paiement Stripe
async function fetchStripePaymentMethods(): Promise<PaymentMethod[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/account/stripe/payment-methods`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des moyens de paiement');
  }
  const data = await response.json();
  return data.payment_methods || data;
}

// Portail Stripe (facturation)
async function openStripeBillingPortal(): Promise<{ portal_url: string }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/account/stripe/billing-portal`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de l\'ouverture du portail de facturation');
  }
  return response.json();
}

// ==================== Hooks ====================

// Dashboard principal
export function useAccountDashboard() {
  return useQuery({
    queryKey: ['account-dashboard'],
    queryFn: fetchAccountDashboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

// Factures Stripe
export function useStripeInvoices(limit = 10, startingAfter?: string) {
  return useQuery({
    queryKey: ['stripe-invoices', limit, startingAfter],
    queryFn: () => fetchStripeInvoices(limit, startingAfter),
    staleTime: 1000 * 60 * 5,
  });
}

// Détail d'une facture
export function useStripeInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: ['stripe-invoice', invoiceId],
    queryFn: () => fetchStripeInvoiceDetail(invoiceId),
    enabled: !!invoiceId,
  });
}

// Validation des URLs de redirection Stripe
function isValidStripeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('stripe.com');
  } catch {
    return false;
  }
}

// Télécharger PDF
export function useStripeInvoicePdf() {
  return useMutation({
    mutationFn: fetchStripeInvoicePdf,
    onSuccess: (data) => {
      if (data.pdf_url && isValidStripeUrl(data.pdf_url)) {
        window.open(data.pdf_url, '_blank');
      }
    },
  });
}

// Prochaine facture
export function useUpcomingInvoice() {
  return useQuery({
    queryKey: ['upcoming-invoice'],
    queryFn: fetchUpcomingInvoice,
    staleTime: 1000 * 60 * 5,
  });
}

// Moyens de paiement Stripe
export function useStripePaymentMethods() {
  return useQuery({
    queryKey: ['stripe-payment-methods'],
    queryFn: fetchStripePaymentMethods,
    staleTime: 1000 * 60 * 5,
  });
}

// Portail Stripe
export function useStripeBillingPortal() {
  return useMutation({
    mutationFn: openStripeBillingPortal,
    onSuccess: (data) => {
      if (data.portal_url && isValidStripeUrl(data.portal_url)) {
        window.location.href = data.portal_url;
      }
    },
  });
}

// ==================== Helpers ====================

// Formater un montant en devise
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

// Formater une date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Liste des pays pour le formulaire
export const COUNTRIES = [
  { code: 'FR', name: 'France', vatRate: 20 },
  { code: 'DE', name: 'Allemagne', vatRate: 19 },
  { code: 'ES', name: 'Espagne', vatRate: 21 },
  { code: 'IT', name: 'Italie', vatRate: 22 },
  { code: 'BE', name: 'Belgique', vatRate: 21 },
  { code: 'NL', name: 'Pays-Bas', vatRate: 21 },
  { code: 'GB', name: 'Royaume-Uni', vatRate: 20 },
  { code: 'CH', name: 'Suisse', vatRate: 7.7 },
  { code: 'LU', name: 'Luxembourg', vatRate: 17 },
  { code: 'AT', name: 'Autriche', vatRate: 20 },
  { code: 'PT', name: 'Portugal', vatRate: 23 },
  { code: 'IE', name: 'Irlande', vatRate: 23 },
  { code: 'PL', name: 'Pologne', vatRate: 23 },
  { code: 'SE', name: 'Suède', vatRate: 25 },
  { code: 'DK', name: 'Danemark', vatRate: 25 },
  { code: 'FI', name: 'Finlande', vatRate: 24 },
  { code: 'NO', name: 'Norvège', vatRate: 25 },
  { code: 'US', name: 'États-Unis', vatRate: 0 },
  { code: 'CA', name: 'Canada', vatRate: 5 },
  { code: 'AU', name: 'Australie', vatRate: 10 },
  { code: 'JP', name: 'Japon', vatRate: 10 },
] as const;
