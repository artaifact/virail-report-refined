import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Eye, SmilePlus, Hash, ArrowUpDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';
import { onboardingService } from '@/services/onboardingService';

interface OnboardingContext {
  status: any;
  refreshStatus: () => Promise<void>;
  startTimes: Record<number, number>;
}

const FAKE_COMPETITORS = [
  { name: 'Concurrent A', initial: 'A' },
  { name: 'Concurrent B', initial: 'B' },
  { name: 'Concurrent C', initial: 'C' },
  { name: 'Concurrent D', initial: 'D' },
  { name: 'Concurrent E', initial: 'E' },
];

export function ResultsStep() {
  const navigate = useNavigate();
  const { status, refreshStatus, startTimes } = useOutletContext<OnboardingContext>();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandName, setBrandName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(true);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeLabel, setAnalyzeLabel] = useState('Connexion aux LLMs...');
  const [visibleRows, setVisibleRows] = useState(-1); // -1 = rien, 0 = titre+header, 1 = brand row, 2-6 = concurrents, 7 = CTA+boutons

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const data = await onboardingService.getAccountData();
        setBrandName(data.brand_name || '');
      } catch {
        // Fallback silencieux
      } finally {
        setLoading(false);
      }
    };
    fetchAccountData();
  }, []);

  // Animation de chargement simulée
  useEffect(() => {
    if (loading) return;

    const steps = [
      { progress: 5, label: 'Connexion aux LLMs...', delay: 1000 },
      { progress: 15, label: 'Analyse de votre marque...', delay: 4000 },
      { progress: 30, label: 'Recherche des concurrents...', delay: 8000 },
      { progress: 50, label: 'Calcul de la visibilité...', delay: 13000 },
      { progress: 70, label: 'Analyse du sentiment...', delay: 18000 },
      { progress: 85, label: 'Génération du classement...', delay: 23000 },
      { progress: 95, label: 'Finalisation des résultats...', delay: 27000 },
      { progress: 100, label: 'Terminé !', delay: 29000 },
    ];

    const timers = steps.map((step) =>
      setTimeout(() => {
        setAnalyzeProgress(step.progress);
        setAnalyzeLabel(step.label);
      }, step.delay)
    );

    const doneTimer = setTimeout(() => setAnalyzing(false), 30000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [loading]);

  // Apparition progressive des lignes après l'analyse
  useEffect(() => {
    if (analyzing) return;
    // totalRows: 0=titre+header, 1=brand, 2..6=concurrents, 7=CTA+boutons
    const totalRows = FAKE_COMPETITORS.length + 3;
    let current = -1;
    const interval = setInterval(() => {
      current++;
      setVisibleRows(current);
      if (current >= totalRows) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [analyzing]);

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

  if (loading || analyzing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6 w-full max-w-sm">
          <div className="w-14 h-14 border-4 border-meetmind-primary/20 border-t-meetmind-primary rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <p className="text-foreground font-semibold text-lg">Analyse en cours</p>
            <p className="text-muted-foreground text-sm">{analyzeLabel}</p>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-meetmind-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${analyzeProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{analyzeProgress}%</p>
        </div>
      </div>
    );
  }

  const rowClass = (rowIndex: number) =>
    cn(
      'transition-all duration-500 ease-out',
      visibleRows >= rowIndex
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-3'
    );

  return (
    <div className="space-y-8">
      <div className={cn("text-center space-y-3", rowClass(0))}>
        <h1 className="text-4xl font-bold text-foreground">Aperçu de votre classement</h1>
        <p className="text-muted-foreground text-lg">
          Découvrez comment votre marque se positionne face à vos concurrents
        </p>
      </div>

      {/* Competitor ranking table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className={cn("grid grid-cols-[50px_1fr_120px_120px_120px] border-b border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground", rowClass(0))}>
          <div className="flex items-center gap-1">
            <Hash className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            Marques
            <ArrowUpDown className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <Eye className="h-3.5 w-3.5" />
            Visibilité
            <ArrowUpDown className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <SmilePlus className="h-3.5 w-3.5" />
            Sentiment
            <ArrowUpDown className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            Position
            <ArrowUpDown className="h-3 w-3" />
          </div>
        </div>

        {/* Row 1: User's brand (highlighted) */}
        <div className={cn("grid grid-cols-[50px_1fr_120px_120px_120px] px-4 py-4 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 items-center ring-2 ring-blue-500 ring-inset", rowClass(1))}>
          <div className="font-semibold text-foreground">1</div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-foreground uppercase">
              {brandName ? brandName.charAt(0) : 'B'}
            </div>
            <span className="font-semibold text-foreground">{brandName || 'Votre marque'}</span>
          </div>
          <div className="text-center font-medium text-foreground">0%</div>
          <div className="flex justify-center">
            <div className="h-3 w-16 rounded-full bg-gradient-to-r from-green-400 to-green-500"></div>
          </div>
          <div className="flex justify-center">
            <div className="h-3 w-16 rounded-full bg-gradient-to-r from-green-400 to-green-500"></div>
          </div>
        </div>

        {/* Rows 2-6: Fake competitors (blurred) */}
        {FAKE_COMPETITORS.map((competitor, index) => (
          <div
            key={index}
            className={cn("grid grid-cols-[50px_1fr_120px_120px_120px] px-4 py-4 border-b border-border items-center", rowClass(index + 2))}
          >
            <div className="font-medium text-muted-foreground">{index + 2}</div>
            <div className="flex items-center gap-3 blur-[4px] select-none">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {competitor.initial}
              </div>
              <span className="font-medium text-muted-foreground">{competitor.name}</span>
            </div>
            <div className="text-center font-medium text-muted-foreground blur-[4px] select-none">0%</div>
            <div className="flex justify-center blur-[4px]">
              <div className="h-3 w-16 rounded-full bg-gradient-to-r from-green-300 to-green-400"></div>
            </div>
            <div className="flex justify-center blur-[4px]">
              <div className="h-3 w-16 rounded-full bg-gradient-to-r from-green-300 to-green-400"></div>
            </div>
          </div>
        ))}

        {/* CTA overlay on last row */}
        <div className={cn("relative", rowClass(FAKE_COMPETITORS.length + 2))}>
          <div className="absolute inset-0 flex items-center justify-center -mt-12">
            <Button
              variant="outline"
              className="bg-card border-border shadow-lg text-sm font-medium gap-2"
              onClick={handleNext}
            >
              <Lock className="h-3.5 w-3.5" />
              Découvrir le classement de vos concurrents
            </Button>
          </div>
        </div>

      </div>

      <div className={cn("flex items-center justify-between pt-6", rowClass(FAKE_COMPETITORS.length + 3))}>
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
