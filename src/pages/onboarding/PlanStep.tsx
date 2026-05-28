import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Zap, Sparkles, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';
import { usePayment } from '@/hooks/usePayment';
import { apiService } from '@/services/apiService';
import { AuthService } from '@/services/authService';
import { modelLogos } from '@/components/ModelLogosCarousel';

// Configuration des modèles AI par plan (même config que PlanSelector)
const AI_MODELS_CONFIG = [
  { level: 0, ids: ['free'], web: ['openai', 'perplexity', 'gemini'], api: [] },
  { level: 1, ids: ['starter', 'standard'], web: ['openai', 'perplexity', 'gemini', 'claude', 'mistral', 'deepseek'], api: [] },
  { level: 2, ids: ['intermediaire', 'pro', 'premium'], web: ['openai', 'perplexity', 'gemini', 'claude', 'mistral', 'deepseek'], api: ['openai', 'perplexity'] },
  { level: 3, ids: ['advanced', 'enterprise'], web: ['openai', 'perplexity', 'gemini', 'claude', 'mistral', 'deepseek'], api: ['openai', 'perplexity', 'claude'] },
];

function getAiModelsForPlan(planId: string, planIndex: number): { web: string[]; api: string[] } {
  const config = AI_MODELS_CONFIG.find(c => c.ids.includes(planId.toLowerCase()));
  if (config) return { web: config.web, api: config.api };
  const fallback = AI_MODELS_CONFIG[Math.min(planIndex, AI_MODELS_CONFIG.length - 1)];
  return { web: fallback.web, api: fallback.api };
}

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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'polling' | 'active' | 'error'>('idle');
  const [pollAttempt, setPollAttempt] = useState(0);
  const cancelledRef = useRef(false);
  const MAX_POLL_ATTEMPTS = 15;

  useEffect(() => {
    loadPaymentData();
  }, []);

  // Vérifier si on revient d'un paiement Stripe
  useEffect(() => {
    cancelledRef.current = false;
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const canceled = urlParams.get('canceled');

    if (sessionId) {
      // Retour Stripe avec session_id → vérifier le paiement
      window.history.replaceState({}, document.title, window.location.pathname);
      setPaymentStatus('polling');
      checkCheckoutSession(sessionId);
    } else if (canceled === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      toast({
        title: 'Paiement annulé',
        description: 'Vous pouvez réessayer ou choisir un autre plan.',
      });
    }

    return () => { cancelledRef.current = true; };
  }, []);

  // Appeler le backend qui vérifie Stripe + active sub + complète onboarding
  const checkCheckoutSession = async (sessionId: string) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      if (cancelledRef.current) return;

      try {
        const res = await AuthService.makeAuthenticatedRequest(
          `${apiBase}/api/v1/subscriptions/checkout-session/${sessionId}`,
          { method: 'GET' }
        );

        if (!res.ok) {
          // Si 404 ou autre erreur serveur, on réessaie
        } else {
          const data = await res.json();

          if (data.onboarding_completed) {
            if (cancelledRef.current) return;
            setPaymentStatus('active');

            // Nettoyage
            try {
              localStorage.removeItem('pending_subscription_id');
              localStorage.removeItem('pending_plan_id');
            } catch {}

            toast({
              title: 'Paiement réussi !',
              description: 'Votre abonnement est actif.',
            });

            // Rediriger vers le dashboard
            setTimeout(() => {
              if (!cancelledRef.current) navigate('/', { replace: true });
            }, 1500);
            return;
          }
        }
      } catch (e) {
      }

      if (cancelledRef.current) return;
      setPollAttempt(i + 1);
      // Réessayer dans 2s
      await new Promise(r => setTimeout(r, 2000));
    }

    // Timeout après toutes les tentatives
    if (!cancelledRef.current) {
      setPaymentStatus('error');
    }
  };

  const getTimeSpent = () => {
    const totalTime = Object.values(startTimes).reduce((acc, startTime) => {
      return acc + Math.floor((Date.now() - startTime) / 1000);
    }, 0);
    return totalTime;
  };

  const handleCompleteFree = async () => {
    setIsSubmitting(true);
    try {
      await completeStep('plan', 5, getTimeSpent());
      const allStepsCompleted = ['setup', 'project', 'topics', 'results', 'plan'];
      await completeOnboarding(allStepsCompleted, getTimeSpent());
      await refreshStatus();
      toast({ title: 'Bienvenue sur Virail !', description: 'Votre compte est prêt.' });
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
      handleCompleteFree();
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
      // {CHECKOUT_SESSION_ID} est remplacé par Stripe avec l'ID de session réel
      const response = await apiService.createCheckoutSession(
        selectedPlanId,
        `${window.location.origin}/onboarding/plan?session_id={CHECKOUT_SESSION_ID}`,
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

  // Afficher l'écran de traitement du paiement
  if (paymentStatus === 'polling' || paymentStatus === 'active') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-slate-100">
            {paymentStatus === 'polling' ? (
              <>
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Activation en cours...
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Votre paiement est en cours de traitement.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${(pollAttempt / MAX_POLL_ATTEMPTS) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Paiement réussi
                </h2>
                <p className="text-sm text-gray-500">
                  Votre abonnement est actif. Redirection...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-slate-100">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Paiement en cours de traitement
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              L'activation peut prendre quelques instants.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Rafraîchir la page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <p className="text-sm font-medium text-green-600">
          7 jours d'essai gratuit sur le plan Starter
        </p>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", plans.length <= 3 ? "sm:grid-cols-3" : plans.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3 lg:grid-cols-5")}>
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isRecommended = plan.id === 'standard';
          const planIndex = plans.indexOf(plan);
          const aiModels = getAiModelsForPlan(plan.id, planIndex);

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-xl border-2 cursor-pointer transition-all overflow-hidden',
                isSelected
                  ? 'shadow-lg border-meetmind-primary bg-meetmind-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm'
              )}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {/* Badge recommandé */}
              {isRecommended && (
                <div className="absolute -top-0 left-0 right-0 flex justify-center">
                  <span className="text-xs font-semibold text-white bg-meetmind-primary px-3 py-1 rounded-b-lg">
                    Recommandé
                  </span>
                </div>
              )}

              {/* Header */}
              <div className={cn("p-5 pb-4 text-center", isRecommended && "pt-8")}>
                <span className="font-bold text-lg text-foreground">{plan.name}</span>
                <div className="mt-2">
                  <span className={cn(
                    'text-3xl font-bold',
                    isSelected ? 'text-meetmind-primary' : 'text-foreground'
                  )}>
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground">/mois</span>
                  )}
                  {plan.id === 'solo' && (
                    <div className="text-xs font-medium text-green-600 mt-1">7 jours gratuits</div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="px-5 pb-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Analyses</span>
                  <span className="font-medium text-foreground">
                    {(plan as any).maxAnalyses === -1 ? 'Illimitées' : `${(plan as any).maxAnalyses || 0}/mois`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rapports</span>
                  <span className="font-medium text-foreground">
                    {(plan as any).maxReports === -1 ? 'Illimités' : `${(plan as any).maxReports || 0}/mois`}
                  </span>
                </div>
              </div>

              {/* AI Models */}
              <div className="px-5 py-3 border-t border-border space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Models</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">Web UI</Badge>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {aiModels.web.map((model) => (
                        <img key={model} src={modelLogos[model]} alt={model} className="h-5 w-5 object-contain" title={model.charAt(0).toUpperCase() + model.slice(1)} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">+ API</Badge>
                    {aiModels.api.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {aiModels.api.map((model) => (
                          <img key={`api-${model}`} src={modelLogos[model]} alt={model} className="h-5 w-5 object-contain" title={model.charAt(0).toUpperCase() + model.slice(1)} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Plan supérieur</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="px-5 py-3 border-t border-border flex-1">
                <div className="space-y-1.5">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-meetmind-green-accent flex-shrink-0" />
                      <span className="text-muted-foreground text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection indicator */}
              <div className={cn(
                "px-5 py-3 text-center text-sm font-medium transition-colors",
                isSelected
                  ? "bg-meetmind-primary text-white"
                  : "bg-muted/50 text-muted-foreground"
              )}>
                {isSelected ? 'Sélectionné' : 'Sélectionner'}
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
              {selectedPlanId === 'free' ? 'Commencer gratuitement' : selectedPlanId === 'solo' ? 'Essayer 7 jours gratuits' : 'Souscrire maintenant'}
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
              {selectedPlanId === 'solo' && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-700">7 jours d'essai gratuit — aucun débit immédiat</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
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
