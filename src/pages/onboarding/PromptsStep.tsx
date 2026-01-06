import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
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

const PROMPTS_BY_TOPIC: Record<string, Array<{ id: string; text: string }>> = {
  reputation: [
    { id: 'rep1', text: 'Outils de surveillance de réputation en ligne pour PME' },
    { id: 'rep2', text: 'Conseils pour une bonne gestion des commentaires clients en ligne' },
    { id: 'rep3', text: 'Comment protéger l\'image de ma marque sur les réseaux sociaux ?' },
    { id: 'rep4', text: 'Comment gérer les avis négatifs sur ma fiche Google?' },
    { id: 'rep5', text: 'Quelles stratégies pour améliorer la e-réputation de mon commerce ?' },
  ],
  marketing: [
    { id: 'mkt1', text: 'Stratégies de marketing digital pour PME locales' },
    { id: 'mkt2', text: 'Comment améliorer ma visibilité locale en ligne ?' },
    { id: 'mkt3', text: 'Outils de marketing digital pour commerces locaux' },
    { id: 'mkt4', text: 'Techniques de référencement local pour PME' },
    { id: 'mkt5', text: 'Comment créer une présence digitale locale efficace ?' },
  ],
  communication: [
    { id: 'com1', text: 'Solutions de communication omnicanale pour PME' },
    { id: 'com2', text: 'Comment unifier ma communication sur tous les canaux ?' },
    { id: 'com3', text: 'Outils de communication multicanale' },
    { id: 'com4', text: 'Stratégies de communication intégrée' },
    { id: 'com5', text: 'Comment gérer la cohérence de ma communication ?' },
  ],
  publicite: [
    { id: 'pub1', text: 'Stratégies de publicité locale pour PME' },
    { id: 'pub2', text: 'Comment cibler ma publicité localement ?' },
    { id: 'pub3', text: 'Outils de publicité locale en ligne' },
    { id: 'pub4', text: 'Techniques de publicité géolocalisée' },
    { id: 'pub5', text: 'Comment optimiser mon budget publicitaire local ?' },
  ],
  visibilite: [
    { id: 'vis1', text: 'Comment améliorer ma visibilité en ligne en tant que PME ?' },
    { id: 'vis2', text: 'Stratégies de visibilité digitale pour commerces locaux' },
    { id: 'vis3', text: 'Outils pour augmenter la visibilité en ligne' },
    { id: 'vis4', text: 'Techniques de référencement local' },
    { id: 'vis5', text: 'Comment apparaître dans les résultats de recherche locaux ?' },
  ],
};

export function PromptsStep() {
  const navigate = useNavigate();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les topics sélectionnés depuis l'étape précédente
  // Pour l'instant, on affiche tous les topics, mais idéalement on devrait les récupérer depuis le contexte ou le store
  const selectedTopics = ['reputation', 'marketing', 'communication', 'publicite', 'visibilite']; // TODO: Récupérer depuis l'étape précédente

  const getTimeSpent = () => {
    const startTime = startTimes[4] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const togglePrompt = (promptId: string) => {
    setSelectedPrompts((prev) =>
      prev.includes(promptId)
        ? prev.filter((id) => id !== promptId)
        : [...prev, promptId]
    );
  };

  const toggleTopicExpansion = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const getSelectedPromptsCount = () => {
    return selectedPrompts.length;
  };

  const getTotalPromptsCount = () => {
    return Object.values(PROMPTS_BY_TOPIC).flat().length;
  };

  const canProceed = () => {
    return selectedPrompts.length > 0;
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      await completeStep('prompts', 4, getTimeSpent());

      // TODO: Sauvegarder les prompts sélectionnés dans onboarding_data

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
        <h1 className="text-4xl font-bold text-slate-900">Sélectionnez vos prompts de test</h1>
        <p className="text-slate-600 text-lg">
          Choisissez les questions que nous utiliserons pour évaluer la visibilité de votre marque dans les LLM. Ces prompts représentent les requêtes réelles que vos prospects pourraient poser aux assistants IA pour trouver vos services.
        </p>
      </div>

      <div className="text-sm font-medium mb-6 px-4 py-2 rounded-lg inline-block" style={{ color: '#3B82F6', backgroundColor: '#EFF6FF' }}>
        {getSelectedPromptsCount()}/{getTotalPromptsCount()} prompts sélectionnés
      </div>

      <div className="space-y-3">
        {TOPICS.filter((topic) => selectedTopics.includes(topic.id)).map((topic) => {
          const prompts = PROMPTS_BY_TOPIC[topic.id] || [];
          const isExpanded = expandedTopics[topic.id];
          const topicPromptsSelected = prompts.filter((p) => selectedPrompts.includes(p.id)).length;

          return (
            <div key={topic.id} className="border-2 border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => toggleTopicExpansion(topic.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" style={{ color: '#3B82F6' }} />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  )}
                  <span className="font-semibold text-slate-900">{topic.label}</span>
                  <span className="text-sm font-medium px-2.5 py-1 rounded-full" style={{ color: '#3B82F6', backgroundColor: '#EFF6FF' }}>
                    {topicPromptsSelected}/{prompts.length}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/50 p-5 space-y-3">
                  {prompts.map((prompt) => {
                    const isSelected = selectedPrompts.includes(prompt.id);
                    return (
                      <div
                        key={prompt.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all',
                          isSelected
                            ? 'bg-white border-2 border-meetmind-primary shadow-md'
                            : 'bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        )}
                        onClick={() => togglePrompt(prompt.id)}
                      >
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="h-5 w-5 rounded-lg bg-meetmind-primary flex items-center justify-center shadow-sm">
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-lg border-2 border-slate-300 bg-slate-50" />
                          )}
                        </div>
                        <span className={cn(
                          "flex-1 text-sm",
                          isSelected ? 'text-slate-900 font-medium' : 'text-slate-700'
                        )}>{prompt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="text-sm font-medium flex items-center gap-2 transition-colors" style={{ color: '#3B82F6' }} onMouseEnter={(e) => e.currentTarget.style.color = '#2563EB'} onMouseLeave={(e) => e.currentTarget.style.color = '#3B82F6'}>
        <span className="text-lg">+</span> Ajouter un prompt personnalisé
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

