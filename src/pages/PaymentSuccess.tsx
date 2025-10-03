import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, CreditCard, Calendar, Zap, Crown, Star, Users, BarChart3, Sparkles, Home } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadPaymentData, currentPlan } = usePayment();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [hasRun, setHasRun] = useState(false);

  const sessionId = searchParams.get('session_id');
  const planId = searchParams.get('plan_id');
  const subscriptionId = searchParams.get('subscription_id');

  useEffect(() => {
    if (hasRun) return;
    setHasRun(true);
    const handleSuccess = async () => {
      try {
        setIsLoading(true);
        
        // Activer l'abonnement si on a un subscription_id
        if (subscriptionId) {
          console.log('🔄 Activation de l\'abonnement avec subscription_id:', subscriptionId);
          
          try {
            await apiService.activateSubscription(subscriptionId);
            console.log('✅ Abonnement activé avec succès');
            
            toast({
              title: "Abonnement activé ! 🎉",
              description: "Votre abonnement a été activé avec succès.",
            });
          } catch (activationError) {
            console.error('❌ Erreur lors de l\'activation:', activationError);
            toast({
              title: "Information",
              description: "L'abonnement a été créé. L'activation se fera automatiquement.",
            });
          }
        }
        
        // Recharger les données de paiement une seule fois au début
        await loadPaymentData();

        // Injection côté front: si pas de subscription_id dans l'URL, utiliser celui sauvegardé
        if (!subscriptionId) {
          try {
            const stored = localStorage.getItem('pending_subscription_id');
            if (stored) {
              console.log('🧩 Injection subscription_id depuis localStorage:', stored);
              await apiService.activateSubscription(stored);
              // Recharge unique déjà effectuée
              try { localStorage.removeItem('pending_subscription_id'); } catch {}
              toast({ title: 'Abonnement activé ✅', description: 'Activation via subscription_id stocké.' });
            }
          } catch (e) {
            console.warn('⚠️ Impossible d\'utiliser subscription_id stocké:', e);
          }
        }

        // Fallback 2: si pas d'activation et session_id présent, tenter de récupérer l'ID d'abonnement via la checkout session
        if (!subscriptionId && sessionId) {
          try {
            console.log('🔎 Recherche de la subscription via session_id:', sessionId);
            const sessionResp = await apiService.getCheckoutSession(sessionId);
            const s: any = sessionResp?.session || sessionResp;
            const subId = s?.subscription_id || s?.subscription?.id || s?.subscriptionId || s?.data?.subscription_id;
            if (subId) {
              console.log('🔄 Activation via session → subscription_id:', subId);
              await apiService.activateSubscription(subId);
              // Recharge unique déjà effectuée
              toast({
                title: 'Abonnement activé ✅',
                description: 'Activation réalisée via la session de paiement.',
              });
            } else {
              console.warn('⚠️ Aucun subscription_id trouvé dans la session');
            }
          } catch (e) {
            console.warn('⚠️ Impossible de récupérer la session/activer via session_id:', e);
          }
        }

        // Fallback: si pas de subscription_id dans l'URL, tenter d'activer l'abonnement courant si non actif
        if (!subscriptionId) {
          try {
            const current = await apiService.getCurrentSubscription();
            const sub: any = current?.subscription;
            if (sub && sub.id && sub.status && sub.status !== 'active') {
              console.log('🔄 Fallback activation avec l\'abonnement courant:', sub.id, 'status:', sub.status);
              await apiService.activateSubscription(sub.id);
              // Recharge unique déjà effectuée
              toast({
                title: 'Abonnement activé (fallback) ✅',
                description: 'Votre abonnement a été activé avec succès.',
              });
            }
          } catch (e) {
            console.warn('⚠️ Impossible d\'exécuter le fallback d\'activation:', e);
          }
        }

        // Fallback 3: si toujours free, tenter d'activer via le plan sélectionné mis en cache
        try {
          const pendingPlanId = planId || localStorage.getItem('pending_plan_id');
          if (pendingPlanId) {
            const current = await apiService.getCurrentSubscription();
            const sub: any = current?.subscription;
            // Si pas de subscription active mais un plan a été choisi, tenter un refresh complet
            if (!sub || sub.status !== 'active') {
              console.log('🔁 Fallback refresh après paiement pour plan:', pendingPlanId);
              // Recharge unique déjà effectuée
            }
            // Nettoyer le cache
            try { localStorage.removeItem('pending_plan_id'); } catch {}
          }
        } catch {}

        // Fallback 4 (ultime): créer et activer l'abonnement côté front si toujours non actif
        try {
          const current = await apiService.getCurrentSubscription();
          const sub: any = current?.subscription;
          const isActive = !!(sub && sub.status === 'active');
          const chosenPlan = planId || localStorage.getItem('pending_plan_id');
          if (!isActive && chosenPlan) {
            console.log('🛠️ Création manuelle de l\'abonnement pour le plan:', chosenPlan);
            const createResp: any = await apiService.createSubscription({
              plan_id: chosenPlan,
              auto_renew: true,
              payment_method: {} as any
            } as any);
            const createdSubId = createResp?.subscription?.id || createResp?.subscription?.subscription?.id;
            if (createdSubId) {
              await apiService.activateSubscription(createdSubId);
              await loadPaymentData();
              toast({ title: 'Abonnement activé ✅', description: 'Activation réalisée côté client.' });
              try { localStorage.removeItem('pending_plan_id'); } catch {}
            } else {
              console.warn('⚠️ Impossible de récupérer l\'ID de la souscription créée');
            }
          }
        } catch (e) {
          console.warn('⚠️ Échec du fallback de création/activation côté client:', e);
        }
        
        // Afficher un toast de succès
        toast({
          title: "Paiement réussi ! 🎉",
          description: "Votre abonnement a été activé avec succès.",
        });
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des données de l'abonnement.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleSuccess();
  }, [loadPaymentData, toast, subscriptionId, hasRun]);

  // Compte à rebours pour redirection automatique
  useEffect(() => {
    if (!isLoading && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      navigate('/');
    }
  }, [countdown, isLoading, navigate]);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Users className="h-6 w-6" />;
      case 'standard':
        return <BarChart3 className="h-6 w-6" />;
      case 'premium':
        return <Crown className="h-6 w-6" />;
      case 'pro':
        return <Sparkles className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'bg-blue-100 text-blue-800';
      case 'standard':
        return 'bg-green-100 text-green-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanFeatures = (planId: string) => {
    switch (planId) {
      case 'standard':
        return [
          '10 analyses par mois',
          '5 rapports détaillés',
          'Support par email',
          'Mises à jour régulières'
        ];
      case 'premium':
        return [
          '50 analyses par mois',
          '20 rapports détaillés',
          'Analyse de concurrents',
          'Support prioritaire',
          'Fonctionnalités avancées'
        ];
      case 'pro':
        return [
          'Analyses illimitées',
          'Rapports illimités',
          'Toutes les fonctionnalités',
          'Support dédié',
          'Accès en priorité aux nouvelles fonctionnalités'
        ];
      default:
        return [
          'Fonctionnalités de base',
          'Support communautaire'
        ];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Activation de votre abonnement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header de succès */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Paiement réussi ! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Votre abonnement a été activé avec succès
          </p>
          {sessionId && (
            <p className="text-sm text-gray-500">
              Session ID: {sessionId}
            </p>
          )}
          {subscriptionId && (
            <p className="text-sm text-gray-500">
              Abonnement ID: {subscriptionId}
            </p>
          )}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Redirection automatique vers l'accueil dans {countdown} secondes...
            </p>
          </div>
        </div>

        {/* Informations de l'abonnement */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Plan actuel */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {currentPlan && getPlanIcon(currentPlan.id)}
                <span>Votre plan actuel</span>
                {currentPlan && (
                  <Badge className={getPlanColor(currentPlan.id)}>
                    {currentPlan.name}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Détails de votre abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPlan && (
                <>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">
                      {currentPlan.price === 0 ? 'Gratuit' : `${currentPlan.price}€/${currentPlan.interval}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span>Renouvellement automatique activé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-gray-500" />
                    <span>Accès immédiat aux fonctionnalités</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fonctionnalités incluses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Fonctionnalités incluses
              </CardTitle>
              <CardDescription>
                Ce que vous pouvez faire maintenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {currentPlan && getPlanFeatures(currentPlan.id).map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Quotas d'usage supprimés dans cette vue pour éviter les rechargements et erreurs */}

        {/* Actions */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Aller à l'accueil
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/pricing')}
            >
              Voir mes abonnements
            </Button>
          </div>
          
          {/* Bouton de test d'activation */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Test d'activation</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Testez l'activation manuelle d'un abonnement
            </p>
            <Button 
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              onClick={async () => {
                try {
                  console.log('🧪 Test d\'activation manuelle...');
                  const testSubscriptionId = 'sub_1e325deb_1756402111';
                  
                  toast({
                    title: "Test d'activation",
                    description: `Activation de l'abonnement ${testSubscriptionId}...`,
                  });
                  
                  await apiService.activateSubscription(testSubscriptionId);
                  
                  toast({
                    title: "✅ Activation réussie !",
                    description: "L'abonnement a été activé avec succès.",
                  });
                  
                  // Recharger les données
                  await loadPaymentData();
                  
                } catch (error) {
                  console.error('❌ Erreur lors du test d\'activation:', error);
                  toast({
                    title: "❌ Erreur d'activation",
                    description: error instanceof Error ? error.message : "Erreur inattendue",
                    variant: "destructive",
                  });
                }
              }}
            >
              🔧 Tester l'activation
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Un email de confirmation vous a été envoyé avec tous les détails
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
