import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';
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

  const getTimeSpent = () => {
    const startTime = startTimes[5] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const handleNext = async () => {
    try {
      await completeStep('results', 5, getTimeSpent());
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
    }
  };

  const handleBack = () => {
    navigate('/onboarding/prompts');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-slate-900">Aperçu de votre configuration</h1>
        <p className="text-slate-600 text-lg">
          Vérifiez les informations que vous avez saisies avant de continuer
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuration du compte</CardTitle>
            <CardDescription>Type de compte sélectionné</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-slate-700">Compte configuré</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projet</CardTitle>
            <CardDescription>Informations sur votre marque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-slate-700">Projet configuré</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thématiques</CardTitle>
            <CardDescription>Sujets sélectionnés pour l'analyse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-slate-700">Thématiques sélectionnées</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prompts</CardTitle>
            <CardDescription>Questions de test configurées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-slate-700">Prompts sélectionnés</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: '1px', borderStyle: 'solid' }}>
        <p className="text-sm text-slate-700">
          <strong>Prochaine étape :</strong> Vous allez choisir votre plan d'abonnement pour commencer à utiliser Viraill.
        </p>
      </div>

      <div className="flex items-center justify-between pt-6">
        <Button
          onClick={handleBack}
          variant="outline"
          className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>
        <Button
          onClick={handleNext}
          className="px-8 py-6 text-base font-semibold transition-all text-white shadow-[0_4px_6px_-1px_rgba(59,130,246,0.3),0_2px_4px_-1px_rgba(59,130,246,0.2)] hover:shadow-[0_10px_15px_-3px_rgba(59,130,246,0.4),0_4px_6px_-2px_rgba(59,130,246,0.2)]"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
          }}
        >
          Continuer
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

