import { useState, useEffect } from "react";
import { usePageTitle } from '@/hooks/usePageTitle';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthService } from "@/services/authService";
import { SessionList } from "@/components/SessionList";
import {
  Settings as SettingsIcon,
  ArrowUpRight,
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
  Info,
  Pencil,
  X,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { onboardingService } from "@/services/onboardingService";
import { SettingsSkeletonLoader } from "@/components/settings/SettingsSkeletonLoader";
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
    active: { label: "Actif", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 font-medium" },
    trialing: { label: "Essai", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 font-medium" },
    cancelled: { label: "Annulé", className: "bg-destructive/10 text-destructive border-0 font-medium" },
    inactive: { label: "Inactif", className: "bg-muted text-muted-foreground border-0 font-medium" },
    pending: { label: "En attente", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 font-medium" },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Composant pour afficher le statut d'une facture Stripe
function InvoiceStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    paid: { label: "Payée", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 font-medium" },
    open: { label: "En attente", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 font-medium" },
    void: { label: "Annulée", className: "bg-muted text-muted-foreground border-0 font-medium" },
    uncollectible: { label: "Impayée", className: "bg-destructive/10 text-destructive border-0 font-medium" },
    draft: { label: "Brouillon", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 font-medium" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground border-0 font-medium" };

  return (
    <Badge variant="outline" className={config.className}>
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
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);

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

    // Charger les données de compte (onboarding) + statut (pour verrouiller l’édition si terminé)
    const loadAccountData = async () => {
      try {
        const apiBase = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL || "https://api.viraill.com");
        const [res, onboardingStatus] = await Promise.all([
          fetch(`${apiBase}/auth/user/onboarding/account-data`, {
            method: "GET",
            credentials: "include",
          }),
          onboardingService.getOnboardingStatus().catch(() => null),
        ]);
        if (onboardingStatus?.completed) {
          setOnboardingCompleted(true);
        }
        if (res.ok) {
          const data = await res.json();
          if (data.onboarding_completed === true || data.onboarding_completed === "true") {
            setOnboardingCompleted(true);
          }
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
        brand_name: editBrandName,
        brand_url: editBrandUrl,
      };
      if (accountData.account_type === "agency") {
        payload.agency_name = editAgencyName;
        payload.agency_url = editAgencyUrl;
      }
      const res = await fetch(`${apiBase}/auth/user/onboarding/account-data`, {
        method: "PUT",
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
      setIsEditingAccount(false);
      toast({ title: "Informations mises à jour", description: "Vos informations ont été enregistrées." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible de sauvegarder les informations";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleCancelEditAccount = () => {
    setEditBrandName(accountData?.brand_name || "");
    setEditBrandUrl(accountData?.brand_url || "");
    setEditAgencyName(accountData?.agency_name || "");
    setEditAgencyUrl(accountData?.agency_url || "");
    setIsEditingAccount(false);
  };

  // Carte de paiement par défaut
  const defaultPaymentMethod = paymentMethods?.find(pm => pm.is_default) || paymentMethods?.[0];

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-12">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <SettingsSkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Paramètres du compte</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez votre abonnement, vos informations de facturation et vos préférences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground">Informations personnelles</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-2xl">
                  {getInitial()}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-medium text-foreground">
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-medium text-foreground">
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Email</Label>
                  <Input
                    type="email"
                    value={userProfile?.email || ""}
                    disabled
                    className="bg-muted/40 text-muted-foreground text-sm"
                  />
                </div>

                {dashboard?.member_since && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Membre depuis {formatDate(dashboard.member_since)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Abonnement */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <CardTitle className="text-base font-semibold text-foreground">Mon Abonnement</CardTitle>
              {dashboard?.subscription && (
                <SubscriptionStatusBadge status={dashboard.subscription.status} />
              )}
            </CardHeader>

            <CardContent>
              {dashboard?.has_subscription && dashboard.subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <Crown className="h-7 w-7 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{dashboard.subscription.plan_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(dashboard.subscription.plan_price, dashboard.subscription.currency)}
                        /{dashboard.subscription.interval === "month" ? "mois" : "an"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Date de début</span>
                      <span className="font-medium text-foreground">{formatDate(dashboard.subscription.start_date)}</span>
                    </div>
                    {dashboard.subscription.next_billing_date && (
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Prochaine facturation</span>
                        <span className="font-medium text-foreground">{formatDate(dashboard.subscription.next_billing_date)}</span>
                      </div>
                    )}
                    {dashboard.subscription.trial_end && (
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Fin de l'essai</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{formatDate(dashboard.subscription.trial_end)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Renouvellement auto</span>
                      <span className="font-medium text-foreground">
                        {dashboard.subscription.auto_renew ? "Activé" : "Désactivé"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
                    <Button onClick={handleOpenBillingPortal} variant="outline" size="sm" disabled={billingPortal.isPending} className="text-xs">
                      {billingPortal.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <SettingsIcon className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Gérer sur Stripe
                    </Button>
                    <Button onClick={() => navigate("/pricing")} size="sm" className="text-xs font-semibold">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                      Changer de forfait
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Aucun abonnement actif</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Passez à un forfait supérieur pour débloquer plus d'audits et de modèles IA.</p>
                  </div>
                  <Button onClick={() => navigate("/pricing")} size="sm" className="font-semibold text-xs">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                    Découvrir nos offres
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Utilisation */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <CardTitle className="text-base font-semibold text-foreground">Utilisation du mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              {dashboard?.usage && dashboard.usage.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.usage.map((item) => (
                    <div key={item.feature} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">{item.feature_label}</span>
                        <span className="text-muted-foreground">
                          {item.used} / {item.limit === -1 ? "∞" : item.limit}
                        </span>
                      </div>
                      <Progress
                        value={item.limit === -1 ? 0 : item.percentage}
                        className="h-2"
                      />
                      {item.reset_date && (
                        <p className="text-[11px] text-muted-foreground">
                          Réinitialisation le {formatDate(item.reset_date)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  Aucune donnée d'utilisation disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Moyen de paiement */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <CardTitle className="text-base font-semibold text-foreground">Moyen de paiement</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              {defaultPaymentMethod ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 p-3.5 bg-muted/40 rounded-xl border border-border">
                    <div className="w-12 h-8 bg-foreground text-background rounded-md flex items-center justify-center shadow-xs">
                      <span className="text-[11px] font-bold uppercase">
                        {defaultPaymentMethod.brand || "Card"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        •••• •••• •••• {defaultPaymentMethod.last4}
                      </p>
                      {defaultPaymentMethod.exp_month && defaultPaymentMethod.exp_year && (
                        <p className="text-xs text-muted-foreground">
                          Expire {String(defaultPaymentMethod.exp_month).padStart(2, '0')}/{defaultPaymentMethod.exp_year}
                        </p>
                      )}
                    </div>
                    {defaultPaymentMethod.is_default && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                        Par défaut
                      </Badge>
                    )}
                  </div>

                  {/* Prochaine facture */}
                  {upcomingInvoice && (
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-primary flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>Prochaine facture :</span>
                      <strong className="font-semibold">
                        {formatCurrency(upcomingInvoice.total, upcomingInvoice.currency)}
                      </strong>
                      {upcomingInvoice.next_payment_attempt && (
                        <span>le {formatDate(upcomingInvoice.next_payment_attempt)}</span>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleOpenBillingPortal}
                    variant="outline"
                    className="w-full text-xs"
                    disabled={billingPortal.isPending}
                  >
                    {billingPortal.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Gérer sur Stripe
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-muted-foreground">Aucun moyen de paiement enregistré</p>
                  <Button
                    onClick={handleOpenBillingPortal}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={billingPortal.isPending}
                  >
                    {billingPortal.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Ajouter sur Stripe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations du compte */}
          <Card className="border-border bg-card shadow-xs lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Informations du compte</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Renseignez votre organisation et domaine principal
                </CardDescription>
              </div>
              {accountData && !isEditingAccount && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingAccount(true)}
                  className="gap-1.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {isAccountDataLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
              ) : accountData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accountData.account_type && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">Type de compte</Label>
                        <Input
                          value={accountData.account_type === "agency" ? "Agence" : "In-house"}
                          disabled
                          className="bg-muted/40 text-muted-foreground text-sm"
                        />
                      </div>
                    )}

                    {accountData.location_country && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">Pays</Label>
                        <Input
                          value={`${accountData.location_country}${accountData.location_country_code ? ` (${accountData.location_country_code})` : ""}`}
                          disabled
                          className="bg-muted/40 text-muted-foreground text-sm"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="brandName" className="text-xs font-medium text-foreground">Marque</Label>
                      <Input
                        id="brandName"
                        value={editBrandName}
                        onChange={(e) => setEditBrandName(e.target.value)}
                        placeholder="Nom de votre marque"
                        disabled={!isEditingAccount}
                        className={!isEditingAccount ? "bg-muted/40 text-muted-foreground text-sm" : "text-sm"}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="brandUrl" className="text-xs font-medium text-foreground">URL de la marque</Label>
                      <Input
                        id="brandUrl"
                        value={editBrandUrl}
                        onChange={(e) => setEditBrandUrl(e.target.value)}
                        placeholder="https://votre-marque.com"
                        disabled={!isEditingAccount}
                        className={!isEditingAccount ? "bg-muted/40 text-muted-foreground text-sm" : "text-sm"}
                      />
                    </div>

                    {accountData.account_type === "agency" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="agencyName" className="text-xs font-medium text-foreground">Agence</Label>
                          <Input
                            id="agencyName"
                            value={editAgencyName}
                            onChange={(e) => setEditAgencyName(e.target.value)}
                            placeholder="Nom de votre agence"
                            disabled={!isEditingAccount}
                            className={!isEditingAccount ? "bg-muted/40 text-muted-foreground text-sm" : "text-sm"}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="agencyUrl" className="text-xs font-medium text-foreground">URL de l’agence</Label>
                          <Input
                            id="agencyUrl"
                            value={editAgencyUrl}
                            onChange={(e) => setEditAgencyUrl(e.target.value)}
                            placeholder="https://votre-agence.com"
                            disabled={!isEditingAccount}
                            className={!isEditingAccount ? "bg-muted/40 text-muted-foreground text-sm" : "text-sm"}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {isEditingAccount && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditAccount}
                        disabled={isSavingAccount}
                        className="gap-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" />
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSaveAccountData}
                        disabled={isSavingAccount}
                        size="sm"
                        className="gap-1.5 text-xs font-semibold"
                      >
                        {isSavingAccount ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {isSavingAccount ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Aucune information de compte disponible.</p>
              )}
            </CardContent>
          </Card>

          {/* Sessions actives */}
          <Card className="border-border bg-card shadow-xs lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">Sécurité & Sessions</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Gérez les appareils connectés à votre compte et déconnectez les sessions suspectes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionList />
            </CardContent>
          </Card>

          {/* Factures Stripe */}
          <Card className="border-border bg-card shadow-xs lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Mes Factures</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Consultez et téléchargez vos reçus de paiement
                </CardDescription>
              </div>
              <Button
                onClick={handleOpenBillingPortal}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                disabled={billingPortal.isPending}
              >
                {billingPortal.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                Portail Stripe
              </Button>
            </CardHeader>

            <CardContent>
              {isInvoicesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-10 w-full" />
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
                            <TableCell className="font-medium text-xs">{invoice.number}</TableCell>
                            <TableCell className="text-xs">{formatDate(invoice.created)}</TableCell>
                            <TableCell className="font-semibold text-xs">
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
                                  className="h-7 w-7 p-0"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {invoice.pdf_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.pdf_url!, '_blank')}
                                    title="Télécharger le PDF"
                                    className="h-7 w-7 p-0"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {invoice.hosted_invoice_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                                    title="Voir sur Stripe"
                                    className="h-7 w-7 p-0"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
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
                    <div className="flex justify-center mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMoreInvoices}
                        className="text-xs gap-1.5"
                      >
                        Charger plus
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-muted-foreground">Aucune facture pour le moment</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats globales */}
          {dashboard?.total_spent !== undefined && dashboard.total_spent > 0 && (
            <Card className="border-border bg-card shadow-xs lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground">Récapitulatif financier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Total dépensé</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{formatCurrency(dashboard.total_spent)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Factures</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{invoicesData?.invoices?.length || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Membre depuis</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {dashboard.member_since
                        ? new Date(dashboard.member_since).toLocaleDateString("fr-FR", {
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {dashboard.has_subscription ? "Premium" : "Gratuit"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
