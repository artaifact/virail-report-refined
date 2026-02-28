import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayment } from '@/hooks/usePayment';
import { Crown, Star, Zap, Check, CreditCard, Users, BarChart3, Shield, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { modelLogos } from '@/components/ModelLogosCarousel';

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
    ids: ['starter', 'standard'],
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
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    // Charger seulement si les données ne sont pas déjà disponibles
    if (!currentPlan || !usageLimits) {
      loadPaymentData();
    }
  }, []); // Dépendances vides pour éviter les re-renders

  const handlePlanSelection = (planId: string) => {
    if (planId === 'free') {
      // Plan gratuit - pas de paiement nécessaire
      if (onPlanSelected) {
        onPlanSelected(planId);
      }
      return;
    }

    setSelectedPlanId(planId);
    try { localStorage.setItem('pending_plan_id', planId); } catch {}
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

     //console.log('💳 Création de la session de paiement Stripe pour le plan:', selectedPlanId);

      // Créer la Checkout Session côté backend
      const response = await apiService.createCheckoutSession(
        selectedPlanId,
        `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        `${window.location.origin}/pricing?canceled=true`
      );

     //console.log('📡 Réponse de l\'API:', response);

      // Extraire l'URL de checkout de la réponse
      const checkoutUrl = response.subscription?.checkout_url;
      const subscriptionId = response.subscription?.subscription?.id;

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
      } else {
       //console.log('⚠️ Pas d\'URL de redirection, tentative de création directe');

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
         //console.log('🔧 Abonnement créé en fallback:', subId);
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
  //       return <Sparkles className="h-5 w-5" />;
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
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`plan-selector ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choisissez votre plan
        </h2>
        <p className="text-lg text-gray-600">
          Sélectionnez le plan qui correspond le mieux à vos besoins
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative bg-white border border-primary rounded-xl transition-all duration-200 hover:shadow-sm flex flex-col h-full ${
              isCurrentPlan(plan.id) ? 'ring-2 ring-primary' : ''
            }`}
          >
            {/* Badge recommandé */}
            {plan.id === 'standard' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Recommandé
              </div>
            )}

            {/* Badge plan actuel */}
            {isCurrentPlan(plan.id) && showCurrentPlan && (
              <div className="absolute -top-3 right-4 z-10">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-md">
                  Plan actuel
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              {/* <div className="flex items-center justify-center mb-2">
                {(plan.id)}
              </div> */}
              <CardTitle className="text-xl font-bold text-neutral-900">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-neutral-600 ml-1">
                  /{plan.interval}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                {/* Fonctionnalités principales */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {plan.maxAnalyses === -1 ? '∞' : plan.maxAnalyses}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {plan.maxReports === -1 ? '∞' : plan.maxReports} 
                    </span>
                  </div>
                  
                </div>

                {/* AI Models */}
                {(() => {
                  const planIndex = plans.indexOf(plan);
                  const aiModels = getAiModelsForPlan(plan.id) || (AI_MODELS_CONFIG[Math.min(planIndex, AI_MODELS_CONFIG.length - 1)] ? { web: AI_MODELS_CONFIG[Math.min(planIndex, AI_MODELS_CONFIG.length - 1)].web, api: AI_MODELS_CONFIG[Math.min(planIndex, AI_MODELS_CONFIG.length - 1)].api } : null);
                  if (!aiModels) return null;
                  return (
                    <div className="pt-4 border-t border-primary space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">AI Models</span>
                      </div>

                      {/* Web UI scraping */}
                      {aiModels.web.length > 0 && (
                        <div className="space-y-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">Web UI</Badge>
                          <div className="flex items-center gap-2 flex-wrap">
                            {aiModels.web.map((model) => (
                              <img
                                key={model}
                                src={modelLogos[model]}
                                alt={model}
                                className="h-6 w-6 object-contain"
                                title={model.charAt(0).toUpperCase() + model.slice(1)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* API */}
                      <div className="space-y-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">+ API</Badge>
                        {aiModels.api.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {aiModels.api.map((model) => (
                              <img
                                key={model}
                                src={modelLogos[model]}
                                alt={model}
                                className="h-6 w-6 object-contain"
                                title={model.charAt(0).toUpperCase() + model.slice(1)}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">Plan supérieur</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Liste des fonctionnalités */}
                <div className="space-y-2 pt-4 border-t border-primary">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bouton d'action - aligné en bas */}
              <Button 
                className={`w-full mt-6 ${
                  isCurrentPlan(plan.id) 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
                onClick={() => handlePlanSelection(plan.id)}
                disabled={isCurrentPlan(plan.id) || isProcessing}
              >
                {isCurrentPlan(plan.id) ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Plan actuel
                  </>
                ) : (
                  <>
                    {plan.id === 'free' ? 'Commencer gratuitement' : 'Choisir ce plan'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Vous allez être redirigé vers la page de paiement sécurisée de Stripe
                </p>
                <p className="text-xs text-gray-500">
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
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
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
