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
      console.log('✅ canProceed (agency):', result, { agencyName, agencyUrl });
      return result;
    }
    console.log('✅ canProceed (in-house): true');
    return true;
  };

  const handleNext = async () => {
    console.log('🚀 handleNext called', { accountType, agencyName, agencyUrl, canProceed: canProceed() });
    
    if (!canProceed()) {
      console.warn('⚠️ Cannot proceed - validation failed');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('📝 Saving step...');
      // Sauvegarder l'étape
      await completeStep('setup', 1, getTimeSpent());
      console.log('✅ Step completed');

      console.log('💾 Saving account data...');
      // Sauvegarder les données de compte
      await onboardingService.saveAccountData({
        account_type: accountType === 'agency' ? 'agency' : 'in_house',
        agency_name: accountType === 'agency' ? agencyName.trim() : undefined,
        agency_url: accountType === 'agency' ? agencyUrl.trim() : undefined,
        location_country: 'France', // Valeur par défaut, sera mis à jour à l'étape suivante
        location_country_code: 'FR',
        onboarding_step: 'project',
      });
      console.log('✅ Account data saved');

      console.log('🔄 Refreshing status...');
      await refreshStatus();
      console.log('✅ Status refreshed');
      
      console.log('🧭 Navigating to /onboarding/project');
      navigate('/onboarding/project');
    } catch (error: any) {
      console.error('❌ Error in handleNext:', error);
      if (error?.message?.includes('403')) {
        // Onboarding déjà complété
        console.log('⚠️ Onboarding already completed, redirecting to /');
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
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-slate-900">Type de compte</h1>
        <p className="text-slate-600 text-lg">
          Optimisez votre présence dans les moteurs génératifs (ChatGPT, Perplexity, Gemini) et mesurez votre visibilité dans leurs réponses
        </p>
      </div>

      <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as 'agency' | 'in-house')}>
        <div className="space-y-4">
          {/* Agency Card */}
          <label
            className={cn(
              'relative flex cursor-pointer rounded-xl border-2 p-6 transition-all shadow-sm hover:shadow-md',
              accountType === 'agency'
                ? 'shadow-lg'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            )}
            style={accountType === 'agency' ? {
              borderColor: '#3B82F6',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)'
            } : undefined}
          >
            <RadioGroupItem value="agency" id="agency" className="sr-only" />
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                {accountType === 'agency' ? (
                  <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                )}
                <h3 className="font-bold text-xl text-slate-900">Agence</h3>
              </div>
              <p className="text-slate-600 mb-5 text-base">
                Gérez l'optimisation SEO/LLM pour plusieurs marques clientes et suivez leur performance dans les réponses des assistants IA
              </p>
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'agency' ? 'text-meetmind-primary' : 'text-slate-400'
                  )} />
                  <span>Gestion de plusieurs projets SEO/LLM</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'agency' ? 'text-meetmind-primary' : 'text-slate-400'
                  )} />
                  <span>Tableaux de bord par client</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'agency' ? 'text-meetmind-primary' : 'text-slate-400'
                  )} />
                  <span>Rapports de performance multi-marques</span>
                </div>
              </div>
            </div>
          </label>

          {/* In-house Card */}
          <label
            className={cn(
              'relative flex cursor-pointer rounded-xl border-2 p-6 transition-all shadow-sm hover:shadow-md',
              accountType === 'in-house'
                ? 'shadow-lg'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            )}
            style={accountType === 'in-house' ? {
              borderColor: '#3B82F6',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)'
            } : undefined}
          >
            <RadioGroupItem value="in-house" id="in-house" className="sr-only" />
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                {accountType === 'in-house' ? (
                  <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                )}
                <h3 className="font-bold text-xl text-slate-900">Interne</h3>
              </div>
              <p className="text-slate-600 mb-5 text-base">
                Entreprises optimisant leur propre marque pour apparaître dans les réponses des LLM
              </p>
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'in-house' ? 'text-meetmind-primary' : 'text-slate-400'
                  )} />
                  <span>Focus sur votre marque unique</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'in-house' ? 'text-meetmind-primary' : 'text-slate-400'
                  )} />
                  <span>Analytics détaillées de visibilité LLM</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Check className={cn(
                    "h-4 w-4 flex-shrink-0",
                    accountType === 'in-house' ? 'text-meetmind-primary' : 'text-slate-400'
                  )} />
                  <span>Recommandations d'optimisation personnalisées</span>
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
            <p className="text-xs text-slate-500">Le nom de votre agence qui gérera les projets SEO/LLM</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agency-url">Site web de l'agence</Label>
            <Input
              id="agency-url"
              placeholder="mon-agence.com"
              value={agencyUrl}
              onChange={(e) => setAgencyUrl(e.target.value)}
            />
            <p className="text-xs text-slate-500">L'URL de votre site web professionnel</p>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6">
          <Button
            onClick={() => {
              console.log('🖱️ Button clicked');
              handleNext();
            }}
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
            {isSubmitting ? 'Chargement...' : 'Suivant'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
      </div>
    </div>
  );
}

