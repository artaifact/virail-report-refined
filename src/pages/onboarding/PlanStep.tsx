import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';
import { usePayment } from '@/hooks/usePayment';

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
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPaymentData();
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
      await completeStep('plan', 6, getTimeSpent());
      const allStepsCompleted = ['setup', 'project', 'topics', 'prompts', 'results', 'plan'];
      await completeOnboarding(allStepsCompleted, getTimeSpent());
      await refreshStatus();
      
      toast({
        title: 'Onboarding terminé !',
        description: 'Bienvenue sur Viraill !',
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

  const handleBack = () => {
    navigate('/onboarding/results');
  };

  const formatPriceClean = (price: number) => {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '€';
    if (price === 0) return 'Gratuit';
    const cleanPrice = price % 1 === 0 ? Math.floor(price) : price;
    return `${cleanPrice}${currency}`;
  };

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }}></div>
          <p className="text-slate-600">Chargement des plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-slate-900">
          Choisissez votre plan
        </h1>
        <p className="text-slate-600 text-lg">
          Commencez gratuitement ou choisissez un plan adapté à vos besoins
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isRecommended = plan.id === 'standard';
          
          return (
            <Card
              key={plan.id}
              className={cn(
                'relative cursor-pointer transition-all duration-200',
                isSelected
                  ? 'border-2 shadow-lg'
                  : 'border border-slate-200 hover:border-slate-300 hover:shadow-md'
              )}
              style={isSelected ? {
                borderColor: '#3B82F6'
              } : undefined}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="text-white px-4 py-1 rounded-full text-xs font-semibold" style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
                  }}>
                    Recommandé
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-4 pt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {plan.name}
                </h3>
                
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span className="text-4xl font-bold text-slate-900">
                    {formatPriceClean(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-500 text-sm">
                      /{plan.interval === 'month' ? 'mois' : 'an'}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-6">
                {/* Quotas principaux */}
                <div className="space-y-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Analyses</span>
                    <span className="font-semibold text-slate-900">
                      {(plan as any).max_analyses === -1 ? 'Illimité' : `${(plan as any).max_analyses || 0}/mois`}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Rapports</span>
                    <span className="font-semibold text-slate-900">
                      {(plan as any).max_reports === -1 ? 'Illimité' : `${(plan as any).max_reports || 0}/mois`}
                    </span>
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#3B82F6' }} />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Bouton */}
                <Button
                  className={cn(
                    "w-full font-semibold transition-all mt-4",
                    isSelected
                      ? "text-white shadow-lg"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  )}
                  style={isSelected ? {
                    background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
                  } : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                >
                  {isSelected ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Sélectionné
                    </>
                  ) : (
                    'Sélectionner'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-8">
        <Button
          onClick={handleBack}
          variant="outline"
          className="px-8 py-6 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Précédent
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isSubmitting}
          className={cn(
            "px-10 py-6 text-base font-bold transition-all",
            !isSubmitting
              ? "text-white shadow-[0_8px_16px_-4px_rgba(59,130,246,0.4)] hover:shadow-[0_16px_24px_-8px_rgba(59,130,246,0.5)] hover:scale-105"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          )}
          style={!isSubmitting ? {
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
          } : undefined}
        >
          {isSubmitting ? 'Finalisation...' : 'Terminer l\'onboarding'}
          {!isSubmitting && <ChevronRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}

