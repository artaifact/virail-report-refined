import React from 'react';
import PlanSelector from '@/components/PlanSelector';
import UsageQuota from '@/components/UsageQuota';
import ErrorHandler, { createPaymentError } from '@/components/ErrorHandler';
import { usePayment } from '@/hooks/usePayment';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

const Pricing: React.FC = () => {
  const { error: paymentCtxError, loadPaymentData } = usePayment() as any;
  const [paymentError, setPaymentError] = useState<any>(null);
  const { toast } = useToast();

  const handlePlanSelected = (planId: string) => {
    console.log('Plan sélectionné:', planId);
    // Ici vous pouvez ajouter une logique supplémentaire si nécessaire
  };

  const handleErrorDismiss = () => {
    setPaymentError(null);
    // resetError non disponible dans le contexte actuel
  };

  const handleErrorUpgrade = () => {
    // Navigation vers les plans
    window.location.href = '/pricing';
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-background text-foreground">
      <div className="mb-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Plans et Tarifs</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan qui correspond le mieux à vos besoins. Tous nos plans incluent un support client et des mises à jour régulières.
          </p>
        </div>
      </div>
      {/* <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Plans et Tarifs
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choisissez le plan qui correspond le mieux à vos besoins. Tous nos plans incluent un support client et des mises à jour régulières.
        </p>
      </div> */}

      {/* Gestionnaire d'erreurs */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <ErrorHandler
          error={paymentError}
          onDismiss={handleErrorDismiss}
          onUpgrade={handleErrorUpgrade}
        />
      </div>

      {/* Sélecteur de plans */}
      <section className="bg-card border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Choisissez votre plan</h2>
          <p className="text-sm text-muted-foreground">Passez à un plan supérieur pour lever vos limites d'usage.</p>
        </div>
        <div className="p-5">
        <PlanSelector 
          onPlanSelected={handlePlanSelected}
          showCurrentPlan={true}
        />
        </div>
      </section>

      {/* Quotas d'usage */}
      <section className="mt-12 bg-card border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Quotas d'usage</h2>
          <p className="text-sm text-muted-foreground">Suivez votre consommation et anticipez les dépassements.</p>
        </div>
        <div className="p-5">
          <UsageQuota 
            showUpgradePrompt={true}
            compact={false}
          />
        </div>
      </section>

      {/* Bouton de test d'activation */}
      {/* <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Test d'activation d'abonnement</h3>
        <p className="text-sm text-blue-700 mb-3">
          Testez l'activation manuelle d'un abonnement en statut "pending"
        </p>
        <Button 
          variant="outline"
          className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
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
      </div> */}
    </div>
  );
};

export default Pricing;
