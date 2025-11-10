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
      let activationSuccess = false;
      
      try {
        setIsLoading(true);
        
        // Fonction helper pour activer un abonnement avec vérification
        const tryActivateSubscription = async (subId: string, source: string): Promise<boolean> => {
          try {
            // Vérifier d'abord si l'abonnement est déjà actif
            const current = await apiService.getCurrentSubscription();
            const sub: any = current?.subscription;
            
            if (sub && sub.id === subId && sub.status === 'active') {
             //console.log(`✅ Abonnement ${subId} déjà actif (source: ${source})`);
              return true;
            }
            
           //console.log(`🔄 Tentative d'activation de l'abonnement ${subId} (source: ${source})`);
            await apiService.activateSubscription(subId);
           //console.log(`✅ Abonnement ${subId} activé avec succès`);
            return true;
          } catch (error) {
            console.error(`❌ Erreur lors de l'activation de ${subId} (source: ${source}):`, error);
            return false;
          }
        };
        
        // Méthode 1: Activation via subscription_id dans l'URL
        if (subscriptionId) {
          activationSuccess = await tryActivateSubscription(subscriptionId, "URL parameter");
        }

        // Méthode 2: Activation via subscription_id dans localStorage
        if (!activationSuccess) {
          try {
            const stored = localStorage.getItem('pending_subscription_id');
            if (stored) {
             //console.log('🧩 Tentative d\'activation via subscription_id stocké:', stored);
              activationSuccess = await tryActivateSubscription(stored, "localStorage");
            }
          } catch (e) {
            console.warn('⚠️ Impossible d\'utiliser subscription_id stocké:', e);
          }
        }

        // Méthode 3: Activation via session_id (récupérer l'abonnement depuis la session)
        if (!activationSuccess && sessionId) {
          try {
           //console.log('🔎 Recherche de la subscription via session_id:', sessionId);
            const sessionResp = await apiService.getCheckoutSession(sessionId);
            const s: any = sessionResp?.session || sessionResp;
            const subId = s?.subscription_id || s?.subscription?.id || s?.subscriptionId || s?.data?.subscription_id;
            if (subId) {
             //console.log('🔄 Tentative d\'activation via session → subscription_id:', subId);
              activationSuccess = await tryActivateSubscription(subId, "checkout session");
            } else {
              console.warn('⚠️ Aucun subscription_id trouvé dans la session');
            }
          } catch (e) {
            console.warn('⚠️ Impossible de récupérer la session/activer via session_id:', e);
          }
        }

        // Méthode 4: Activation de l'abonnement courant si non actif
        if (!activationSuccess) {
          try {
            const current = await apiService.getCurrentSubscription();
            const sub: any = current?.subscription;
            if (sub && sub.id && sub.status && sub.status !== 'active') {
             //console.log('🔄 Tentative d\'activation avec l\'abonnement courant:', sub.id, 'status:', sub.status);
              activationSuccess = await tryActivateSubscription(sub.id, "current subscription");
            }
          } catch (e) {
            console.warn('⚠️ Impossible d\'exécuter le fallback d\'activation:', e);
          }
        }

        // Nettoyer le cache après toutes les tentatives
        try { 
          localStorage.removeItem('pending_subscription_id'); 
          localStorage.removeItem('pending_plan_id'); 
        } catch {}

        // Recharger les données de paiement après toutes les tentatives d'activation
        await loadPaymentData();
        
        // Vérifier le statut final de l'abonnement et afficher le message approprié
        try {
          const current = await apiService.getCurrentSubscription();
          const sub: any = current?.subscription;
          const isActive = !!(sub && sub.status === 'active');
          
          if (isActive) {
            toast({
              title: "Paiement réussi ! 🎉",
              description: "Votre abonnement a été activé avec succès.",
            });
          } else {
            toast({
              title: "Paiement reçu",
              description: "Votre paiement a été traité. L'activation de l'abonnement peut prendre quelques instants. Veuillez rafraîchir la page si nécessaire.",
            });
          }
        } catch (e) {
          console.warn('⚠️ Impossible de vérifier le statut final:', e);
          toast({
            title: "Paiement reçu",
            description: "Votre paiement a été traité. Veuillez rafraîchir la page dans quelques instants pour vérifier votre abonnement.",
          });
        }
        
      } catch (error) {
        console.error('Erreur lors du traitement du paiement:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors du traitement de votre paiement. Veuillez contacter le support si le problème persiste.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleSuccess();
  }, [loadPaymentData, toast, subscriptionId, sessionId, planId, hasRun]);

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
          {/* <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Test d'activation</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Testez l'activation manuelle d'un abonnement
            </p>
            <Button 
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              onClick={async () => {
                try {
                 //console.log('🧪 Test d\'activation manuelle...');
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
          </div> */}
          
          <p className="text-sm text-gray-500">
            Un email de confirmation vous a été envoyé avec tous les détails
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
