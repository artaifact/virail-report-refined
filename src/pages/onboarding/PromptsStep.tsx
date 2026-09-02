import { useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';

interface OnboardingContext {
  status: any;
  refreshStatus: () => Promise<void>;
  startTimes: Record<number, number>;
}

// Questions simples par type de site
const QUESTIONS_BY_TYPE: Record<string, { id: string; question: string; icon: string }[]> = {
  // E-commerce
  boutique: [
    { id: 'best', question: 'Meilleure boutique pour acheter [produit]', icon: '🏆' },
    { id: 'compare', question: 'Comparatif des sites de [produit]', icon: '⚖️' },
    { id: 'review', question: 'Avis sur [votre marque]', icon: '⭐' },
    { id: 'delivery', question: 'Livraison rapide [produit]', icon: '🚚' },
    { id: 'price', question: 'Où acheter [produit] pas cher', icon: '💰' },
  ],
  marketplace: [
    { id: 'best', question: 'Meilleure marketplace pour [catégorie]', icon: '🏆' },
    { id: 'trust', question: 'Marketplace fiable pour acheter', icon: '✅' },
    { id: 'compare', question: 'Comparatif marketplaces [secteur]', icon: '⚖️' },
    { id: 'seller', question: 'Vendre sur quelle marketplace', icon: '🏪' },
    { id: 'fees', question: 'Frais des marketplaces', icon: '💳' },
  ],
  dropshipping: [
    { id: 'supplier', question: 'Meilleurs fournisseurs dropshipping', icon: '📦' },
    { id: 'niche', question: 'Produits tendance dropshipping', icon: '🔥' },
    { id: 'platform', question: 'Plateforme dropshipping recommandée', icon: '🛒' },
    { id: 'margin', question: 'Marges dropshipping rentables', icon: '💰' },
    { id: 'start', question: 'Comment débuter en dropshipping', icon: '🚀' },
  ],
  subscription: [
    { id: 'best', question: 'Meilleure box [catégorie]', icon: '📬' },
    { id: 'compare', question: 'Comparatif box par abonnement', icon: '⚖️' },
    { id: 'review', question: 'Avis box [votre marque]', icon: '⭐' },
    { id: 'cancel', question: 'Box sans engagement', icon: '🔓' },
    { id: 'gift', question: 'Box cadeau à offrir', icon: '🎁' },
  ],
  b2b: [
    { id: 'supplier', question: 'Fournisseur B2B [secteur]', icon: '🏢' },
    { id: 'wholesale', question: 'Grossiste [produit] professionnel', icon: '📦' },
    { id: 'quote', question: 'Devis [produit] entreprise', icon: '📋' },
    { id: 'bulk', question: 'Achat en gros [produit]', icon: '🛒' },
    { id: 'partner', question: 'Partenaire B2B fiable', icon: '🤝' },
  ],
  luxury: [
    { id: 'auth', question: 'Acheter [marque luxe] authentique', icon: '✨' },
    { id: 'best', question: 'Meilleur site luxe en ligne', icon: '🏆' },
    { id: 'review', question: 'Avis [marque luxe]', icon: '⭐' },
    { id: 'new', question: 'Nouveautés [marque luxe]', icon: '🆕' },
    { id: 'outlet', question: '[Marque luxe] outlet officiel', icon: '💎' },
  ],
  // SaaS
  b2b_saas: [
    { id: 'best', question: 'Meilleur logiciel [fonction]', icon: '🏆' },
    { id: 'compare', question: 'Comparatif [type logiciel]', icon: '⚖️' },
    { id: 'alternative', question: 'Alternative à [concurrent]', icon: '🔄' },
    { id: 'pricing', question: 'Prix [type logiciel]', icon: '💰' },
    { id: 'review', question: 'Avis [votre produit]', icon: '⭐' },
  ],
  // Default
  default: [
    { id: 'best', question: 'Meilleur [votre service]', icon: '🏆' },
    { id: 'compare', question: 'Comparatif [votre secteur]', icon: '⚖️' },
    { id: 'review', question: 'Avis sur [votre marque]', icon: '⭐' },
    { id: 'price', question: 'Prix [votre service]', icon: '💰' },
    { id: 'near', question: '[Votre service] près de chez moi', icon: '📍' },
  ],
};

export function PromptsStep() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer le type depuis l'étape précédente
  const siteType = searchParams.get('type') || 'default';
  const questions = QUESTIONS_BY_TYPE[siteType] || QUESTIONS_BY_TYPE.default;

  const getTimeSpent = () => {
    const startTime = startTimes[4] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAll = () => {
    setSelectedQuestions(questions.map((q) => q.id));
  };

  const canProceed = () => {
    return selectedQuestions.length > 0;
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      await completeStep('prompts', 4, getTimeSpent());
      await refreshStatus();
      navigate('/onboarding/results');
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
        <div className="w-14 h-14 rounded-2xl bg-meetmind-primary/10 flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-meetmind-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Quelles questions tester ?</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg">
          Sélectionnez les recherches que vos clients font dans <span className="font-semibold text-meetmind-primary">ChatGPT, Perplexity, Gemini</span>...
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium px-4 py-2 rounded-lg bg-meetmind-primary/10 text-meetmind-primary">
          {selectedQuestions.length}/{questions.length} sélectionnées
        </div>
        <button
          onClick={selectAll}
          className="text-sm text-meetmind-primary hover:text-meetmind-soft-blue font-medium"
        >
          Tout sélectionner
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((q) => {
          const isSelected = selectedQuestions.includes(q.id);
          return (
            <div
              key={q.id}
              className={cn(
                'flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all',
                isSelected
                  ? 'shadow-md border-meetmind-primary bg-meetmind-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm'
              )}
              onClick={() => toggleQuestion(q.id)}
            >
              <div className="flex-shrink-0">
                {isSelected ? (
                  <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center shadow-md">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
              <span className="text-xl">{q.icon}</span>
              <span className={cn(
                'flex-1 font-medium',
                isSelected ? 'text-foreground' : 'text-foreground/70'
              )}>
                "{q.question}"
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Vous pourrez personnaliser ces questions avec votre marque après l'onboarding
      </p>

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
          disabled={!canProceed() || isSubmitting}
          className={cn(
            'px-8 py-6 text-base font-semibold transition-all rounded-meetmind-button',
            canProceed() && !isSubmitting
              ? 'text-white bg-meetmind-primary hover:bg-meetmind-soft-blue shadow-[0_4px_6px_-1px_rgba(26,58,255,0.3),0_2px_4px_-1px_rgba(26,58,255,0.2)] hover:shadow-[0_10px_15px_-3px_rgba(26,58,255,0.4),0_4px_6px_-2px_rgba(26,58,255,0.2)]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              <span className="opacity-80">Continuer</span>
            </>
          ) : (
            <>
              Continuer
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
