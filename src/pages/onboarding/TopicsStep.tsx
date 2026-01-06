import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';

interface OnboardingContext {
  status: any;
  refreshStatus: () => Promise<void>;
  startTimes: Record<number, number>;
}

const TOPICS = [
  { id: 'reputation', label: 'Gestion de la réputation en ligne' },
  { id: 'marketing', label: 'Marketing digital local' },
  { id: 'communication', label: 'Solutions de communication omnicanale' },
  { id: 'publicite', label: 'Stratégies de publicité locale' },
  { id: 'visibilite', label: 'Visibilité en ligne PME' },
];

export function TopicsStep() {
  const navigate = useNavigate();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTimeSpent = () => {
    const startTime = startTimes[3] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const canProceed = () => {
    return selectedTopics.length > 0;
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      // Sauvegarder l'étape avec les topics sélectionnés dans onboarding_data
      await completeStep('topics', 3, getTimeSpent());

      // TODO: Sauvegarder les topics sélectionnés dans onboarding_data via un endpoint dédié
      // Pour l'instant, ils seront sauvegardés lors de la complétion de l'onboarding

      await refreshStatus();
      navigate('/onboarding/prompts');
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
    navigate('/onboarding/project');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-slate-900">Choisissez vos thématiques</h1>
        <p className="text-slate-600 max-w-xl mx-auto text-lg">
          Sélectionnez les domaines d'expertise sur lesquels vous voulez apparaître dans les réponses des LLM. Nous testerons la visibilité de votre marque sur ces sujets dans ChatGPT, Perplexity, Gemini et autres assistants IA.
        </p>
      </div>

      <div className="text-sm font-medium mb-6 px-4 py-2 rounded-lg inline-block" style={{ color: '#3B82F6', backgroundColor: '#EFF6FF' }}>
        {selectedTopics.length}/{TOPICS.length} sujets sélectionnés
      </div>

      <div className="space-y-3">
        {TOPICS.map((topic) => {
          const isSelected = selectedTopics.includes(topic.id);
          return (
            <div
              key={topic.id}
              className={cn(
                'flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-md',
                isSelected
                  ? 'shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
              style={isSelected ? {
                borderColor: '#3B82F6',
                background: 'linear-gradient(90deg, #EFF6FF 0%, #E0E7FF 100%)'
              } : undefined}
              onClick={() => toggleTopic(topic.id)}
            >
              <div className="flex-shrink-0">
                {isSelected ? (
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center shadow-md" style={{ backgroundColor: '#3B82F6' }}>
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-lg border-2 border-slate-300 bg-slate-50" />
                )}
              </div>
              <span className={cn(
                "flex-1 font-medium",
                isSelected ? 'text-slate-900' : 'text-slate-700'
              )}>{topic.label}</span>
            </div>
          );
        })}
      </div>

      <button className="text-sm font-medium flex items-center gap-2 transition-colors" style={{ color: '#3B82F6' }} onMouseEnter={(e) => e.currentTarget.style.color = '#2563EB'} onMouseLeave={(e) => e.currentTarget.style.color = '#3B82F6'}>
        <span className="text-lg">+</span> Ajouter un sujet personnalisé
      </button>

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
          disabled={!canProceed() || isSubmitting}
          className={cn(
            "px-8 py-6 text-base font-semibold transition-all",
            canProceed() && !isSubmitting
              ? "text-white shadow-[0_4px_6px_-1px_rgba(59,130,246,0.3),0_2px_4px_-1px_rgba(59,130,246,0.2)] hover:shadow-[0_10px_15px_-3px_rgba(59,130,246,0.4),0_4px_6px_-2px_rgba(59,130,246,0.2)]"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          )}
          style={canProceed() && !isSubmitting ? {
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
          } : undefined}
        >
          Suivant
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

