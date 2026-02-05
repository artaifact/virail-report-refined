import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';

interface OnboardingContext {
  status: any;
  refreshStatus: () => Promise<void>;
  startTimes: Record<number, number>;
}

export function ResultsStep() {
  const navigate = useNavigate();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTimeSpent = () => {
    const startTime = startTimes[4] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      await completeStep('results', 4, getTimeSpent());
      await refreshStatus();
      navigate('/onboarding/plan');
    } catch (error: any) {
      if (error?.message?.includes('403')) {
        navigate('/', { replace: true });
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible de sauvegarder l'étape",
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/topics');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-meetmind-green-accent/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-meetmind-green-accent" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Tout est prêt !</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Votre configuration est complète. Voici un récapitulatif.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-meetmind-green-accent/30 bg-meetmind-green-accent/5">
          <CheckCircle className="h-6 w-6 text-meetmind-green-accent flex-shrink-0" />
          <div>
            <span className="font-semibold text-foreground block">Compte configuré</span>
            <span className="text-sm text-muted-foreground">Type de compte sélectionné</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-meetmind-green-accent/30 bg-meetmind-green-accent/5">
          <CheckCircle className="h-6 w-6 text-meetmind-green-accent flex-shrink-0" />
          <div>
            <span className="font-semibold text-foreground block">Projet créé</span>
            <span className="text-sm text-muted-foreground">Marque et site web enregistrés</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-meetmind-green-accent/30 bg-meetmind-green-accent/5">
          <CheckCircle className="h-6 w-6 text-meetmind-green-accent flex-shrink-0" />
          <div>
            <span className="font-semibold text-foreground block">Type de site défini</span>
            <span className="text-sm text-muted-foreground">Analyses adaptées à votre activité</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-5 bg-meetmind-primary/5 border border-meetmind-primary/20">
        <p className="text-sm text-foreground">
          <strong className="text-meetmind-primary">Prochaine étape :</strong> Choisissez votre plan pour commencer à analyser votre visibilité sur les LLM.
        </p>
      </div>

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
          onClick={handleNext}
          disabled={isSubmitting}
          className={cn(
            'px-8 py-6 text-base font-semibold transition-all rounded-meetmind-button',
            'text-white bg-meetmind-primary hover:bg-meetmind-soft-blue shadow-[0_4px_6px_-1px_rgba(26,58,255,0.3),0_2px_4px_-1px_rgba(26,58,255,0.2)] hover:shadow-[0_10px_15px_-3px_rgba(26,58,255,0.4),0_4px_6px_-2px_rgba(26,58,255,0.2)]'
          )}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              <span className="opacity-80">Continuer</span>
            </>
          ) : (
            <>
              Voir les plans
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
