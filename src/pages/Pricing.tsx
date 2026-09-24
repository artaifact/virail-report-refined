import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import PlanSelector from '@/components/PlanSelector';
import UsageQuota from '@/components/UsageQuota';
import ErrorHandler, { createPaymentError } from '@/components/ErrorHandler';
import { usePayment } from '@/hooks/usePayment';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

const Pricing: React.FC = () => {
  usePageTitle('Tarifs');
  const { error: paymentCtxError, loadPaymentData } = usePayment() as any;
  const [paymentError, setPaymentError] = useState<any>(null);
  const { toast } = useToast();

  const handlePlanSelected = (planId: string) => {
    // Logique de sélection de plan
  };

  const handleErrorDismiss = () => {
    setPaymentError(null);
  };

  const handleErrorUpgrade = () => {
    window.location.href = '/pricing';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 w-full max-w-[1700px] mx-auto space-y-6 font-sans">
      {/* Top Header Épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>Abonnement & Formules</span>
          <InfoTooltip
            title="Formules & Souscriptions"
            content="Choisissez la formule adaptée à vos besoins d'optimisation GEO et débloquez les fonctionnalités agentiques."
          />
        </h1>
      </div>

      {/* Gestionnaire d'erreurs */}
      {paymentError && (
        <div className="bg-card border border-border/70 rounded-xl shadow-xs p-4 mb-4">
          <ErrorHandler
            error={paymentError}
            onDismiss={handleErrorDismiss}
            onUpgrade={handleErrorUpgrade}
          />
        </div>
      )}

      {/* Sélecteur de plans */}
      <div className="w-full">
        <PlanSelector
          onPlanSelected={handlePlanSelected}
          showCurrentPlan={true}
        />
      </div>
    </div>
  );
};

export default Pricing;
