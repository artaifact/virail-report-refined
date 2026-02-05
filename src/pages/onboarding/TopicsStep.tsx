import { useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
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

// Types de sites simplifiés par secteur
const SITE_TYPES: Record<string, { id: string; label: string; icon: string; description: string }[]> = {
  ecommerce: [
    { id: 'boutique', label: 'Boutique en ligne', icon: '🛍️', description: 'Vente directe de produits' },
    { id: 'marketplace', label: 'Marketplace', icon: '🏪', description: 'Plateforme multi-vendeurs' },
    { id: 'dropshipping', label: 'Dropshipping', icon: '📦', description: 'Vente sans stock' },
    { id: 'subscription', label: 'Box / Abonnement', icon: '📬', description: 'Produits récurrents' },
    { id: 'b2b', label: 'E-commerce B2B', icon: '🏢', description: 'Vente aux professionnels' },
    { id: 'luxury', label: 'Luxe / Premium', icon: '💎', description: 'Produits haut de gamme' },
  ],
  saas: [
    { id: 'b2b_saas', label: 'SaaS B2B', icon: '🏢', description: 'Logiciel pour entreprises' },
    { id: 'b2c_saas', label: 'SaaS B2C', icon: '👤', description: 'Logiciel grand public' },
    { id: 'api_platform', label: 'Plateforme API', icon: '🔌', description: 'Services pour développeurs' },
    { id: 'nocode', label: 'No-code / Low-code', icon: '🧩', description: 'Outils sans code' },
    { id: 'ai_tool', label: 'Outil IA', icon: '🤖', description: 'Intelligence artificielle' },
    { id: 'productivity', label: 'Productivité', icon: '⚡', description: 'Gestion et organisation' },
  ],
  travel: [
    { id: 'ota', label: 'Agence en ligne', icon: '🌐', description: 'Réservation de voyages' },
    { id: 'hotel', label: 'Hôtel / Hébergement', icon: '🏨', description: 'Réservation chambres' },
    { id: 'airline', label: 'Compagnie aérienne', icon: '✈️', description: 'Vols et billets' },
    { id: 'tour_operator', label: 'Tour opérateur', icon: '🗺️', description: 'Circuits organisés' },
    { id: 'experience', label: 'Expériences', icon: '🎭', description: 'Activités et visites' },
    { id: 'rental', label: 'Location', icon: '🚗', description: 'Véhicules et équipements' },
  ],
  finance: [
    { id: 'bank', label: 'Banque', icon: '🏦', description: 'Services bancaires' },
    { id: 'insurance', label: 'Assurance', icon: '🛡️', description: 'Couverture et protection' },
    { id: 'fintech', label: 'Fintech', icon: '💳', description: 'Services financiers innovants' },
    { id: 'crypto', label: 'Crypto / Web3', icon: '🪙', description: 'Actifs numériques' },
    { id: 'investment', label: 'Investissement', icon: '📈', description: 'Gestion de patrimoine' },
    { id: 'credit', label: 'Crédit', icon: '💰', description: 'Prêts et financement' },
  ],
  default: [
    { id: 'corporate', label: 'Site corporate', icon: '🏢', description: 'Présentation entreprise' },
    { id: 'service', label: 'Site de services', icon: '🛠️', description: 'Offre de prestations' },
    { id: 'media', label: 'Média / Blog', icon: '📰', description: 'Contenu éditorial' },
    { id: 'community', label: 'Communauté', icon: '👥', description: 'Plateforme sociale' },
    { id: 'directory', label: 'Annuaire', icon: '📋', description: 'Listing et comparaison' },
    { id: 'lead_gen', label: 'Génération de leads', icon: '🎯', description: 'Acquisition clients' },
  ],
};

export function TopicsStep() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer le secteur depuis les paramètres URL (par défaut: ecommerce)
  const sectorId = searchParams.get('sector') || 'ecommerce';
  const siteTypes = SITE_TYPES[sectorId] || SITE_TYPES.default;

  const getTimeSpent = () => {
    const startTime = startTimes[3] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const canProceed = () => {
    return selectedType !== '';
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      // Sauvegarder l'étape avec le type sélectionné
      await completeStep('topics', 3, getTimeSpent());

      await refreshStatus();
      // Passer le type sélectionné à l'étape suivante
      navigate(`/onboarding/results?sector=${sectorId}&type=${selectedType}`);
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
        <h1 className="text-4xl font-bold text-foreground">Quel est votre type de site ?</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg">
          Sélectionnez le type qui correspond le mieux à votre activité pour des <span className="font-semibold text-meetmind-primary">recommandations personnalisées</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {siteTypes.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              className={cn(
                'flex flex-col items-center gap-2 p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md',
                isSelected
                  ? 'shadow-lg border-meetmind-primary bg-meetmind-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
              onClick={() => setSelectedType(type.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center shadow-md">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <span className={cn('font-semibold block', isSelected ? 'text-foreground' : 'text-foreground/80')}>
                    {type.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </div>
              </div>
            </div>
          );
        })}
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
