import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Crown, Zap, Sparkles, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';
import { usePayment } from '@/hooks/usePayment';
import { apiService } from '@/services/apiService';

interface OnboardingContext {
  status: any;
  refreshStatus: () => Promise<void>;
  startTimes: Record<number, number>;
}

export function PlanStep() {
  const navigate = useNavigate();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const { plans, loadPaymentData } = usePayment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('free');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  // Vérifier si on revient d'un paiement réussi
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');

    if (success === 'true') {
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Compléter l'onboarding automatiquement
      handleComplete();

      toast({
        title: 'Paiement réussi !',
        description: 'Votre abonnement a été activé.',
      });
    } else if (urlParams.get('canceled') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      toast({
        title: 'Paiement annulé',
        description: 'Vous pouvez réessayer ou choisir un autre plan.',
      });
    }
  }, []);

  const getTimeSpent = () => {
    const totalTime = Object.values(startTimes).reduce((acc, startTime) => {
      return acc + Math.floor((Date.now() - startTime) / 1000);
    }, 0);
    return totalTime;
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await completeStep('plan', 5, getTimeSpent());
      const allStepsCompleted = ['setup', 'project', 'topics', 'results', 'plan'];
      await completeOnboarding(allStepsCompleted, getTimeSpent());
      await refreshStatus();

      toast({
        title: 'Bienvenue sur Virail !',
        description: 'Votre compte est prêt.',
      });

      navigate('/', { replace: true });
    } catch (error: any) {
      if (error?.message?.includes('403')) {
        navigate('/', { replace: true });
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible de finaliser l'onboarding",
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = () => {
    if (selectedPlanId === 'free') {
      // Plan gratuit - terminer directement
      handleComplete();
    } else {
      // Plan payant - ouvrir le dialog de paiement
      setIsPaymentDialogOpen(true);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlanId || selectedPlanId === 'free') return;

    setIsProcessingPayment(true);
    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error('Plan non trouvé');
      }

      // Créer la Checkout Session côté backend
      const response = await apiService.createCheckoutSession(
        selectedPlanId,
        `${window.location.origin}/onboarding/plan?success=true&plan_id=${selectedPlanId}`,
        `${window.location.origin}/onboarding/plan?canceled=true`
      );

      // Extraire l'URL de checkout de la réponse
      const checkoutUrl = response.subscription?.checkout_url;
      const subscriptionId = response.subscription?.subscription?.id;

      if (checkoutUrl && checkoutUrl.startsWith('http')) {
        // Sauvegarder l'ID d'abonnement pour l'activation
        if (subscriptionId) {
          try { localStorage.setItem('pending_subscription_id', subscriptionId); } catch {}
        }

        // Rediriger vers Stripe pour le paiement
        window.location.href = checkoutUrl;
      } else {
        throw new Error('URL de paiement non disponible');
      }

    } catch (error) {
      toast({
        title: 'Erreur de paiement',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/results');
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return `${price}€`;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Zap className="w-6 h-6" />;
      case 'standard':
        return <Sparkles className="w-6 h-6" />;
      case 'premium':
      case 'pro':
        return <Crown className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-meetmind-primary/20 border-t-meetmind-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Chargement des plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-foreground">Choisissez votre plan</h1>
        <p className="text-muted-foreground text-lg">
          Commencez gratuitement ou débloquez plus de fonctionnalités
        </p>
      </div>

      <div className="grid gap-4">
        {plans.slice(0, 3).map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isRecommended = plan.id === 'standard';

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all',
                isSelected
                  ? 'shadow-lg border-meetmind-primary bg-meetmind-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm'
              )}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {/* Badge recommandé */}
              {isRecommended && (
                <div className="absolute -top-3 left-6">
                  <span className="text-xs font-semibold text-white bg-meetmind-primary px-3 py-1 rounded-full">
                    Recommandé
                  </span>
                </div>
              )}

              {/* Radio */}
              <div className="flex-shrink-0">
                {isSelected ? (
                  <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center shadow-md">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>

              {/* Icône */}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                isSelected ? 'bg-meetmind-primary/10 text-meetmind-primary' : 'bg-muted text-muted-foreground'
              )}>
                {getPlanIcon(plan.id)}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{plan.name}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {(plan as any).maxAnalyses === -1 ? 'Analyses illimitées' : `${(plan as any).maxAnalyses || 0} analyses/mois`}
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {(plan as any).maxReports === -1 ? 'Rapports illimités' : `${(plan as any).maxReports || 0} rapports/mois`}
                  </span>
                </div>
              </div>

              {/* Prix */}
              <div className="text-right">
                <span className={cn(
                  'text-2xl font-bold',
                  isSelected ? 'text-meetmind-primary' : 'text-foreground'
                )}>
                  {formatPrice(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-muted-foreground">/mois</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Features du plan sélectionné */}
      {selectedPlanId && (
        <div className="p-5 rounded-xl bg-muted/50 border border-border">
          <p className="text-sm font-medium text-foreground mb-3">
            Inclus dans {plans.find(p => p.id === selectedPlanId)?.name} :
          </p>
          <div className="grid grid-cols-2 gap-2">
            {plans.find(p => p.id === selectedPlanId)?.features.slice(0, 6).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-meetmind-green-accent flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6">
        <Button
          onClick={handleBack}
          variant="outline"
          className="px-6 border-border text-foreground hover:bg-muted hover:border-muted-foreground/30"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>
        <Button
          onClick={handleSelectPlan}
          disabled={isSubmitting}
          className={cn(
            "px-8 py-6 text-base font-semibold transition-all rounded-meetmind-button",
            !isSubmitting
              ? "text-white bg-meetmind-primary hover:bg-meetmind-soft-blue shadow-[0_4px_6px_-1px_rgba(26,58,255,0.3),0_2px_4px_-1px_rgba(26,58,255,0.2)] hover:shadow-[0_10px_15px_-3px_rgba(26,58,255,0.4),0_4px_6px_-2px_rgba(26,58,255,0.2)]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              <span className="opacity-80">Finalisation</span>
            </>
          ) : (
            <>
              {selectedPlanId === 'free' ? 'Commencer gratuitement' : `Choisir ${plans.find(p => p.id === selectedPlanId)?.name}`}
            </>
          )}
        </Button>
      </div>

      {/* Dialog de paiement Stripe */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-meetmind-primary" />
              Finaliser le paiement
            </DialogTitle>
            <DialogDescription>
              Abonnement au plan {plans.find(p => p.id === selectedPlanId)?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">
                  {plans.find(p => p.id === selectedPlanId)?.name}
                </span>
                <span className="font-bold text-meetmind-primary">
                  {formatPrice(plans.find(p => p.id === selectedPlanId)?.price || 0)}/mois
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Vous allez être redirigé vers la page de paiement sécurisée Stripe
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                className="flex-1 border-border"
                disabled={isProcessingPayment}
              >
                Annuler
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="flex-1 bg-meetmind-primary hover:bg-meetmind-soft-blue text-white"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Redirection...
                  </>
                ) : (
                  'Payer maintenant'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
