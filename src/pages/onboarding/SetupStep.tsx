import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { onboardingService } from '@/services/onboardingService';
import { useToast } from '@/hooks/use-toast';

const LLM_MODELS = [
  { name: 'ChatGPT', logo: '/prompt-model-openai-for-light.svg' },
  { name: 'Perplexity', logo: '/prompt-model-perplexity.svg' },
  { name: 'Gemini', logo: '/prompt-model-gemini.svg' },
  { name: 'Claude', logo: '/prompt-model-claude.svg' },
  { name: 'Mistral', logo: '/Mistral.png' },
  { name: 'DeepSeek', logo: '/prompt-model-deepseek.svg' },
  { name: 'Llama', logo: '/prompt-model-llama.svg' },
  { name: 'Grok', logo: '/prompt-model-grok.svg' },
];

interface OnboardingContext {
  status: any;
  refreshStatus: () => Promise<void>;
  startTimes: Record<number, number>;
}

export function SetupStep() {
  const navigate = useNavigate();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<'agency' | 'in-house'>('agency');
  const [agencyName, setAgencyName] = useState('');
  const [agencyUrl, setAgencyUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculer le temps passé
  const getTimeSpent = () => {
    const startTime = startTimes[1] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const canProceed = () => {
    if (accountType === 'agency') {
      const result = agencyName.trim() !== '' && agencyUrl.trim() !== '';
      return result;
    }
    return true;
  };

  const handleNext = async () => {
    
    if (!canProceed()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Sauvegarder l'étape
      await completeStep('setup', 1, getTimeSpent());

      // Sauvegarder les données de compte
      await onboardingService.saveAccountData({
        account_type: accountType === 'agency' ? 'agency' : 'in_house',
        agency_name: accountType === 'agency' ? agencyName.trim() : undefined,
        agency_url: accountType === 'agency' ? agencyUrl.trim() : undefined,
        location_country: 'France', // Valeur par défaut, sera mis à jour à l'étape suivante
        location_country_code: 'FR',
        onboarding_step: 'project',
      });

      await refreshStatus();
      
      navigate('/onboarding/project');
    } catch (error: any) {
      if (error?.message?.includes('403')) {
        // Onboarding déjà complété
        navigate('/', { replace: true });
      } else {
        toast({
          title: 'Erreur',
          description: error?.message || "Impossible de sauvegarder l'étape",
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header avec logos LLM */}
      <div className="text-center space-y-4">
        {/* Logos des modèles LLM */}
        <div className="flex items-center justify-center flex-wrap gap-3 mb-2">
          {LLM_MODELS.map((model) => (
            <div
              key={model.name}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-lg bg-card shadow-sm border border-border flex items-center justify-center p-1.5 hover:shadow-md hover:scale-105 transition-all">
                <img
                  src={model.logo}
                  alt={model.name}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{model.name}</span>
            </div>
          ))}
        </div>

        <h1 className="text-4xl font-bold text-foreground">Bienvenue sur Virail</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Mesurez et optimisez la visibilité de votre marque dans les réponses des <span className="font-semibold text-meetmind-primary">moteurs génératifs IA</span> : ChatGPT, Perplexity, Gemini, Claude et bien d'autres.
        </p>
        <p className="text-muted-foreground/70 text-sm">
          Commençons par configurer votre type de compte
        </p>
      </div>

      <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as 'agency' | 'in-house')}>
        <div className="space-y-4">
          {/* Agency Card */}
          <label
            className={cn(
              'relative flex cursor-pointer rounded-xl border-2 p-6 transition-all shadow-sm hover:shadow-md',
              accountType === 'agency'
                ? 'shadow-lg border-meetmind-primary bg-meetmind-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-md'
            )}
          >
            <RadioGroupItem value="agency" id="agency" className="sr-only" />
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                {accountType === 'agency' ? (
                  <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                )}
                <h3 className="font-bold text-xl text-foreground">Agence</h3>
              </div>
              <p className="text-muted-foreground mb-5 text-base">
                Gérez la visibilité LLM de plusieurs marques clientes et suivez leurs mentions dans ChatGPT, Perplexity, Gemini et Claude.
              </p>
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'agency' ? 'text-meetmind-primary' : 'text-muted-foreground/50'
                  )} />
                  <span>Suivi multi-clients sur tous les modèles IA</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'agency' ? 'text-meetmind-primary' : 'text-muted-foreground/50'
                  )} />
                  <span>Tableaux de bord par marque</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'agency' ? 'text-meetmind-primary' : 'text-muted-foreground/50'
                  )} />
                  <span>Rapports de visibilité LLM exportables</span>
                </div>
              </div>
            </div>
          </label>

          {/* In-house Card */}
          <label
            className={cn(
              'relative flex cursor-pointer rounded-xl border-2 p-6 transition-all shadow-sm hover:shadow-md',
              accountType === 'in-house'
                ? 'shadow-lg border-meetmind-primary bg-meetmind-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-md'
            )}
          >
            <RadioGroupItem value="in-house" id="in-house" className="sr-only" />
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                {accountType === 'in-house' ? (
                  <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                )}
                <h3 className="font-bold text-xl text-foreground">Interne</h3>
              </div>
              <p className="text-muted-foreground mb-5 text-base">
                Optimisez la présence de votre marque dans les réponses de ChatGPT, Perplexity, Gemini et Claude.
              </p>
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'in-house' ? 'text-meetmind-primary' : 'text-muted-foreground/50'
                  )} />
                  <span>Suivi de votre marque sur tous les LLM</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'in-house' ? 'text-meetmind-primary' : 'text-muted-foreground/50'
                  )} />
                  <span>Analytics de citations et mentions IA</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'in-house' ? 'text-meetmind-primary' : 'text-muted-foreground/50'
                  )} />
                  <span>Recommandations GEO personnalisées</span>
                </div>
              </div>
            </div>
          </label>
        </div>
      </RadioGroup>

      {accountType === 'agency' && (
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="agency-name">Nom de votre agence</Label>
            <Input
              id="agency-name"
              placeholder="Ex: Mon Agence Digital"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Le nom de votre agence qui gérera les projets SEO/LLM</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agency-url">Site web de l'agence</Label>
            <Input
              id="agency-url"
              placeholder="mon-agence.com"
              value={agencyUrl}
              onChange={(e) => setAgencyUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">L'URL de votre site web professionnel</p>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6">
          <Button
            onClick={() => {
              handleNext();
            }}
            disabled={!canProceed() || isSubmitting}
            className={cn(
              "px-8 py-6 text-base font-semibold transition-all rounded-meetmind-button",
              canProceed() && !isSubmitting
                ? "text-white bg-meetmind-primary hover:bg-meetmind-soft-blue shadow-[0_4px_6px_-1px_rgba(26,58,255,0.3),0_2px_4px_-1px_rgba(26,58,255,0.2)] hover:shadow-[0_10px_15px_-3px_rgba(26,58,255,0.4),0_4px_6px_-2px_rgba(26,58,255,0.2)]"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
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

