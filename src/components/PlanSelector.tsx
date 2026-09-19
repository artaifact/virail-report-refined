import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayment } from '@/hooks/usePayment';
import { Crown, Star, Zap, Check, CreditCard, Users, BarChart3, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { modelLogos } from '@/components/ModelLogosCarousel';
import { PricingSkeletonLoader } from '@/components/pricing/PricingSkeletonLoader';

// Configuration des modèles AI par plan (niveau : starter → intermédiaire → avancé)
const AI_MODELS_CONFIG = [
  {
    level: 0, // Free / Gratuit
    ids: ['free'],
    web: ['openai', 'perplexity', 'gemini'],
    api: [],
  },
  {
    level: 1, // Starter
    ids: ['solo', 'starter', 'standard'],
    web: ['openai', 'perplexity', 'gemini', 'claude', 'mistral', 'deepseek'],
    api: [],
  },
  {
    level: 2, // Intermédiaire / Pro
    ids: ['intermediaire', 'pro', 'premium'],
    web: ['openai', 'perplexity', 'gemini', 'claude', 'mistral', 'deepseek'],
    api: ['openai', 'perplexity'],
  },
  {
    level: 3, // Avancé / Enterprise
    ids: ['advanced', 'enterprise'],
    web: ['openai', 'perplexity', 'gemini', 'claude', 'mistral', 'deepseek'],
    api: ['openai', 'perplexity', 'claude'],
  },
];

function getAiModelsForPlan(planId: string): { web: string[]; api: string[] } | null {
  const config = AI_MODELS_CONFIG.find(c => c.ids.includes(planId.toLowerCase()));
  if (config) return { web: config.web, api: config.api };
  // Fallback par index de plan (1er = starter, 2e = intermédiaire, etc.)
  return null;
};

// Fonctions de calcul sécurisées des quotas par plan (aucun undefined)
const getPlanMaxAnalyses = (p: any): string => {
  const val = p.maxAnalyses ?? p.max_analyses;
  if (val === -1) return 'Illimitées';
  if (typeof val === 'number' && val > 0) return `${val} / mois`;
  if (typeof val === 'string' && val.trim()) {
    const num = Number(val);
    if (num === -1) return 'Illimitées';
    if (!isNaN(num) && num > 0) return `${num} / mois`;
  }
  const id = String(p.id || '').toLowerCase();
  const name = String(p.name || '').toLowerCase();
  if (id.includes('starter') || name.includes('starter') || id === 'solo' || id === 'standard') return '10 / mois';
  if (id.includes('intermediaire') || name.includes('intermédiaire') || id.includes('intermediate')) return '50 / mois';
  if (id.includes('pro') || name.includes('pro') || id.includes('premium')) return '150 / mois';
  if (id.includes('enterprise') || id.includes('entreprise') || name.includes('entreprise')) return 'Illimitées';
  return '10 / mois';
};

const getPlanMaxReports = (p: any): string => {
  const val = p.maxReports ?? p.max_reports;
  if (val === -1) return 'Illimités';
  if (typeof val === 'number' && val > 0) return `${val} domaine${val > 1 ? 's' : ''}`;
  if (typeof val === 'string' && val.trim()) {
    const num = Number(val);
    if (num === -1) return 'Illimités';
    if (!isNaN(num) && num > 0) return `${num} domaine${num > 1 ? 's' : ''}`;
  }
  if (Array.isArray(p.features)) {
    for (const f of p.features) {
      const match = String(f).match(/(\d+)\s*nom(?:s)?\s*de\s*domaine/i);
      if (match) {
        const count = parseInt(match[1], 10);
        return `${count} domaine${count > 1 ? 's' : ''}`;
      }
    }
  }
  const id = String(p.id || '').toLowerCase();
  const name = String(p.name || '').toLowerCase();
  if (id.includes('starter') || name.includes('starter') || id === 'solo' || id === 'standard') return '1 domaine';
  if (id.includes('intermediaire') || name.includes('intermédiaire') || id.includes('intermediate')) return '3 domaines';
  if (id.includes('pro') || name.includes('pro') || id.includes('premium')) return '5 domaines';
  if (id.includes('enterprise') || id.includes('entreprise') || name.includes('entreprise')) return '10 domaines';
  return '1 domaine';
};

interface PlanSelectorProps {
  className?: string;
  showCurrentPlan?: boolean;
  onPlanSelected?: (planId: string) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  className = '', 
  showCurrentPlan = true,
  onPlanSelected 
}) => {
  const { 
    plans, 
    currentPlan, 
    isOnFreePlan, 
    getRecommendedPlan,
    createSubscription,
    isProcessing,
    loadPaymentData,
    usageLimits 
  } = usePayment();
  
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDowngradeDialogOpen, setIsDowngradeDialogOpen] = useState(false);
  const [pendingDowngradePlanId, setPendingDowngradePlanId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const getPlanLevel = (planId: string): number => {
    const config = AI_MODELS_CONFIG.find(c => c.ids.includes(planId.toLowerCase()));
    return config ? config.level : -1;
  };

  const isDowngrade = (targetPlanId: string): boolean => {
    if (!currentPlan) return false;
    return getPlanLevel(targetPlanId) < getPlanLevel(currentPlan.id);
  };

  // Charger les données au montage
  useEffect(() => {
    // Charger seulement si les données ne sont pas déjà disponibles
    if (!currentPlan || !usageLimits) {
      loadPaymentData();
    }
  }, []); // Dépendances vides pour éviter les re-renders

  const handlePlanSelection = (planId: string) => {
    if (planId === 'free') {
      if (onPlanSelected) onPlanSelected(planId);
      return;
    }

    if (isDowngrade(planId)) {
      setPendingDowngradePlanId(planId);
      setIsDowngradeDialogOpen(true);
      return;
    }

    setSelectedPlanId(planId);
    try { localStorage.setItem('pending_plan_id', planId); } catch {}
    setIsPaymentDialogOpen(true);
  };

  const confirmDowngrade = () => {
    setIsDowngradeDialogOpen(false);
    setSelectedPlanId(pendingDowngradePlanId);
    try { localStorage.setItem('pending_plan_id', pendingDowngradePlanId); } catch {}
    setIsPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedPlanId) return;

    setIsProcessingPayment(true);
    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error('Plan non trouvé');
      }


      // Créer la Checkout Session côté backend
      const response = await apiService.createCheckoutSession(
        selectedPlanId,
        `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        `${window.location.origin}/pricing?canceled=true`
      );


      // Extraire l'URL de checkout de la réponse
      const checkoutUrl = response.subscription?.checkout_url;
      const subscriptionId = response.subscription?.subscription?.id;
      const planChanged = response.subscription?.plan_changed;

      // Valider que l'URL de checkout pointe bien vers Stripe
      const isValidStripeUrl = (url: string): boolean => {
        try {
          const parsed = new URL(url);
          return parsed.hostname.endsWith('stripe.com');
        } catch {
          return false;
        }
      };

      if (checkoutUrl && isValidStripeUrl(checkoutUrl)) {
        // Sauvegarder l'ID d'abonnement pour l'activation
        if (subscriptionId) {
          try { localStorage.setItem('pending_subscription_id', subscriptionId); } catch {}
        }

        // Rediriger vers Stripe pour le paiement
        window.location.href = checkoutUrl;
      } else if (planChanged) {
        // Changement de plan immédiat (upgrade/downgrade sans nouveau paiement)
        await loadPaymentData();
        setIsPaymentDialogOpen(false);
        toast({
          title: "Plan modifié ! 🎉",
          description: `Votre abonnement a été mis à jour vers le plan ${selectedPlan.name}.`,
        });
        if (onPlanSelected) {
          onPlanSelected(selectedPlanId);
        }
      } else {

        // Fallback: créer l'abonnement directement si pas d'URL Stripe
        const subscriptionResponse = await apiService.createSubscription({
          plan_id: selectedPlanId,
          auto_renew: true,
          payment_method: {
            type: "card",
            card_number: "4242424242424242",
            exp_month: "12",
            exp_year: "2030",
            cvc: "123",
            name: "Test User"
          }
        });

        const subId = (subscriptionResponse as any)?.subscription?.id || (subscriptionResponse as any)?.subscription?.subscription?.id;

        if (subId) {
          try { localStorage.setItem('pending_subscription_id', subId); } catch {}

          // Activer immédiatement en fallback
          await apiService.activateSubscription(subId);
          await loadPaymentData();

          setIsPaymentDialogOpen(false);
          toast({
            title: "Abonnement activé ! 🎉",
            description: `Votre abonnement ${selectedPlan.name} a été activé avec succès.`,
          });

          if (onPlanSelected) {
            onPlanSelected(selectedPlanId);
          }
        } else {
          throw new Error('Impossible de créer l\'abonnement');
        }
      }

    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: error instanceof Error ? error.message : "Erreur inattendue",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Vérifier si on revient d'un paiement réussi
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Recharger les données pour voir le nouvel abonnement
      loadPaymentData();
      
      toast({
        title: "Paiement réussi ! 🎉",
        description: "Votre abonnement a été activé avec succès.",
      });
    } else if (urlParams.get('canceled') === 'true') {
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: "Paiement annulé",
        description: "Vous avez annulé le processus de paiement.",
      });
    }
  }, [loadPaymentData, toast]);

  const formatPrice = (price: number) => {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '€';
    return price === 0 ? 'Gratuit' : `${price}${currency}`;
  };

  const isCurrentPlan = (planId: string) => {
    return currentPlan?.id === planId;
  };

  // const getPlanIcon = (planId: string) => {
  //   switch (planId) {
  //     case 'free':
  //       return <Users className="h-5 w-5" />;
  //     case 'standard':
  //       return <BarChart3 className="h-5 w-5" />;
  //     case 'premium':
  //       return <Crown className="h-5 w-5" />;
  //     case 'pro':
  //       return <Zap className="h-5 w-5" />;
  //     default:
  //       return <Star className="h-5 w-5" />;
  //   }
  // };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanBorderColor = (planId: string) => {
    // Toutes les bordures en bleu (couleur primaire)
    return 'border-primary';
  };

  if (plans.length === 0) {
    return (
      <div className={`p-2 sm:p-4 ${className}`}>
        <PricingSkeletonLoader />
      </div>
    );
  }

  return (
    <div className={`plan-selector ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Choisissez votre plan
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez le plan qui correspond le mieux à vos besoins
        </p>
        <p className="text-sm font-medium text-primary mt-1">
          7 jours d'essai gratuit inclus avec le plan Starter
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8 w-full overflow-x-auto pt-5">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative rounded-xl transition-all duration-200 hover:shadow-md flex flex-col h-full ${
              isCurrentPlan(plan.id)
                ? 'border-2 border-primary shadow-md bg-card'
                : 'border border-border bg-card shadow-sm'
            }`}
          >
            {/* Badge recommandé */}
            {plan.id === 'standard' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-3 py-0.5 rounded-full">
                  Recommandé
                </Badge>
              </div>
            )}

            {/* Badge plan actuel */}
            {isCurrentPlan(plan.id) && showCurrentPlan && (
              <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                  ✓ Plan actuel
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
              <div className="mt-2 flex items-baseline justify-center gap-1 flex-wrap">
                <span className="text-2xl font-bold text-foreground whitespace-nowrap">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  /{plan.interval}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                {/* Quotas clairs et explicites */}
                <div className="space-y-2.5 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Analyses mensuelles</span>
                    <span className="font-bold text-foreground">
                      {getPlanMaxAnalyses(plan)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Domaines / Rapports</span>
                    <span className="font-bold text-foreground">
                      {getPlanMaxReports(plan)}
                    </span>
                  </div>
                </div>

                {/* Modèles IA audités */}
                {(() => {
                  const planIndex = plans.indexOf(plan);
                  const aiModels = getAiModelsForPlan(plan.id) || (AI_MODELS_CONFIG[Math.min(planIndex, AI_MODELS_CONFIG.length - 1)] ? { web: AI_MODELS_CONFIG[Math.min(planIndex, AI_MODELS_CONFIG.length - 1)].web, api: AI_MODELS_CONFIG[Math.min(planIndex, AI_MODELS_CONFIG.length - 1)].api } : null);
                  if (!aiModels) return null;
                  return (
                    <div className="pt-3 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Modèles IA Audités</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{aiModels.web.length} moteurs</span>
                      </div>

                      {/* Web UI scraping */}
                      {aiModels.web.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-foreground">Moteurs génératifs</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">Web</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {aiModels.web.map((model) => (
                              <img
                                key={model}
                                src={modelLogos[model]}
                                alt={model}
                                className="h-5 w-5 object-contain"
                                title={model.charAt(0).toUpperCase() + model.slice(1)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* API Machine-to-Machine */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground">Accès API programmatique</span>
                          <Badge variant={aiModels.api.length > 0 ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                            {aiModels.api.length > 0 ? 'Inclus' : 'Option'}
                          </Badge>
                        </div>
                        {aiModels.api.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {aiModels.api.map((model) => (
                              <img
                                key={model}
                                src={modelLogos[model]}
                                alt={model}
                                className="h-5 w-5 object-contain"
                                title={model.charAt(0).toUpperCase() + model.slice(1)}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Disponible à partir du plan Pro
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Liste des fonctionnalités */}
                <div className="space-y-2 pt-4 border-t border-border">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bouton d'action - aligné en bas */}
              <Button 
                className="w-full mt-6"
                onClick={() => handlePlanSelection(plan.id)}
                disabled={isCurrentPlan(plan.id) || isProcessing}
                variant={isCurrentPlan(plan.id) ? 'default' : isDowngrade(plan.id) ? 'outline' : 'default'}
              >
                {isCurrentPlan(plan.id) ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Plan actuel
                  </>
                ) : isDowngrade(plan.id) ? (
                  'Changer de plan'
                ) : (
                  <>
                    {plan.id === 'free'
                    ? 'Commencer gratuitement'
                    : plan.id === 'solo'
                    ? 'Essayer 7 jours gratuits'
                    : "S'abonner"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de confirmation rétrogradation */}
      <Dialog open={isDowngradeDialogOpen} onOpenChange={setIsDowngradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirmer le changement de plan
            </DialogTitle>
            <DialogDescription className="pt-2">
              Vous êtes sur le point de passer à un plan inférieur.{' '}
              <strong>Vous perdrez l'accès à certaines fonctionnalités avancées</strong> dès la prochaine période de facturation.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 mt-2">
            Plan cible : <strong>{plans.find(p => p.id === pendingDowngradePlanId)?.name || pendingDowngradePlanId}</strong>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDowngradeDialogOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={confirmDowngrade} className="flex-1">
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de paiement Stripe Checkout */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Finaliser le paiement
            </DialogTitle>
            <DialogDescription>
              Vous vous abonnez au plan {plans.find(p => p.id === selectedPlanId)?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center space-y-4">
              {selectedPlanId === 'solo' && (
                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    7 jours d'essai gratuit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Aucun débit pendant l'essai. Annulez à tout moment.
                  </p>
                </div>
              )}
              <div className="p-4 bg-muted/40 border border-border rounded-lg">
                <p className="text-sm text-foreground mb-2">
                  Vous allez être redirigé vers la page de paiement sécurisée de Stripe
                </p>
                <p className="text-xs text-muted-foreground">
                  Vos informations de paiement seront traitées de manière sécurisée
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsPaymentDialogOpen(false)}
                className="flex-1"
                disabled={isProcessingPayment}
              >
                Annuler
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="flex-1"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
};

export default PlanSelector;
