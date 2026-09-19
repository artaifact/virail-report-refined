import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  TrendingUp, 
  Layers, 
  BookOpen, 
  Wrench, 
  Maximize2, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { UnifiedActionabilityScore } from '@/types/scoring';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MethodologyModal } from './MethodologyModal';

interface ActionabilityScoreDetailProps {
  unified: UnifiedActionabilityScore | null;
  domain?: string;
  onOpenModal?: () => void;
  onSwitchToFullView?: () => void;
  isModalView?: boolean;
}

export const ActionabilityScoreDetail: React.FC<ActionabilityScoreDetailProps> = ({
  unified,
  domain = 'tally.so',
  onOpenModal,
  onSwitchToFullView,
  isModalView = false,
}) => {
  const navigate = useNavigate();
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [allExpanded, setAllExpanded] = useState(false);

  const overallScore = unified?.overallScore ?? (unified as any)?.score ?? 63;
  const grade = unified?.grade || 'C';

  const level1 = unified?.levels?.found_and_cited;
  const level2 = unified?.levels?.understood_and_preferred;
  const level3 = unified?.levels?.actionable_and_transacting;

  // Calcul dynamique du gain potentiel pour atteindre le Grade A (91 pts)
  const potentialGain = Math.max(8, 91 - overallScore);
  const fixesCount = unified?.topFixes?.length || 3;

  // Métriques calculées dynamiquement
  const l1CitationRate = level1?.metrics?.[0]?.score ?? level1?.score ?? 68;
  const l1SourceAuthority = level1?.metrics?.[1]?.score ?? Math.round(l1CitationRate * 0.9);
  const l1Sentiment = level1?.metrics?.[2]?.score ?? Math.round(l1CitationRate * 1.05);

  const l2Schema = level2?.metrics?.[0]?.score ?? 50;
  const l2Html = level2?.metrics?.[1]?.score ?? 50;
  const l2Clarity = level2?.metrics?.[3]?.score ?? level2?.metrics?.[2]?.score ?? 50;

  const l3LlmsTxt = (level3?.metrics?.[0]?.score ?? 0) > 0;
  const l3OpenApi = level3?.metrics?.[1]?.score ?? 20;
  const l3Journeys = level3?.metrics?.[4]?.score ?? 0;

  const toggleLevel = (lvl: number) => {
    setExpandedLevels(prev => ({
      ...prev,
      [lvl]: !prev[lvl],
    }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    setExpandedLevels({
      1: nextState,
      2: nextState,
      3: nextState,
    });
  };

  // Grade color helper
  const getGradeColor = (g: string) => {
    if (g === 'A' || g === 'A+') return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (g === 'B') return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
    if (g === 'C') return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className={`space-y-6 ${isModalView ? 'p-1' : 'w-full'}`}>
      {/* ─── Hero / Header Card (shadcn Card) ──────────────────────────────── */}
      <Card className="rounded-xl border border-border shadow-xs relative overflow-hidden bg-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              {/* Grade Badge */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border flex flex-col items-center justify-center shrink-0 transition-colors ${getGradeColor(grade)}`}>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {grade}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                  Grade
                </span>
              </div>

              {/* Score & Title info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Score d'Actionnabilité Unifié : <span className="text-primary">{overallScore}/100</span>
                  </h2>
                  <Badge 
                    variant={overallScore >= 80 ? 'default' : overallScore >= 50 ? 'secondary' : 'destructive'} 
                    className="text-xs font-medium"
                  >
                    {overallScore >= 80 ? 'Excellente visibilité' : overallScore >= 60 ? 'Maturité intermédiaire' : 'Optimisation requise'}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Évaluation holistique en 3 niveaux pour <strong className="text-foreground">{domain}</strong> : visibilité générative multi-LLM, structure sémantique et réactivité machine-to-machine.
                </p>

                {/* Échelle des grades dans un Popover épuré pour réduire la charge cognitive */}
                <div className="pt-1 flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2.5 py-1 rounded-lg border border-border/60 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Barème des grades</span>
                        <span className="font-semibold text-foreground">(Actuel : {grade})</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3 text-xs space-y-2 bg-popover border-border shadow-md" align="start">
                      <div className="font-semibold text-foreground pb-1 border-b border-border flex items-center justify-between">
                        <span>Échelle d'actionnabilité Viraill</span>
                        <Badge variant="outline" className="text-[10px] font-mono">Actuel: {grade}</Badge>
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        <div className={`flex items-center justify-between p-1.5 rounded-md ${grade === 'A' || grade === 'A+' ? 'bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}>
                          <span>Grade A / A+</span>
                          <span className="font-mono">≥ 80 pts (Agentic Native)</span>
                        </div>
                        <div className={`flex items-center justify-between p-1.5 rounded-md ${grade === 'B' ? 'bg-blue-500/15 font-semibold text-blue-600 dark:text-blue-400' : ''}`}>
                          <span>Grade B</span>
                          <span className="font-mono">65 - 79 pts (Haute maturité)</span>
                        </div>
                        <div className={`flex items-center justify-between p-1.5 rounded-md ${grade === 'C' ? 'bg-amber-500/15 font-semibold text-amber-600 dark:text-amber-400' : ''}`}>
                          <span>Grade C</span>
                          <span className="font-mono">50 - 64 pts (Intermédiaire)</span>
                        </div>
                        <div className={`flex items-center justify-between p-1.5 rounded-md ${grade === 'D' ? 'bg-rose-500/15 font-semibold text-rose-600 dark:text-rose-400' : ''}`}>
                          <span>Grade D</span>
                          <span className="font-mono">35 - 49 pts (Optimisation requise)</span>
                        </div>
                        <div className={`flex items-center justify-between p-1.5 rounded-md ${grade === 'F' ? 'bg-destructive/15 font-semibold text-destructive' : ''}`}>
                          <span>Grade F</span>
                          <span className="font-mono">&lt; 35 pts (Non découvrable)</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Pondération : Niveau 1 (40%) · Niveau 2 (30%) · Niveau 3 (30%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Simulation */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-stretch md:self-auto justify-center">
              <div className="p-3 rounded-xl border border-border bg-muted/40 flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Potentiel : +{potentialGain} pts</span>
                  <p className="text-[11px] text-muted-foreground">Passage au Grade A possible via {fixesCount} correctif{fixesCount > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/ameliorer')}
                  className="flex-1 text-xs font-semibold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Appliquer</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMethodologyOpen(true)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  <span>Méthode</span>
                </Button>

                {onSwitchToFullView && isModalView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSwitchToFullView}
                    className="text-xs font-medium cursor-pointer"
                    title="Afficher en pleine page sur le tableau de bord"
                  >
                    <Maximize2 className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">Plein écran</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Global Progress Bar via shadcn Progress */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Actionnabilité globale calculée</span>
              <span className="font-semibold text-foreground">{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-2 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* ─── Control Bar for the 3 Level Cards ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Paliers d'Actionnabilité & Diagnostic</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analyse segmentée par maturité IA. Cliquez sur une carte pour explorer les métriques détaillées.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleAll}
          className="text-xs font-medium gap-1.5 h-8 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{allExpanded ? 'Vue synthétique' : 'Déplier tous les détails'}</span>
        </Button>
      </div>

      {/* ─── The 3 Canonical Pillars Cards with Progressive Disclosure ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Niveau 1 : Être trouvé & cité */}
        <Card className="rounded-xl border border-border shadow-xs flex flex-col justify-between bg-card transition-all hover:border-border/80">
          <CardHeader className="p-5 pb-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                Niveau 1 (40%)
              </Badge>
              <Badge 
                variant={level1?.score && level1.score >= 70 ? 'default' : 'secondary'} 
                className="text-xs font-semibold"
              >
                {level1?.score ?? 68}/100
              </Badge>
            </div>

            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <span>Être trouvé & cité</span>
            </CardTitle>

            <CardDescription className="text-xs text-muted-foreground line-clamp-2">
              Part de voix et fréquence de recommandation dans les réponses de ChatGPT, Perplexity, Gemini, Claude.
            </CardDescription>

            {/* Glanceable Maturity Bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                <span>Score palier 1</span>
                <span className="font-semibold text-foreground">{level1?.score ?? 68}%</span>
              </div>
              <Progress value={level1?.score ?? 68} className="h-1.5 bg-muted" />
            </div>
          </CardHeader>

          {/* Collapsible Granular Content */}
          {expandedLevels[1] ? (
            <CardContent className="p-5 pt-0 space-y-3 animate-in fade-in-50 duration-200">
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Taux de citation multi-modèles</span>
                    <span className="font-medium text-foreground">{l1CitationRate}%</span>
                  </div>
                  <Progress value={l1CitationRate} className="h-1.5 bg-muted" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Autorité des domaines sources</span>
                    <span className="font-medium text-foreground">{l1SourceAuthority}%</span>
                  </div>
                  <Progress value={l1SourceAuthority} className="h-1.5 bg-muted" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Sentiment comparatif vs concurrents</span>
                    <span className="font-medium text-foreground">{l1Sentiment}%</span>
                  </div>
                  <Progress value={l1Sentiment} className="h-1.5 bg-muted" />
                </div>
              </div>

              <div className="w-full text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60 mt-2">
                <strong className="text-foreground">Diagnostic :</strong> {level1?.keyObservations?.[0] || 'Présence recensée mais encore dépassée par les leaders sur les requêtes à forte intention commerciale.'}
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-5 pt-0 pb-2">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{level1?.keyObservations?.[0] || 'Présence recensée · 3 indicateurs monitorés'}</span>
              </div>
            </CardContent>
          )}

          <CardFooter className="p-4 pt-1 border-t border-border/50 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLevel(1)}
              className="w-full text-xs text-muted-foreground hover:text-foreground h-8 justify-between cursor-pointer"
            >
              <span>{expandedLevels[1] ? 'Masquer les métriques' : 'Voir les 3 indicateurs & diagnostic'}</span>
              {expandedLevels[1] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Niveau 2 : Être compris & choisi */}
        <Card className="rounded-xl border border-border shadow-xs flex flex-col justify-between bg-card transition-all hover:border-border/80">
          <CardHeader className="p-5 pb-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                Niveau 2 (30%)
              </Badge>
              <Badge 
                variant={level2?.score && level2.score >= 70 ? 'default' : 'secondary'} 
                className="text-xs font-semibold"
              >
                {level2?.score ?? 54}/100
              </Badge>
            </div>

            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <span>Être compris & choisi</span>
            </CardTitle>

            <CardDescription className="text-xs text-muted-foreground line-clamp-2">
              Lisibilité de l'offre pour les extracteurs IA : balisage Schema.org JSON-LD, sémantique HTML, netteté des entités.
            </CardDescription>

            {/* Glanceable Maturity Bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                <span>Score palier 2</span>
                <span className="font-semibold text-foreground">{level2?.score ?? 54}%</span>
              </div>
              <Progress value={level2?.score ?? 54} className="h-1.5 bg-muted" />
            </div>
          </CardHeader>

          {/* Collapsible Granular Content */}
          {expandedLevels[2] ? (
            <CardContent className="p-5 pt-0 space-y-3 animate-in fade-in-50 duration-200">
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Données structurées (Schema.org)</span>
                    <span className="font-medium text-foreground">
                      {l2Schema}% ({l2Schema >= 70 ? 'Complet' : l2Schema >= 30 ? 'Partiel' : 'Absent'})
                    </span>
                  </div>
                  <Progress value={l2Schema} className="h-1.5 bg-muted" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Structure sémantique HTML (Hn, tableaux)</span>
                    <span className="font-medium text-foreground">{l2Html}%</span>
                  </div>
                  <Progress value={l2Html} className="h-1.5 bg-muted" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Clarté factuelle & extraction de tarifs</span>
                    <span className="font-medium text-foreground">{l2Clarity}%</span>
                  </div>
                  <Progress value={l2Clarity} className="h-1.5 bg-muted" />
                </div>
              </div>

              <div className="w-full text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60 mt-2">
                <strong className="text-foreground">Diagnostic :</strong> {level2?.keyObservations?.[0] || 'Risque d\'hallucination ou de mauvaise interprétation des offres payantes par manque de JSON-LD explicite.'}
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-5 pt-0 pb-2">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">
                  {l2Schema >= 70 ? 'Données structurées conformes' : 'Risque d\'hallucination tarifs · Balisage partiel'}
                </span>
              </div>
            </CardContent>
          )}

          <CardFooter className="p-4 pt-1 border-t border-border/50 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLevel(2)}
              className="w-full text-xs text-muted-foreground hover:text-foreground h-8 justify-between cursor-pointer"
            >
              <span>{expandedLevels[2] ? 'Masquer les métriques' : 'Voir les 3 indicateurs & diagnostic'}</span>
              {expandedLevels[2] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Niveau 3 : Être actionnable (M2M) */}
        <Card className="rounded-xl border border-border shadow-xs flex flex-col justify-between bg-card transition-all hover:border-border/80">
          <CardHeader className="p-5 pb-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                Niveau 3 (30%)
              </Badge>
              <Badge 
                variant={level3?.score && level3.score >= 50 ? 'default' : 'destructive'}
                className="text-xs font-semibold"
              >
                {level3?.score ?? 4}/100
              </Badge>
            </div>

            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Être actionnable (M2M)</span>
            </CardTitle>

            <CardDescription className="text-xs text-muted-foreground line-clamp-2">
              Capacité d'un agent autonome (ChatGPT Operator, Claude Computer Use) à interagir et finaliser des actions.
            </CardDescription>

            {/* Glanceable Maturity Bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                <span>Score palier 3 {level3?.score && level3.score >= 50 ? '' : '(Critique)'}</span>
                <span className={`font-semibold ${level3?.score && level3.score >= 50 ? 'text-foreground' : 'text-destructive'}`}>
                  {level3?.score ?? 4}%
                </span>
              </div>
              <Progress value={level3?.score ?? 4} className="h-1.5 bg-muted" />
            </div>
          </CardHeader>

          {/* Collapsible Granular Content */}
          {expandedLevels[3] ? (
            <CardContent className="p-5 pt-0 space-y-3 animate-in fade-in-50 duration-200">
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Aiguillage /llms.txt</span>
                    <span className={`font-medium ${l3LlmsTxt ? 'text-emerald-500 font-semibold' : 'text-destructive'}`}>
                      {l3LlmsTxt ? 'Détecté (100%)' : 'Non détecté'}
                    </span>
                  </div>
                  <Progress value={l3LlmsTxt ? 100 : 15} className="h-1.5 bg-muted" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Contrat d'outils (OpenAPI 3.1)</span>
                    <span className={`font-medium ${l3OpenApi >= 80 ? 'text-emerald-500 font-semibold' : 'text-amber-500'}`}>
                      {l3OpenApi >= 80 ? 'Exposé' : l3OpenApi >= 20 ? 'Partiel' : 'Absent'}
                    </span>
                  </div>
                  <Progress value={l3OpenApi} className="h-1.5 bg-muted" />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                    <span>Validation par Parcours Réels (Journeys)</span>
                    <span className="font-medium text-foreground">{l3Journeys}% de succès</span>
                  </div>
                  <Progress value={l3Journeys} className="h-1.5 bg-muted" />
                </div>
              </div>

              <div className="w-full text-[11px] text-muted-foreground bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 mt-2">
                <strong className="text-destructive">Diagnostic :</strong> {level3?.keyObservations?.[0] || 'Blocage pour les agents M2M en l\'absence de fichier /llms.txt direct et d\'OpenAPI structurée.'}
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-5 pt-0 pb-2">
              <div className={`text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${l3LlmsTxt ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-destructive bg-destructive/10 border-destructive/20'}`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {l3LlmsTxt ? 'Agents M2M supportés (/llms.txt actif)' : 'Blocage critique : /llms.txt non détecté'}
                </span>
              </div>
            </CardContent>
          )}

          <CardFooter className="p-4 pt-1 border-t border-border/50 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLevel(3)}
              className="w-full text-xs text-muted-foreground hover:text-foreground h-8 justify-between cursor-pointer"
            >
              <span>{expandedLevels[3] ? 'Masquer les métriques' : 'Voir les 3 indicateurs & diagnostic'}</span>
              {expandedLevels[3] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* ─── Plan de Remédiation Prioritaire (shadcn Card) ────────────────── */}
      <Card className="rounded-xl border border-border shadow-xs bg-card">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>{fixesCount} Correctifs Prioritaires pour Atteindre le Grade A (91/100)</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Actions directes calculées par le moteur d'actionnabilité Viraill pour maximiser votre retour sur investissement génératif.
              </CardDescription>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-semibold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              <span>Générer le patch unifié (.patch)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 space-y-3">
          {(unified?.topFixes && unified.topFixes.length > 0 ? unified.topFixes : [
            {
              id: 'fix_llms_txt',
              title: 'Déployer un fichier /llms.txt à la racine du domaine',
              description: 'Fournit aux LLMs et agents un sommaire Markdown propre pointant vers vos pages clés sans coût de crawling inutile.',
              impact: 'high',
              effort: 'low',
              category: 'Agent-Readiness',
            },
            {
              id: 'fix_schema_org',
              title: 'Injecter le balisage Schema.org JSON-LD (Product & FAQPage)',
              description: 'Permet à ChatGPT et Perplexity d\'extraire instantanément vos fonctionnalités et plans tarifaires sans ambiguïté.',
              impact: 'high',
              effort: 'low',
              category: 'Sémantique',
            },
            {
              id: 'fix_openapi',
              title: 'Exposer le contrat machine OpenAPI 3.1 (/openapi.json)',
              description: 'Transforme votre site de simple vitrine en API appelable directement par les agents autonomes de vos prospects.',
              impact: 'medium',
              effort: 'medium',
              category: 'M2M & API',
            },
          ]).map((fix, idx) => (
            <div key={fix.id || idx} className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-muted text-foreground font-semibold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-border/80">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-semibold text-foreground">{fix.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-normal ${
                        fix.impact === 'high'
                          ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                      }`}
                    >
                      Impact {fix.impact === 'high' ? 'Fort (+12 à +15 pts)' : 'Moyen (+8 pts)'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Effort {fix.effort === 'low' ? 'Faible (5-10 min)' : 'Moyen'}
                    </Badge>
                    {(fix as any).category && (
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                        {(fix as any).category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {fix.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/ameliorer')}
                className="text-xs font-medium text-muted-foreground hover:text-foreground self-start sm:self-auto shrink-0 h-auto p-1 cursor-pointer"
              >
                <span>Voir le code</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
