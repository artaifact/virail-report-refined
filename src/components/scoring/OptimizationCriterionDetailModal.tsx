import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Bot,
  Code,
  CheckCheck,
  Zap,
} from 'lucide-react';

export interface EvaluatedCriterion {
  id: string;
  num: number;
  title?: string;
  question: string;
  icon?: any;
  tags: Array<{ label: string; ok: boolean }>;
  score: number;
  targetTab: 'overview' | 'schemas' | 'meta' | 'llms' | 'robots' | 'htmldiff' | 'simulation' | 'agentic';
  checks: string[];
  advice: string;
}

interface OptimizationCriterionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCriterionId: string;
  onSelectCriterion: (id: string) => void;
  criteria: EvaluatedCriterion[];
  onNavigateTab?: (tab: 'overview' | 'schemas' | 'meta' | 'llms' | 'robots' | 'htmldiff' | 'simulation' | 'agentic') => void;
}

const TAB_SHORT_NAMES: Record<string, { label: string; short: string; icon: React.ComponentType<{ className?: string }> }> = {
  'crit-1': { label: '1. Découverte IA', short: 'Découverte', icon: Search },
  'crit-2': { label: '2. Accès Crawlers', short: 'Crawlers', icon: Bot },
  'crit-3': { label: '3. Compréhension', short: 'Sémantique', icon: Sparkles },
  'crit-4': { label: '4. Endpoints M2M', short: 'Endpoints', icon: Code },
  'crit-5': { label: '5. Validité Schémas', short: 'Schémas', icon: CheckCheck },
  'crit-6': { label: '6. Action & Tarifs', short: 'Actions', icon: Zap },
};

const TAB_TARGET_LABELS: Record<string, string> = {
  overview: 'Diagnostic & Piliers',
  schemas: 'Schémas JSON-LD',
  meta: 'Balises Meta',
  llms: 'llms.txt',
  robots: 'robots.txt',
  htmldiff: 'Comparaison HTML',
  simulation: 'Simulation',
  agentic: 'Protocoles Agentiques',
};

export const OptimizationCriterionDetailModal: React.FC<OptimizationCriterionDetailModalProps> = ({
  isOpen,
  onClose,
  selectedCriterionId,
  onSelectCriterion,
  criteria,
  onNavigateTab,
}) => {
  const currentIndex = criteria.findIndex((c) => c.id === selectedCriterionId);
  const activeCriterion = criteria[currentIndex] || criteria[0];

  if (!activeCriterion) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < criteria.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectCriterion(criteria[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectCriterion(criteria[currentIndex + 1].id);
    }
  };

  const getScoreInfo = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Conforme',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        progressBg: 'bg-emerald-500',
      };
    }
    if (score >= 65) {
      return {
        label: 'Bon',
        badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        progressBg: 'bg-blue-500',
      };
    }
    if (score >= 50) {
      return {
        label: 'À optimiser',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        progressBg: 'bg-amber-500',
      };
    }
    return {
      label: 'Non conforme',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      progressBg: 'bg-rose-500',
    };
  };

  const scoreInfo = getScoreInfo(activeCriterion.score);
  const Icon = activeCriterion.icon || Sparkles;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-card text-foreground border border-border shadow-2xl rounded-2xl font-sans">
        {/* Navigation Tabs between 6 Criteria (zéro scroll horizontal du modal) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mr-8 sm:mr-10 border-b border-border/70 scrollbar-none w-full min-w-0">
          {criteria.map((c) => {
            const isSelected = c.id === activeCriterion.id;
            const tabInfo = TAB_SHORT_NAMES[c.id] || { short: `Critère ${c.num}`, icon: Sparkles };
            const TabIcon = tabInfo.icon;
            const cScoreInfo = getScoreInfo(c.score);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCriterion(c.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{tabInfo.short}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : cScoreInfo.badgeBg
                  }`}
                >
                  {c.score}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Header */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  {activeCriterion.num}. {activeCriterion.title || `Critère ${activeCriterion.num}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {activeCriterion.question}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                {activeCriterion.score} / 100
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${scoreInfo.badgeBg}`}>
                {scoreInfo.label}
              </span>
            </div>
          </div>

          {/* Jauge fine de progression */}
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${scoreInfo.progressBg} transition-all duration-500`}
              style={{ width: `${Math.max(4, activeCriterion.score)}%` }}
            />
          </div>

          {/* Tags techniques */}
          {activeCriterion.tags && activeCriterion.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {activeCriterion.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                    tag.ok
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Points de contrôle machine */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Points de contrôle machine ({activeCriterion.checks.length})
            </span>
            <span className="text-[11px] text-muted-foreground">
              {activeCriterion.checks.filter(c => !c.toLowerCase().includes('absence') && !c.toLowerCase().includes('manquant')).length} conformes
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {activeCriterion.checks.map((check, idx) => {
              const isWarning = check.toLowerCase().includes('absence') || check.toLowerCase().includes('manquant') || check.toLowerCase().includes('attention');
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-foreground/90"
                >
                  {isWarning ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{check}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conseil GEO & Bouton d'action directe vers l'onglet */}
        <div className="p-3 sm:p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Recommandation d'Optimisation IA</span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {activeCriterion.advice}
          </p>
          {onNavigateTab && (
            <div className="pt-1 flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  onNavigateTab(activeCriterion.targetTab);
                  onClose();
                }}
                className="h-7 px-3 text-xs gap-1.5 font-semibold cursor-pointer shadow-xs"
              >
                <span>Ouvrir l'onglet {TAB_TARGET_LABELS[activeCriterion.targetTab] || activeCriterion.targetTab}</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Pied de modale : navigation séquentielle pure */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-xs mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={!hasPrev}
            className="gap-1.5 h-8 px-2.5 text-xs cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédent</span>
          </Button>

          <span className="text-[11px] text-muted-foreground font-medium">
            Critère {currentIndex + 1} sur {criteria.length}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={!hasNext}
            className="gap-1.5 h-8 px-2.5 text-xs cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
