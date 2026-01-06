import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { onboardingService } from '@/services/onboardingService';
import { useToast } from '@/hooks/use-toast';

interface OnboardingContext {
  status: any;
  refreshStatus: () => Promise<void>;
  startTimes: Record<number, number>;
}

const COUNTRIES = [
  { value: 'us', label: 'États-Unis', code: 'US' },
  { value: 'fr', label: 'France', code: 'FR' },
  { value: 'ca', label: 'Canada', code: 'CA' },
  { value: 'uk', label: 'Royaume-Uni', code: 'GB' },
  { value: 'de', label: 'Allemagne', code: 'DE' },
  { value: 'es', label: 'Espagne', code: 'ES' },
  { value: 'it', label: 'Italie', code: 'IT' },
  { value: 'be', label: 'Belgique', code: 'BE' },
  { value: 'ch', label: 'Suisse', code: 'CH' },
  { value: 'nl', label: 'Pays-Bas', code: 'NL' },
];

const getFlagUrl = (countryCode: string, size: 'w20' | 'w40' | 'w80' | 'w160' | 'w320' = 'w40') => {
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`;
};

export function ProjectStep() {
  const navigate = useNavigate();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [brandName, setBrandName] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [location, setLocation] = useState('fr');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCountry = COUNTRIES.find((c) => c.value === location) || COUNTRIES[1];

  const getTimeSpent = () => {
    const startTime = startTimes[2] || Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const canProceed = () => {
    return brandName.trim() !== '' && brandUrl.trim() !== '';
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      // Sauvegarder l'étape
      await completeStep('project', 2, getTimeSpent());

      // Sauvegarder les données de compte
      await onboardingService.saveAccountData({
        account_type: 'agency', // Sera récupéré depuis l'étape précédente côté backend
        brand_name: brandName.trim(),
        brand_url: brandUrl.trim(),
        location_country: selectedCountry.label,
        location_country_code: selectedCountry.code,
        onboarding_step: 'topics',
      });

      await refreshStatus();
      navigate('/onboarding/topics');
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
    navigate('/onboarding/setup');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-slate-900">Configurez votre premier projet</h1>
        <p className="text-slate-600 text-lg">
          Définissez la marque que vous souhaitez analyser et optimiser pour les moteurs génératifs
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-name">Nom de la marque</Label>
          <Input
            id="brand-name"
            placeholder="Ex: Votre Marque"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
          <p className="text-xs text-slate-500">Le nom exact de la marque que vous souhaitez analyser dans les LLM</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-url">Site web de la marque</Label>
          <Input
            id="brand-url"
            placeholder="exemple.com"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
          />
          <p className="text-xs text-slate-500">L'URL du site web que nous analyserons pour optimiser sa visibilité dans les LLM</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Zone géographique cible</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger id="location" className="w-full h-12">
              <SelectValue>
                <div className="flex items-center gap-3">
                  <img 
                    src={getFlagUrl(selectedCountry.code, 'w40')} 
                    alt={`Drapeau ${selectedCountry.label}`}
                    className="w-6 h-4 object-cover rounded-sm border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="font-medium">{selectedCountry.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value} className="py-3 pl-8">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getFlagUrl(country.code, 'w40')} 
                      alt={`Drapeau ${country.label}`}
                      className="w-6 h-4 object-cover rounded-sm border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="font-medium">{country.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

