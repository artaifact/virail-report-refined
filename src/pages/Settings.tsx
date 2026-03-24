import { useState, useEffect } from "react";
import { usePageTitle } from '@/hooks/usePageTitle';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/authService";
import { SessionList } from "@/components/SessionList";
import {
  Settings as SettingsIcon,
  Sparkles,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Crown,
  TrendingUp,
  Receipt,
  Calendar,
  Eye,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useAccountDashboard,
  useStripeInvoices,
  useStripeBillingPortal,
  useStripePaymentMethods,
  useUpcomingInvoice,
  StripeInvoice,
  formatCurrency,
  formatDate,
} from "@/hooks/useAccount";

interface UserProfile {
  email: string;
  username: string;
  id: number;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

// Composant pour afficher le statut de l'abonnement
function SubscriptionStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: "Actif", className: "bg-green-100 text-green-700" },
    trialing: { label: "Essai", className: "bg-amber-100 text-amber-700" },
    cancelled: { label: "Annulé", className: "bg-red-100 text-red-700" },
    inactive: { label: "Inactif", className: "bg-gray-100 text-gray-700" },
    pending: { label: "En attente", className: "bg-blue-100 text-blue-700" },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Composant pour afficher le statut d'une facture Stripe
function InvoiceStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    paid: { label: "Payée", className: "bg-green-100 text-green-700" },
    open: { label: "En attente", className: "bg-amber-100 text-amber-700" },
    void: { label: "Annulée", className: "bg-gray-100 text-gray-700" },
    uncollectible: { label: "Impayée", className: "bg-red-100 text-red-700" },
    draft: { label: "Brouillon", className: "bg-blue-100 text-blue-700" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700" };

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Modal de détail d'une facture
function InvoiceDetailModal({
  invoice,
  open,
  onClose,
}: {
  invoice: StripeInvoice | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Facture {invoice.number}
          </DialogTitle>
          <DialogDescription>
            Créée le {formatDate(invoice.created)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statut et montants */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(invoice.total, invoice.currency)}
              </p>
            </div>
          </div>

          {/* Détail des lignes */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Détail</h4>
            {invoice.line_items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-gray-900">{item.description}</p>
                  {item.period && (
                    <p className="text-xs text-gray-500">
                      {formatDate(item.period.start)} - {formatDate(item.period.end)}
                    </p>
                  )}
                </div>
                <p className="font-medium">{formatCurrency(item.amount, invoice.currency)}</p>
              </div>
            ))}
          </div>

          {/* Sous-total, TVA, Total */}
          <div className="space-y-1 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.tax !== null && invoice.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">TVA</span>
                <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-1">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>

          {/* Info paiement */}
          {invoice.payment_info && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-green-700">
                Payé avec {invoice.payment_info.brand} •••• {invoice.payment_info.last4}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {invoice.pdf_url && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(invoice.pdf_url!, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            )}
            {invoice.hosted_invoice_url && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir sur Stripe
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Skeleton pour le chargement
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

const Settings = () => {
  usePageTitle('Param\u00e8tres');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<StripeInvoice | null>(null);
  const [lastInvoiceId, setLastInvoiceId] = useState<string | undefined>();
  const [accountData, setAccountData] = useState<{
    account_type?: string;
    agency_name?: string;
    agency_url?: string;
    brand_name?: string;
    brand_url?: string;
    location_country?: string;
    location_country_code?: string;
    onboarding_step?: string;
  } | null>(null);
  const [isAccountDataLoading, setIsAccountDataLoading] = useState(true);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  // Champs éditables pour les infos du compte
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandUrl, setEditBrandUrl] = useState("");
  const [editAgencyName, setEditAgencyName] = useState("");
  const [editAgencyUrl, setEditAgencyUrl] = useState("");

  // API Hooks
  const { data: dashboard, isLoading: isDashboardLoading } = useAccountDashboard();
  const { data: invoicesData, isLoading: isInvoicesLoading } = useStripeInvoices(10, lastInvoiceId);
  const { data: paymentMethods } = useStripePaymentMethods();
  const { data: upcomingInvoice } = useUpcomingInvoice();
  const billingPortal = useStripeBillingPortal();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await AuthService.getUserProfile();
        setUserProfile(profile);
        if (profile.username) {
          const nameParts = profile.username.split(" ");
          if (nameParts.length >= 2) {
            setFirstName(nameParts[0]);
            setLastName(nameParts.slice(1).join(" "));
          } else {
            setFirstName(profile.username);
          }
        }
      } catch (err) {
      }
    };

    loadUserProfile();

    // Charger les données de compte (onboarding)
    const loadAccountData = async () => {
      try {
        const apiBase = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL || "https://api.viraill.com");
        const res = await fetch(`${apiBase}/auth/user/onboarding/account-data`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setAccountData(data);
          setEditBrandName(data.brand_name || "");
          setEditBrandUrl(data.brand_url || "");
          setEditAgencyName(data.agency_name || "");
          setEditAgencyUrl(data.agency_url || "");
        }
      } catch {
      } finally {
        setIsAccountDataLoading(false);
      }
    };
    loadAccountData();
  }, []);

  const getInitial = () => {
    if (firstName) return firstName[0].toUpperCase();
    if (userProfile?.username) return userProfile.username[0].toUpperCase();
    return "U";
  };

  const handleOpenBillingPortal = () => {
    billingPortal.mutate();
  };

  const handleLoadMoreInvoices = () => {
    if (invoicesData?.invoices.length) {
      const lastId = invoicesData.invoices[invoicesData.invoices.length - 1].id;
      setLastInvoiceId(lastId);
    }
  };

  const handleSaveAccountData = async () => {
    if (!accountData) return;
    setIsSavingAccount(true);
    try {
      const apiBase = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL || "https://api.viraill.com");
      const payload: Record<string, string> = {
        account_type: accountData.account_type || "in_house",
        location_country: accountData.location_country || "",
        location_country_code: accountData.location_country_code || "",
        onboarding_step: accountData.onboarding_step || "setup",
        brand_name: editBrandName,
        brand_url: editBrandUrl,
      };
      if (accountData.account_type === "agency") {
        payload.agency_name = editAgencyName;
        payload.agency_url = editAgencyUrl;
      }
      const res = await fetch(`${apiBase}/auth/user/onboarding/account-data`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail?.message || err?.detail || `Erreur ${res.status}`);
      }
      setAccountData(prev => prev ? {
        ...prev,
        brand_name: editBrandName,
        brand_url: editBrandUrl,
        agency_name: editAgencyName,
        agency_url: editAgencyUrl,
      } : prev);
      toast({ title: "Informations mises à jour", description: "Vos informations ont été enregistrées." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible de sauvegarder les informations";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Carte de paiement par défaut
  const defaultPaymentMethod = paymentMethods?.find(pm => pm.is_default) || paymentMethods?.[0];

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres du compte</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre abonnement, vos informations de facturation et vos préférences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations personnelles</h2>

            <div className="mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-semibold text-white">{getInitial()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Nom
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={userProfile?.email || ""}
                  disabled
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              {dashboard?.member_since && (
                <p className="text-sm text-gray-500">
                  Membre depuis {formatDate(dashboard.member_since)}
                </p>
              )}
            </div>
          </div>

          {/* Abonnement */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Mon Abonnement</h2>
              {dashboard?.subscription && (
                <SubscriptionStatusBadge status={dashboard.subscription.status} />
              )}
            </div>

            {dashboard?.has_subscription && dashboard.subscription ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <Crown className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{dashboard.subscription.plan_name}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(dashboard.subscription.plan_price, dashboard.subscription.currency)}
                      /{dashboard.subscription.interval === "month" ? "mois" : "an"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de début</span>
                    <span className="font-medium">{formatDate(dashboard.subscription.start_date)}</span>
                  </div>
                  {dashboard.subscription.next_billing_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prochaine facturation</span>
                      <span className="font-medium">{formatDate(dashboard.subscription.next_billing_date)}</span>
                    </div>
                  )}
                  {dashboard.subscription.trial_end && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fin de l'essai</span>
                      <span className="font-medium text-amber-600">{formatDate(dashboard.subscription.trial_end)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Renouvellement auto</span>
                    <span className="font-medium">
                      {dashboard.subscription.auto_renew ? "Activé" : "Désactivé"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                  <Button onClick={handleOpenBillingPortal} variant="outline" size="sm" disabled={billingPortal.isPending}>
                    {billingPortal.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <SettingsIcon className="h-4 w-4 mr-2" />
                    )}
                    Gérer sur Stripe
                  </Button>
                  <Button onClick={() => navigate("/pricing")} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Améliorer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Crown className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">Aucun abonnement actif</p>
                <Button onClick={() => navigate("/pricing")} className="bg-blue-600 hover:bg-blue-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Découvrir nos offres
                </Button>
              </div>
            )}
          </div>

          {/* Utilisation */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Utilisation du mois</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>

            {dashboard?.usage && dashboard.usage.length > 0 ? (
              <div className="space-y-5">
                {dashboard.usage.map((item) => (
                  <div key={item.feature} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.feature_label}</span>
                      <span className="text-gray-600">
                        {item.used}/{item.limit === -1 ? "∞" : item.limit}
                      </span>
                    </div>
                    <Progress
                      value={item.limit === -1 ? 0 : item.percentage}
                      className={cn(
                        "h-2",
                        item.percentage >= 90 && "bg-red-100 [&>div]:bg-red-500",
                        item.percentage >= 70 && item.percentage < 90 && "bg-amber-100 [&>div]:bg-amber-500"
                      )}
                    />
                    {item.reset_date && (
                      <p className="text-xs text-gray-500">
                        Réinitialisation le {formatDate(item.reset_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>Aucune donnée d'utilisation disponible</p>
              </div>
            )}
          </div>

          {/* Moyen de paiement */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Moyen de paiement</h2>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>

            {defaultPaymentMethod ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-14 h-9 bg-gradient-to-r from-slate-700 to-slate-900 rounded-md flex items-center justify-center shadow">
                    <span className="text-white text-xs font-bold uppercase">
                      {defaultPaymentMethod.brand || "Card"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      •••• •••• •••• {defaultPaymentMethod.last4}
                    </p>
                    {defaultPaymentMethod.exp_month && defaultPaymentMethod.exp_year && (
                      <p className="text-sm text-gray-500">
                        Expire {String(defaultPaymentMethod.exp_month).padStart(2, '0')}/{defaultPaymentMethod.exp_year}
                      </p>
                    )}
                  </div>
                  {defaultPaymentMethod.is_default && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Par défaut
                    </Badge>
                  )}
                </div>

                {/* Prochaine facture */}
                {upcomingInvoice && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center flex-wrap gap-2 text-sm text-blue-700">
                      <Calendar className="h-4 w-4" />
                      <span>Prochaine facture :</span>
                      <span className="font-semibold">
                        {formatCurrency(upcomingInvoice.total, upcomingInvoice.currency)}
                      </span>
                      {upcomingInvoice.next_payment_attempt && (
                        <span className="text-blue-600">
                          le {formatDate(upcomingInvoice.next_payment_attempt)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleOpenBillingPortal}
                  variant="outline"
                  className="w-full"
                  disabled={billingPortal.isPending}
                >
                  {billingPortal.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Gérer sur Stripe
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">Aucun moyen de paiement enregistré</p>
                <Button
                  onClick={handleOpenBillingPortal}
                  variant="outline"
                  disabled={billingPortal.isPending}
                >
                  {billingPortal.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Ajouter sur Stripe
                </Button>
              </div>
            )}
          </div>

          {/* Informations du compte */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations du compte</h2>

            {isAccountDataLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : accountData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accountData.account_type && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Type de compte</Label>
                      <Input
                        value={accountData.account_type === "agency" ? "Agence" : "In-house"}
                        disabled
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                  )}

                  {accountData.location_country && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Pays</Label>
                      <Input
                        value={`${accountData.location_country}${accountData.location_country_code ? ` (${accountData.location_country_code})` : ""}`}
                        disabled
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-sm font-medium text-gray-700">Marque</Label>
                    <Input
                      id="brandName"
                      value={editBrandName}
                      onChange={(e) => setEditBrandName(e.target.value)}
                      placeholder="Nom de votre marque"
                      className="border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandUrl" className="text-sm font-medium text-gray-700">URL de la marque</Label>
                    <Input
                      id="brandUrl"
                      value={editBrandUrl}
                      onChange={(e) => setEditBrandUrl(e.target.value)}
                      placeholder="https://votre-marque.com"
                      className="border-gray-300"
                    />
                  </div>

                  {accountData.account_type === "agency" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="agencyName" className="text-sm font-medium text-gray-700">Agence</Label>
                        <Input
                          id="agencyName"
                          value={editAgencyName}
                          onChange={(e) => setEditAgencyName(e.target.value)}
                          placeholder="Nom de votre agence"
                          className="border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="agencyUrl" className="text-sm font-medium text-gray-700">URL de l'agence</Label>
                        <Input
                          id="agencyUrl"
                          value={editAgencyUrl}
                          onChange={(e) => setEditAgencyUrl(e.target.value)}
                          placeholder="https://votre-agence.com"
                          className="border-gray-300"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveAccountData}
                    disabled={isSavingAccount}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingAccount ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {isSavingAccount ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune information de compte disponible.</p>
            )}
          </div>

          {/* Sessions actives */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Sécurité & Sessions</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Gérez les appareils connectés à votre compte et déconnectez les sessions suspectes.
            </p>
            <SessionList />
          </div>

          {/* Factures Stripe */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Mes Factures</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleOpenBillingPortal}
                  variant="outline"
                  size="sm"
                  disabled={billingPortal.isPending}
                >
                  {billingPortal.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Portail Stripe
                </Button>
              </div>
            </div>

            {isInvoicesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : invoicesData?.invoices && invoicesData.invoices.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoicesData.invoices.map((invoice) => (
                        <TableRow key={invoice.id} className="group">
                          <TableCell className="font-medium">{invoice.number}</TableCell>
                          <TableCell>{formatDate(invoice.created)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </TableCell>
                          <TableCell>
                            <InvoiceStatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInvoice(invoice)}
                                title="Voir le détail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {invoice.pdf_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(invoice.pdf_url!, '_blank')}
                                  title="Télécharger le PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {invoice.hosted_invoice_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                                  title="Voir sur Stripe"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {invoicesData.has_more && (
                  <div className="flex justify-center mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={handleLoadMoreInvoices}
                    >
                      Charger plus
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600">Aucune facture pour le moment</p>
              </div>
            )}
          </div>

          {/* Stats globales */}
          {dashboard?.total_spent !== undefined && dashboard.total_spent > 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 md:p-6 shadow-sm lg:col-span-2 text-white">
              <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-blue-200 text-sm">Total dépensé</p>
                  <p className="text-lg sm:text-2xl font-bold">{formatCurrency(dashboard.total_spent)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Factures</p>
                  <p className="text-lg sm:text-2xl font-bold">{invoicesData?.invoices?.length || 0}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Membre depuis</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {dashboard.member_since
                      ? new Date(dashboard.member_since).toLocaleDateString("fr-FR", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Statut</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {dashboard.has_subscription ? "Premium" : "Gratuit"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal détail facture */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};

export default Settings;
